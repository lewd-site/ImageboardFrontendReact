import EventEmitter, { Listener } from './event-emitter';

interface OwnPostDto {
  readonly id: number;
  readonly parent_id: number | null;
}

const DATABASE_NAME = 'imageboard';
const DATABASE_VERSION = 2;

const OWN_POST_IDS_STORE = 'own_post_ids';
const OWN_POST_IDS_PARENT_ID_INDEX = `${OWN_POST_IDS_STORE}_parent_id_idx`;

export const READY = 'ready';
export const OWN_POST_IDS_CHANGED = 'own_post_ids_changed';

export class Storage extends EventEmitter {
  protected _db: IDBDatabase | null = null;
  protected _ready = false;

  public get ready() {
    return this._ready;
  }

  public constructor() {
    super();

    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.addEventListener('upgradeneeded', (event: IDBVersionChangeEvent) => {
      const db = request.result;
      const transaction = request.transaction;

      switch (event.oldVersion) {
        case 0:
          db.createObjectStore(OWN_POST_IDS_STORE, {
            keyPath: 'id',
            autoIncrement: false,
          });

        case 1:
          const store = transaction?.objectStore(OWN_POST_IDS_STORE);
          store?.createIndex(OWN_POST_IDS_PARENT_ID_INDEX, 'parent_id', { unique: false });
          break;
      }
    });

    request.addEventListener('success', () => {
      this._db = request.result;
      this._ready = true;
      this.dispatch(READY);
    });
  }

  public onReady = (callback: Listener<void>) => {
    if (this.ready) {
      callback();
    } else {
      this.subscribe(READY, callback);
    }
  };

  public getOwnPostIds(parentId: number): Promise<number[]> {
    return new Promise((resolve, reject) => {
      this.onReady(() => {
        if (this._db === null) {
          return reject();
        }

        const transaction = this._db.transaction(OWN_POST_IDS_STORE, 'readonly');
        const store = transaction.objectStore(OWN_POST_IDS_STORE);
        const index = store.index(OWN_POST_IDS_PARENT_ID_INDEX);
        const request = index.getAll(parentId);
        request.addEventListener('success', () => {
          resolve(request.result.map((row) => row.id));
        });
      });
    });
  }

  public addOwnPost(data: OwnPostDto): Promise<void> {
    return new Promise((resolve, reject) => {
      this.onReady(() => {
        if (this._db === null) {
          return reject();
        }

        const transaction = this._db.transaction(OWN_POST_IDS_STORE, 'readwrite');
        const store = transaction.objectStore(OWN_POST_IDS_STORE);
        const request = store.add(data);
        request.addEventListener('success', () => {
          try {
            this.dispatch(OWN_POST_IDS_CHANGED);
          } catch (e) {
            return reject(e);
          }

          resolve();
        });
      });
    });
  }
}

export const storage = new Storage();

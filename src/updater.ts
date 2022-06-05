import { browsePosts, convertPostDtoToPost, isPostDto } from './api';
import config from './config';
import { Post } from './domain';

export type Listener = (newPosts: Post[]) => void;
export type Unsubscribe = () => void;

export interface ThreadUpdater {
  subscribe(listener: Listener): Unsubscribe;
  dispose(): void;
}

export abstract class ThreadUpdaterBase implements ThreadUpdater {
  protected readonly _listeners: Listener[] = [];

  public subscribe(listener: Listener): Unsubscribe {
    this._listeners.push(listener);
    return () => this._listeners.filter((l) => l !== listener);
  }

  protected _dispatch(newPosts: Post[]) {
    for (const listener of this._listeners) {
      listener(newPosts);
    }
  }

  public dispose() {
    this._listeners.length = 0;
  }
}

export class IntervalPoolingThreadUpdater extends ThreadUpdaterBase {
  protected readonly _interval: any;
  protected _lastPostId = 0;

  public constructor(
    public readonly slug: string,
    public readonly parentId: number,
    public readonly updateInterval = 10000
  ) {
    super();

    this._interval = setInterval(this._update, this.updateInterval);
  }

  protected _update = async () => {
    const newPosts = (await browsePosts(this.slug, this.parentId)).filter((post) => post.id > this._lastPostId);
    if (newPosts.length > 0) {
      this._dispatch(newPosts);
    }

    this._lastPostId = Math.max(this._lastPostId, ...newPosts.map((post) => post.id));
  };

  public dispose(): void {
    super.dispose();

    clearInterval(this._interval);
  }
}

export class SseThreadUpdater extends ThreadUpdaterBase {
  protected readonly _interval: any;
  protected _eventSource: EventSource | null = null;
  protected _lastPostId = 0;

  public constructor(
    public readonly slug: string,
    public readonly parentId: number,
    public readonly reconnectInterval = 10000
  ) {
    super();

    this._interval = setInterval(this._checkEventSource, this.reconnectInterval);
    this._createEventSource();
  }

  protected _checkEventSource = () => {
    if (this._eventSource === null || this._eventSource.readyState === EventSource.CLOSED) {
      this._createEventSource();
    }
  };

  protected _createEventSource = () => {
    this._eventSource = new EventSource(config.sse.url);
    this._eventSource.addEventListener('open', this._onOpen, { passive: true });
    this._eventSource.addEventListener('post_created', this._onPostCreated, { passive: true });
    this._eventSource.addEventListener('error', this._onError, { passive: true });
  };

  protected _onOpen = async () => {
    const newPosts = (await browsePosts(this.slug, this.parentId)).filter((post) => post.id > this._lastPostId);
    if (newPosts.length > 0) {
      this._dispatch(newPosts);
    }

    this._lastPostId = Math.max(this._lastPostId, ...newPosts.map((post) => post.id));
  };

  protected _onPostCreated = (event: any) => {
    const dto = JSON.parse(event.data);
    if (!isPostDto(dto)) {
      console.warn(`Invalid post DTO: ${event.data}`);
      return;
    }

    const post = convertPostDtoToPost(dto);
    if (post.slug === this.slug && post.parentId === this.parentId && post.id > this._lastPostId) {
      this._dispatch([post]);
      this._lastPostId = post.id;
    }
  };

  protected _onError = () => {
    this._eventSource?.close();
    this._eventSource = null;
  };

  public dispose(): void {
    super.dispose();

    clearInterval(this._interval);

    this._eventSource?.close();
    this._eventSource = null;
  }
}

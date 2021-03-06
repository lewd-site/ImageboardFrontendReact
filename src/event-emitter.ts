export type Listener<T> = (data: T) => void;
export type Unsubscribe = () => void;

export interface IEventEmitter {
  subscribe<T>(event: string, listener: Listener<T>): Unsubscribe;
  once<T>(event: string, listener: Listener<T>): Unsubscribe;
  dispatch<T>(event: string, data?: T): void;
  dispose(): void;
}

export class EventEmitter implements IEventEmitter {
  protected _listeners: { [event: string]: Listener<any>[] } = {};

  public subscribe<T>(event: string, listener: Listener<T>): Unsubscribe {
    if (!(event in this._listeners)) {
      this._listeners[event] = [];
    }

    this._listeners[event].push(listener);

    return () => {
      this._listeners[event] = this._listeners[event].filter((l) => l !== listener);
    };
  }

  public once<T>(event: string, listener: Listener<T>): Unsubscribe {
    const _listener = (data: T) => {
      try {
        listener(data);
      } finally {
        this._listeners[event] = this._listeners[event].filter((l) => l !== _listener);
      }
    };

    return this.subscribe(event, _listener);
  }

  public dispatch<T>(event: string, data?: T): void {
    if (!(event in this._listeners)) {
      return;
    }

    for (const listener of this._listeners[event]) {
      listener(data);
    }
  }

  public dispose(): void {
    for (const key of Object.keys(this._listeners)) {
      this._listeners[key].length = 0;
      delete this._listeners[key];
    }
  }
}

export default EventEmitter;

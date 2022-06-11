export type Listener<T> = (data?: T) => void;
export type Unsubscribe = () => void;

export class EventEmitter {
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

  public dispatch<T>(event: string, data?: T): void {
    if (!(event in this._listeners)) {
      return;
    }

    for (const listener of this._listeners[event]) {
      listener(data);
    }
  }
}

export default EventEmitter;

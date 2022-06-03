const SETTINGS_NSFW = 'settings.nsfw';
const TRUE = 'true';
const FALSE = 'false';

type Listener = (settings: Settings) => void;
type Unsubscribe = () => void;

export class Settings {
  protected readonly listeners: Listener[] = [];

  protected _nsfw: boolean;

  public constructor() {
    this._nsfw = localStorage.getItem(SETTINGS_NSFW) === TRUE;
  }

  public get nsfw() {
    return this._nsfw;
  }

  public set nsfw(nsfw: boolean) {
    this._nsfw = nsfw;
    this.listeners.forEach((listener) => listener(this));
    localStorage.setItem(SETTINGS_NSFW, nsfw ? TRUE : FALSE);
  }

  public subscribe(listener: Listener): Unsubscribe {
    this.listeners.push(listener);

    return () => this.listeners.filter((l) => l !== listener);
  }
}

export const settings = new Settings();

export default settings;

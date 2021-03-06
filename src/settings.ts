const SETTINGS_THEME = 'settings.theme';
const SETTINGS_NSFW = 'settings.nsfw';
const SETTINGS_FORM = 'settings.form';
const TRUE = 'true';
const FALSE = 'false';

type Listener = (settings: Settings) => void;
type Unsubscribe = () => void;

export class Settings {
  protected readonly listeners: Listener[] = [];

  protected _theme: string;
  protected _nsfw: boolean;
  protected _form: string;

  public constructor() {
    this._theme = localStorage.getItem(SETTINGS_THEME) || 'system';
    this._nsfw = localStorage.getItem(SETTINGS_NSFW) === TRUE;
    this._form = localStorage.getItem(SETTINGS_FORM) || 'floating';
  }

  public get theme() {
    return this._theme;
  }

  public set theme(theme: string) {
    this._theme = theme;
    this.listeners.forEach((listener) => listener(this));
    localStorage.setItem(SETTINGS_THEME, theme);
  }

  public get nsfw() {
    return this._nsfw;
  }

  public set nsfw(nsfw: boolean) {
    this._nsfw = nsfw;
    this.listeners.forEach((listener) => listener(this));
    localStorage.setItem(SETTINGS_NSFW, nsfw ? TRUE : FALSE);
  }

  public get form() {
    return this._form;
  }

  public set form(form: string) {
    this._form = form;
    this.listeners.forEach((listener) => listener(this));
    localStorage.setItem(SETTINGS_FORM, form);
  }

  public subscribe(listener: Listener): Unsubscribe {
    this.listeners.push(listener);

    return () => this.listeners.filter((l) => l !== listener);
  }
}

export const settings = new Settings();

export default settings;

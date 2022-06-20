import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { eventBus } from '../event-bus';
import { HIDE_SETTINGS } from '../events';
import settings, { Settings as SettingsModel } from '../settings';

const THEMES = [
  {
    id: 'system',
    name: 'Системная',
  },
  {
    id: 'default',
    name: 'Тёмная',
  },
  {
    id: 'yotsuba',
    name: 'Светлая',
  },
];

export function Settings() {
  const hideSettings = useCallback(() => eventBus.dispatch(HIDE_SETTINGS), []);

  const [nsfw, setNSFW] = useState(settings.nsfw);
  const [theme, setTheme] = useState(settings.theme);

  useEffect(() => {
    function handler(settings: SettingsModel) {
      setNSFW(settings.nsfw);
      setTheme(settings.theme);
    }

    return settings.subscribe(handler);
  }, []);

  const onNSFWChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setNSFW(event.target.checked);
    settings.nsfw = event.target.checked;
  }, []);

  const onThemeChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    setTheme(event.target.value);
    settings.theme = event.target.value;
  }, []);

  return (
    <div className="settings">
      <h2 className="settings__title">Настройки</h2>

      <button type="button" className="settings__close" title="Закрыть" onClick={hideSettings}>
        <span className="icon icon_close"></span>
      </button>

      <div className="settings__row">
        <label className="settings__theme">
          <span className="settings__theme-label">Тема</span>
          <select className="settings__theme-select" defaultValue={theme} onChange={onThemeChange}>
            {THEMES.map((theme) => (
              <option value={theme.id} key={theme.id}>
                {theme.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="settings__row">
        <label className="settings__nsfw">
          <span className="settings__nsfw-label">NSFW-режим</span>
          <input type="checkbox" className="settings__nsfw-input" checked={nsfw} onChange={onNSFWChange} />
        </label>
      </div>
    </div>
  );
}
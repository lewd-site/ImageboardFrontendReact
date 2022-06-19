import { Outlet } from '@tanstack/react-location';
import { useState, useEffect } from 'react';
import { eventBus } from '../event-bus';
import { HIDE_MENU, HIDE_SETTINGS, SHOW_MENU, SHOW_SETTINGS } from '../events';
import { Header } from './header';
import { Settings } from './settings';
import { Sidebar } from './sidebar';

const LAYOUT_CLASS = 'layout';
const HEADER_CLASS = `${LAYOUT_CLASS}__header`;
const CONTENT_CLASS = `${LAYOUT_CLASS}__content`;

const SIDEBAR_CLASS = `${LAYOUT_CLASS}__sidebar`;
const SIDEBAR_VISIBLE_CLASS = `${SIDEBAR_CLASS}_visible`;
const SIDEBAR_HIDDEN_CLASS = `${SIDEBAR_CLASS}_hidden`;

const SETTINGS_CLASS = `${LAYOUT_CLASS}__settings`;
const SETTINGS_VISIBLE_CLASS = `${SETTINGS_CLASS}_visible`;
const SETTINGS_HIDDEN_CLASS = `${SETTINGS_CLASS}_hidden`;

export function Layout() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);

  useEffect(() => {
    function onShowMenu() {
      setSidebarVisible(true);
    }

    function onHideMenu() {
      setSidebarVisible(false);
    }

    function onShowSettings() {
      setSettingsVisible(true);
    }

    function onHideSettings() {
      setSettingsVisible(false);
    }

    const subscriptions = [
      eventBus.subscribe(SHOW_MENU, onShowMenu),
      eventBus.subscribe(HIDE_MENU, onHideMenu),
      eventBus.subscribe(SHOW_SETTINGS, onShowSettings),
      eventBus.subscribe(HIDE_SETTINGS, onHideSettings),
    ];

    return () => subscriptions.forEach((unsubscribe) => unsubscribe());
  }, []);

  return (
    <div className={LAYOUT_CLASS}>
      <header className={HEADER_CLASS}>
        <Header />
      </header>

      <aside className={[SIDEBAR_CLASS, sidebarVisible ? SIDEBAR_VISIBLE_CLASS : SIDEBAR_HIDDEN_CLASS].join(' ')}>
        <Sidebar />
      </aside>

      <main className={CONTENT_CLASS}>
        <Outlet />
      </main>

      <aside className={[SETTINGS_CLASS, settingsVisible ? SETTINGS_VISIBLE_CLASS : SETTINGS_HIDDEN_CLASS].join(' ')}>
        <Settings />
      </aside>
    </div>
  );
}

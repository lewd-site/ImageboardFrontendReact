import { useState, useEffect } from 'react';
import { Board } from '../domain';
import { eventBus } from '../event-bus';
import { HIDE_MENU, HIDE_SETTINGS, SHOW_MENU, SHOW_SETTINGS } from '../events';
import { cls } from '../utils';
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

interface LayoutProps {
  readonly boards: Board[];
  readonly children: any;
}

export function Layout({ boards, children }: LayoutProps) {
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

      <aside className={cls([SIDEBAR_CLASS, sidebarVisible ? SIDEBAR_VISIBLE_CLASS : SIDEBAR_HIDDEN_CLASS])}>
        <Sidebar boards={boards} />
      </aside>

      <main className={CONTENT_CLASS}>{children}</main>

      <aside className={cls([SETTINGS_CLASS, settingsVisible ? SETTINGS_VISIBLE_CLASS : SETTINGS_HIDDEN_CLASS])}>
        <Settings />
      </aside>
    </div>
  );
}

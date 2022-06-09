import { Outlet } from '@tanstack/react-location';
import { useState, useEffect } from 'react';
import { eventBus } from '../event-bus';
import { HIDE_MENU, SHOW_MENU } from '../events';
import { Header } from './header';
import { Sidebar } from './sidebar';

export function Layout() {
  const [sidebarVisible, setSidebarVisible] = useState(false);

  useEffect(() => {
    function handler() {
      setSidebarVisible(true);
    }

    return eventBus.subscribe(SHOW_MENU, handler);
  }, []);

  useEffect(() => {
    function handler() {
      setSidebarVisible(false);
    }

    return eventBus.subscribe(HIDE_MENU, handler);
  }, []);

  return (
    <div className="layout">
      <header className="layout__header">
        <Header />
      </header>

      <aside
        className={['layout__sidebar', sidebarVisible ? 'layout__sidebar_visible' : 'layout__sidebar_hidden'].join(' ')}
      >
        <Sidebar />
      </aside>

      <main className="layout__content">
        <Outlet />
      </main>
    </div>
  );
}

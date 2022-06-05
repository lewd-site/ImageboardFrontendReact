import { Outlet } from '@tanstack/react-location';
import { Header } from './header';
import { Sidebar } from './sidebar';

export function Layout() {
  return (
    <div className="layout">
      <header className="layout__header">
        <Header />
      </header>

      <aside className="layout__sidebar">
        <Sidebar />
      </aside>

      <main className="layout__content">
        <Outlet />
      </main>
    </div>
  );
}

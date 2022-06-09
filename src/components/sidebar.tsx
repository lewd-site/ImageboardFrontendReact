import { Link, useMatch } from '@tanstack/react-location';
import { useCallback } from 'react';
import { eventBus } from '../event-bus';
import { HIDE_MENU } from '../events';
import { LocationGenerics } from '../types';

export function Sidebar() {
  const {
    data: { boards },
  } = useMatch<LocationGenerics>();

  const hideSidebar = useCallback(() => eventBus.dispatch(HIDE_MENU), []);

  return (
    <div className="sidebar">
      <button type="button" className="sidebar__close" title="Закрыть" onClick={hideSidebar}>
        <span className="icon icon_close"></span>
      </button>

      <nav className="sidebar__inner">
        <ul className="sidebar__list">
          <li className="sidebar__item">
            <Link className="sidebar__link" to="/" onClick={hideSidebar}>
              <span className="icon icon_home"></span>
              Главная
            </Link>
          </li>

          {boards?.map((board) => (
            <li className="sidebar__item" key={board.slug}>
              <Link className="sidebar__link" to={`/${board.slug}`} onClick={hideSidebar}>
                <span className="icon icon_discussion"></span>
                {board.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

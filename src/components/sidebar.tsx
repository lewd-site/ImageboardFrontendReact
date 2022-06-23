import { Link } from '@tanstack/react-location';
import { useCallback, useMemo } from 'react';
import { Board } from '../domain';
import { eventBus } from '../event-bus';
import { HIDE_MENU } from '../events';

interface SidebarProps {
  readonly boards: Board[];
}

export function Sidebar({ boards }: SidebarProps) {
  const hideSidebar = useCallback(() => eventBus.dispatch(HIDE_MENU), []);

  const boardList = useMemo(() => {
    if (!boards.length) {
      return null;
    }

    return boards.map((board) => (
      <li className="sidebar__item" key={board.slug}>
        <Link className="sidebar__link" to={`/${board.slug}`} onClick={hideSidebar}>
          <span className="icon icon_discussion"></span>
          {board.title}
        </Link>
      </li>
    ));
  }, [boards]);

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

          {boardList}
        </ul>
      </nav>
    </div>
  );
}

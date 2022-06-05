import { Link, useMatch } from '@tanstack/react-location';
import { LocationGenerics } from '../types';

export function Sidebar() {
  const {
    data: { boards },
  } = useMatch<LocationGenerics>();

  return (
    <div className="sidebar">
      <nav className="sidebar__inner">
        <ul className="sidebar__list">
          <li className="sidebar__item">
            <Link className="sidebar__link" to="/">
              <span className="icon icon_home"></span>
              Главная
            </Link>
          </li>

          {boards?.map((board) => (
            <li className="sidebar__item" key={board.slug}>
              <Link className="sidebar__link" to={`/${board.slug}`}>
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

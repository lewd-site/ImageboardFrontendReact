import { Link, useMatch } from '@tanstack/react-location';
import { useMemo } from 'react';
import { LocationGenerics } from '../types';

export function IndexPage() {
  const {
    data: { boards },
  } = useMatch<LocationGenerics>();

  const boardList = useMemo(() => {
    if (typeof boards === 'undefined') {
      return null;
    }

    return (
      <div className="index-page__boards">
        <h2 className="index-page__title">Список досок</h2>

        <table className="index-page__table table">
          <thead className="table__head">
            <tr className="table__row">
              <th className="table__cell">Доска</th>
              <th className="table__cell table__cell_expand">Название</th>
              <th className="table__cell">Постов</th>
            </tr>
          </thead>

          <tbody className="table__body">
            {boards.map((board, index) => (
              <tr
                className={['table__row', `table__row_${index % 2 === 0 ? 'even' : 'odd'}`].join(' ')}
                key={board.slug}
              >
                <th className="table__cell table__cell_left" scope="row">
                  <Link to={`/${board.slug}`}>/{board.slug}/</Link>
                </th>

                <td className="table__cell table__cell_expand">{board.title}</td>
                <td className="table__cell table__cell_right">{board.postCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }, [boards]);

  return <div className="index-page">{boardList}</div>;
}

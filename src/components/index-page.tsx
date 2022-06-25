import { Link } from '@tanstack/react-location';
import { useEffect, useMemo, useState } from 'react';
import cache from '../cache';
import { Board } from '../domain';
import IndexPageModel from '../model/index-page';
import { Layout } from './layout';

function useIndexPageModel() {
  const [boards, setBoards] = useState<Board[]>([...cache.getBoards().values()]);
  useEffect(() => {
    const model = new IndexPageModel();
    const subscriptions = [model.subscribe<Board[]>(IndexPageModel.BOARDS_CHANGED, setBoards)];
    model.load();

    return () => subscriptions.forEach((unsubscribe) => unsubscribe());
  }, []);

  return { boards };
}

export function IndexPage() {
  const { boards } = useIndexPageModel();

  const boardList = useMemo(() => {
    if (typeof boards === 'undefined') {
      return null;
    }

    return boards.map((board, index) => (
      <tr className={['table__row', `table__row_${index % 2 === 0 ? 'even' : 'odd'}`].join(' ')} key={board.slug}>
        <th className="table__cell table__cell_left" scope="row">
          <Link to={`/${board.slug}`}>/{board.slug}/</Link>
        </th>

        <td className="table__cell table__cell_expand">{board.title}</td>
        <td className="table__cell table__cell_right">{board.postCount}</td>
      </tr>
    ));
  }, [boards]);

  return (
    <Layout boards={boards}>
      <div className="index-page">
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

            <tbody className="table__body">{boardList}</tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

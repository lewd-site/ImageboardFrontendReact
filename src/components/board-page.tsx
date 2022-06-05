import { useMatch } from '@tanstack/react-location';
import { useMemo } from 'react';
import { LocationGenerics } from '../types';
import { Thread } from './thread';

export function BoardPage() {
  const {
    data: { threads },
  } = useMatch<LocationGenerics>();

  const threadList = useMemo(() => {
    if (typeof threads === 'undefined') {
      return null;
    }

    return (
      <div className="board-page__threads post-list">
        <h2 className="board-page__title">Список тредов</h2>
        {threads.map((thread) => (
          <Thread key={thread.id} className="post-list__item" thread={thread} />
        ))}
      </div>
    );
  }, [threads]);

  return <div className="board-page">{threadList}</div>;
}

import { useMatch, useNavigate } from '@tanstack/react-location';
import { useEffect, useMemo } from 'react';
import { Thread as ThreadModel } from '../domain';
import { eventBus } from '../event-bus';
import { THREAD_CREATED } from '../events';
import { LocationGenerics } from '../types';
import { PostingFormModal } from './posting-form-modal';
import { Thread } from './thread';

export function BoardPage() {
  const {
    data: { threads },
    params,
  } = useMatch<LocationGenerics>();

  const { slug } = params;

  const navigate = useNavigate();
  useEffect(() => {
    function handler(thread?: ThreadModel) {
      if (typeof thread === 'undefined') {
        return;
      }

      navigate({ to: `/${thread.slug}/res/${thread.id}` });
    }

    return eventBus.subscribe(THREAD_CREATED, handler);
  }, []);

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

  const postingFormModal = useMemo(
    () => <PostingFormModal title="Создать тред" slug={slug} parentId={null} showSubject={true} />,
    [slug]
  );

  return (
    <div className="board-page">
      {threadList}
      {postingFormModal}
    </div>
  );
}

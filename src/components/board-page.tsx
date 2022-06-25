import { useMatch, useNavigate } from '@tanstack/react-location';
import { useEffect, useMemo, useState } from 'react';
import cache from '../cache';
import { Thread as ThreadModel, Board } from '../domain';
import { eventBus } from '../event-bus';
import { THREAD_CREATED } from '../events';
import BoardPageModel from '../model/board-page';
import { LocationGenerics } from '../types';
import { Layout } from './layout';
import { Lightbox, useLightbox } from './lightbox';
import { PostingFormModal } from './posting-form-modal';
import { Thread } from './thread';

function useBoardPageModel(slug: string) {
  const [boards, setBoards] = useState<Board[]>([...cache.getBoards().values()]);
  const [threads, setThreads] = useState<ThreadModel[]>([...cache.getThreads(slug).values()]);
  useEffect(() => {
    const model = new BoardPageModel(slug);
    const subscriptions = [
      model.subscribe<Board[]>(BoardPageModel.BOARDS_CHANGED, setBoards),
      model.subscribe<ThreadModel[]>(BoardPageModel.THREADS_CHANGED, setThreads),
    ];

    model.load();

    return () => subscriptions.forEach((unsubscribe) => unsubscribe());
  }, [slug]);

  return { boards, threads };
}

export function BoardPage() {
  const { slug } = useMatch<LocationGenerics>().params;
  const { boards, threads } = useBoardPageModel(slug);

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

  const { lightboxVisible, file, setResetPosition, onThumbnailClick, onLightboxClose } = useLightbox();

  const threadList = useMemo(() => {
    if (typeof threads === 'undefined') {
      return null;
    }

    return (
      <div className="board-page__threads thread-list">
        <h2 className="board-page__title">Список тредов</h2>
        {threads.map((thread) => (
          <Thread key={thread.id} className="thread-list__item" thread={thread} onThumbnailClick={onThumbnailClick} />
        ))}
      </div>
    );
  }, [threads, onThumbnailClick]);

  const postingFormModal = useMemo(
    () => <PostingFormModal title="Создать тред" slug={slug} parentId={null} showSubject={true} />,
    [slug]
  );

  const lightbox = useMemo(
    () => (
      <Lightbox visible={lightboxVisible} file={file} setResetPosition={setResetPosition} onClose={onLightboxClose} />
    ),
    [lightboxVisible, file]
  );

  return (
    <Layout boards={boards}>
      <div className="board-page">
        {threadList}
        {postingFormModal}
        {lightbox}
      </div>
    </Layout>
  );
}

import { useMatch, useNavigate } from '@tanstack/react-location';
import { useEffect, useMemo, useState } from 'react';
import cache from '../cache';
import { Thread as ThreadModel, Board, Post } from '../domain';
import { eventBus } from '../event-bus';
import { INSERT_QUOTE, POST_CREATED, SHOW_POST_FORM, THREAD_CREATED } from '../events';
import BoardPageModel from '../model/board-page';
import { LocationGenerics } from '../types';
import { Layout } from './layout';
import { Lightbox, useLightbox } from './lightbox';
import { PostingFormModal } from './posting-form-modal';
import { ScrollButtons } from './scroll-buttons';
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
    const subscriptions = [
      eventBus.subscribe(THREAD_CREATED, (thread: ThreadModel) => navigate({ to: `/${thread.slug}/res/${thread.id}` })),
      eventBus.subscribe(POST_CREATED, (post: Post) =>
        navigate({ to: `/${post.slug}/res/${post.parentId}#post_${post.id}` })
      ),
    ];

    return () => subscriptions.forEach((unsubscribe) => unsubscribe());
  }, []);

  const [parentId, setParentId] = useState<number | null>(null);
  useEffect(() => {
    const subscriptions = [
      eventBus.subscribe(SHOW_POST_FORM, () => setParentId(null)),
      eventBus.subscribe(INSERT_QUOTE, (post: Post) => setParentId(post.parentId)),
    ];

    return () => subscriptions.forEach((unsubscribe) => unsubscribe());
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

  const postingFormModal = useMemo(() => {
    return parentId !== null ? (
      <PostingFormModal title={`Ответ в тред #${parentId}`} slug={slug} parentId={parentId} showSubject={false} />
    ) : (
      <PostingFormModal title="Создать тред" slug={slug} parentId={null} showSubject={true} />
    );
  }, [slug, parentId]);

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

        <ScrollButtons />
      </div>
    </Layout>
  );
}

import { useMatch } from '@tanstack/react-location';
import { useEffect, useMemo, useState } from 'react';
import cache from '../cache';
import { Board, Post, Thread as ThreadModel } from '../domain';
import { eventBus } from '../event-bus';
import { POST_CREATED } from '../events';
import { updateFavicon, updateTitle } from '../favicon';
import ThreadPageModel from '../model/thread-page';
import { OWN_POST_IDS_CHANGED, storage } from '../storage';
import { LocationGenerics } from '../types';
import { isAtBottom, scrollToBottom } from '../utils';
import { Layout } from './layout';
import { Lightbox, useLightbox } from './lightbox';
import { PostList } from './post-list';
import { PostingFormModal } from './posting-form-modal';
import { ScrollButtons } from './scroll-buttons';
import { Thread } from './thread';

const SCROLL_DELAY = 100;

function useThreadPageModel(slug: string, parentId: number) {
  const [boards, setBoards] = useState<Board[]>([...cache.getBoards().values()]);
  const [thread, setThread] = useState<ThreadModel | null>(cache.getThread(slug, parentId));
  const [posts, setPosts] = useState<Post[]>([...cache.getPosts(slug, parentId).values()]);
  const [ownPostIds, setOwnPostIds] = useState<number[]>([]);
  useEffect(() => {
    const model = new ThreadPageModel(slug, parentId);
    const subscriptions = [
      model.once(ThreadPageModel.POSTS_CHANGED, (posts: Post[]) => {
        const { hash } = location;
        const matches = hash.match(/post_(\d+)/);
        if (matches === null) {
          setTimeout(scrollToBottom, SCROLL_DELAY);
          return;
        }

        const index = posts.findIndex((post) => post.id === Number(matches[1]));
        if (index === -1) {
          setTimeout(scrollToBottom, SCROLL_DELAY);
        }
      }),
      model.subscribe<Board[]>(ThreadPageModel.BOARDS_CHANGED, setBoards),
      model.subscribe<ThreadModel>(ThreadPageModel.THREAD_CHANGED, setThread),
      model.subscribe<Post[]>(ThreadPageModel.POSTS_CHANGED, (posts) => {
        setPosts(posts);

        if (!document.hidden && isAtBottom()) {
          setTimeout(scrollToBottom, SCROLL_DELAY);
        }
      }),
      model.subscribe<number>(ThreadPageModel.UNREAD_POSTS_COUNT_CHANGED, (unreadPostsCount) => {
        updateTitle(unreadPostsCount);
        updateFavicon(unreadPostsCount);
      }),
      storage.subscribe(OWN_POST_IDS_CHANGED, () => storage.getOwnPostIds(parentId).then(setOwnPostIds)),
    ];

    model.load();
    storage.getOwnPostIds(parentId).then(setOwnPostIds);

    function onVisibilityChanged() {
      if (!document.hidden) {
        model.resetUnreadCount();
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChanged);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChanged);
      subscriptions.forEach((unsubscribe) => unsubscribe());
      model.dispose();
    };
  }, [slug, parentId]);

  return { boards, thread, posts, ownPostIds };
}

export function ThreadPage() {
  const { params } = useMatch<LocationGenerics>();
  const { slug } = params;
  const parentId = Number(params.parentId.split('.').shift());
  const { boards, thread, posts, ownPostIds } = useThreadPageModel(slug, parentId);

  useEffect(() => eventBus.subscribe(POST_CREATED, scrollToBottom), []);

  const { lightboxVisible, file, setResetPosition, onThumbnailClick, onLightboxClose } = useLightbox();

  const postList = useMemo(
    () => (
      <PostList
        className="thread-page__posts"
        posts={posts.slice(1)}
        ownPostIds={ownPostIds}
        onThumbnailClick={onThumbnailClick}
      />
    ),
    [posts, ownPostIds, onThumbnailClick]
  );

  const postingFormModal = useMemo(
    () => <PostingFormModal title={`Ответ в тред #${parentId}`} slug={slug} parentId={parentId} showSubject={false} />,
    [slug, parentId]
  );

  const lightbox = useMemo(
    () => (
      <Lightbox visible={lightboxVisible} file={file} setResetPosition={setResetPosition} onClose={onLightboxClose} />
    ),
    [lightboxVisible, file, setResetPosition, onLightboxClose]
  );

  return (
    <Layout boards={boards}>
      <div className="thread-page">
        {thread && (
          <Thread
            className="thread-page__thread"
            thread={thread}
            ownPostIds={ownPostIds}
            onThumbnailClick={onThumbnailClick}
          />
        )}
        {postList}
        {postingFormModal}
        {lightbox}

        <ScrollButtons />
      </div>
    </Layout>
  );
}

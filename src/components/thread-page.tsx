import { useMatch } from '@tanstack/react-location';
import { useEffect, useMemo, useState } from 'react';
import cache from '../cache';
import { Board, Post } from '../domain';
import { updateFavicon, updateTitle } from '../favicon';
import ThreadPageModel from '../model/thread-page';
import { OWN_POST_IDS_CHANGED, storage } from '../storage';
import { LocationGenerics } from '../types';
import { isAtBottom, scrollToBottom } from '../utils';
import { Layout } from './layout';
import { PostList } from './post-list';
import { PostingFormModal } from './posting-form-modal';

const SCROLL_TO_BOTTOM_DELAY = 100;

function useThreadPageModel(slug: string, parentId: number) {
  const [boards, setBoards] = useState<Board[]>([...cache.getBoards().values()]);
  const [posts, setPosts] = useState<Post[]>([...cache.getPosts(slug, parentId).values()]);
  const [ownPostIds, setOwnPostIds] = useState<number[]>([]);
  useEffect(() => {
    const model = new ThreadPageModel(slug, parentId);
    const subscriptions = [
      model.once(ThreadPageModel.POSTS_CHANGED, () => setTimeout(scrollToBottom, SCROLL_TO_BOTTOM_DELAY)),
      model.subscribe<Board[]>(ThreadPageModel.BOARDS_CHANGED, setBoards),
      model.subscribe<Post[]>(ThreadPageModel.POSTS_CHANGED, (posts) => {
        setPosts(posts);

        if (!document.hidden && isAtBottom()) {
          setTimeout(scrollToBottom, SCROLL_TO_BOTTOM_DELAY);
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

  return { boards, posts, ownPostIds };
}

export function ThreadPage() {
  const { params } = useMatch<LocationGenerics>();
  const { slug } = params;
  const parentId = Number(params.parentId.split('.').shift());
  const { boards, posts, ownPostIds } = useThreadPageModel(slug, parentId);

  const postList = useMemo(
    () => <PostList className="thread-page__posts" posts={posts} ownPostIds={ownPostIds} />,
    [posts, ownPostIds]
  );

  const postingFormModal = useMemo(
    () => <PostingFormModal title={`Ответ в тред #${parentId}`} slug={slug} parentId={parentId} showSubject={false} />,
    [slug, parentId]
  );

  return (
    <Layout boards={boards}>
      <div className="thread-page">
        {postList}
        {postingFormModal}
      </div>
    </Layout>
  );
}

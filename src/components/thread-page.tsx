import { useMatch } from '@tanstack/react-location';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Post } from '../domain';
import { updateFavicon, updateTitle } from '../favicon';
import { OWN_POST_IDS_CHANGED, storage } from '../storage';
import { LocationGenerics } from '../types';
import { SseThreadUpdater } from '../updater';
import { PostList } from './post-list';
import { PostingFormModal } from './posting-form-modal';

export function ThreadPage() {
  const [posts, setPosts] = useState<Map<number, Post>>(new Map());

  const {
    data: { posts: initialPosts },
    params,
  } = useMatch<LocationGenerics>();

  useEffect(() => {
    const posts = new Map();
    if (typeof initialPosts !== 'undefined') {
      for (const post of initialPosts) {
        posts.set(post.id, post);
      }
    }

    setPosts(posts);
  }, [initialPosts]);

  const unreadPosts = useRef(0);
  useEffect(() => {
    function handler() {
      if (!document.hidden) {
        unreadPosts.current = 0;
        updateTitle(unreadPosts.current);
        updateFavicon(unreadPosts.current);
      }
    }

    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  const { slug } = params;
  const parentId = Number(params.parentId.split('.').shift());
  useEffect(() => {
    const handler = (newPosts: Post[]) => {
      setPosts((posts) => {
        const result = new Map();
        for (const post of posts.values()) {
          result.set(post.id, post);
        }

        let newPostCount = 0;
        for (const post of newPosts) {
          if (!result.has(post.id)) {
            newPostCount++;
          }

          result.set(post.id, post);
        }

        if (document.hidden) {
          unreadPosts.current += newPostCount;
          updateTitle(unreadPosts.current);
          updateFavicon(unreadPosts.current);
        }

        return result;
      });
    };

    const updater = new SseThreadUpdater(slug, parentId);
    updater.subscribe(handler);
    return () => updater.dispose();
  }, [slug, parentId]);

  const [ownPostIds, setOwnPostIds] = useState<number[]>([]);
  useEffect(() => {
    async function onOwnPostIdsChanged() {
      setOwnPostIds(await storage.getOwnPostIds(parentId));
    }

    onOwnPostIdsChanged();

    return storage.subscribe(OWN_POST_IDS_CHANGED, onOwnPostIdsChanged);
  }, [parentId]);

  const postList = useMemo(
    () => <PostList className="thread-page__posts" posts={[...posts.values()]} ownPostIds={ownPostIds} />,
    [posts, ownPostIds]
  );
  const postingFormModal = useMemo(
    () => <PostingFormModal title={`Ответ в тред #${parentId}`} slug={slug} parentId={parentId} showSubject={false} />,
    [slug, parentId]
  );

  return (
    <div className="thread-page">
      {postList}
      {postingFormModal}
    </div>
  );
}

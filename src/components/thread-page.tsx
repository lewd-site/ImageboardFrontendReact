import { useMatch } from '@tanstack/react-location';
import { useEffect, useMemo, useState } from 'react';
import { Post } from '../domain';
import { LocationGenerics } from '../types';
import { SseThreadUpdater } from '../updater';
import { PostList } from './post-list';

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

  const { slug } = params;
  const parentId = Number(params.parentId.split('.').shift());
  useEffect(() => {
    const handler = (newPosts: Post[]) => {
      setPosts((posts) => {
        const result = new Map();
        for (const post of posts.values()) {
          result.set(post.id, post);
        }

        for (const post of newPosts) {
          result.set(post.id, post);
        }

        return result;
      });
    };

    const updater = new SseThreadUpdater(slug, parentId);
    updater.subscribe(handler);
    return () => updater.dispose();
  }, [slug, parentId]);

  const postList = useMemo(() => <PostList className="thread-page__posts" posts={[...posts.values()]} />, [posts]);
  return <div className="thread-page">{postList}</div>;
}

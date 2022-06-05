import { useMatch } from '@tanstack/react-location';
import { useMemo } from 'react';
import { LocationGenerics } from '../types';
import { PostList } from './post-list';

export function ThreadPage() {
  const {
    data: { posts },
  } = useMatch<LocationGenerics>();

  const postList = useMemo(() => {
    if (typeof posts === 'undefined') {
      return null;
    }

    return <PostList className="thread-page__posts" posts={posts} />;
  }, [posts]);

  return <div className="thread-page">{postList}</div>;
}

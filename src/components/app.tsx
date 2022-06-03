import { useEffect, useState } from 'react';
import { browsePosts } from '../api';
import { Post as PostModel } from '../domain';
import { PostList } from './post-list';

export function App() {
  const [posts, setPosts] = useState([] as PostModel[]);
  useEffect(() => {
    (async () => {
      setPosts(await browsePosts('chat', 79));
    })();
  }, []);

  return (
    <div>
      <PostList posts={posts} />
    </div>
  );
}

import { useCallback } from 'react';
import { useWindowVirtualizer, Virtualizer } from '@tanstack/react-virtual';
import { Post as PostModel, File as FileModel } from '../domain';
import { Post } from './post';

interface Rect {
  readonly width: number;
  readonly height: number;
}

interface PostListProps {
  readonly posts: PostModel[];
}

export function PostList({ posts }: PostListProps) {
  const POST_HEADER_HEIGHT = 24;
  const POST_HEADER_MARGIN = 4;
  const POST_FILE_HEIGHT = 200;
  const POST_FILE_MARGIN = 4;
  const POST_MESSAGE_HEIGHT = 24;
  const POST_MARGIN = 16;

  const estimateSize = useCallback(
    (index: number) =>
      POST_HEADER_HEIGHT +
      POST_HEADER_MARGIN +
      (posts[index].files.length > 0 ? POST_FILE_HEIGHT + POST_FILE_MARGIN : 0) +
      POST_MESSAGE_HEIGHT +
      POST_MARGIN,
    [posts]
  );

  const observeElementOffset = useCallback(
    (instance: Virtualizer<Window, unknown>, callback: (offset: number) => void) => {
      function update() {
        const { scrollTop } = document.scrollingElement!;
        callback(scrollTop);
      }

      window.addEventListener('scroll', update, { passive: true });
      update();
    },
    []
  );

  const observeElementRect = useCallback((instance: Virtualizer<Window, unknown>, callback: (rect: Rect) => void) => {
    function update() {
      const rect = { width: window.innerWidth, height: window.innerHeight };
      callback(rect);
    }

    window.addEventListener('resize', update, { passive: true });
    update();
  }, []);

  const virtualizer = useWindowVirtualizer({
    count: posts.length,
    overscan: 10,
    estimateSize,
    observeElementOffset,
    observeElementRect,
  });

  const onReflinkClick = useCallback(
    (id: number) =>
      virtualizer.scrollToIndex(
        posts.findIndex((post) => post.id === id),
        { align: 'auto' }
      ),
    [posts]
  );

  const onThumbnailClick = useCallback((file: FileModel) => {
    console.log(file);
  }, []);

  return (
    <div className="post-list">
      <div className="post-list__inner" style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            className="post-list__item-wrapper"
            style={{ transform: `translateY(${virtualRow.start}px)` }}
            ref={virtualRow.measureElement}
            key={posts[virtualRow.index].id}
          >
            <Post
              className="post-list__item"
              post={posts[virtualRow.index]}
              onReflinkClick={onReflinkClick}
              onThumbnailClick={onThumbnailClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

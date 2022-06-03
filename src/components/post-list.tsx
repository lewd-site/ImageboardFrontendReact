import { useCallback, useEffect, useRef } from 'react';
import { useWindowVirtualizer, Virtualizer } from '@tanstack/react-virtual';
import { Post as PostModel, File as FileModel, Markup } from '../domain';
import { Post } from './post';

interface Rect {
  readonly width: number;
  readonly height: number;
}

interface PostListProps {
  readonly posts: PostModel[];
}

const POST_HEADER_HEIGHT = 24;
const POST_HEADER_MARGIN = 4;
const POST_FILE_MARGIN = 4;
const POST_MESSAGE_LINE_HEIGHT = 24;
const POST_MARGIN = 16;

function measurePost(post: PostModel): number {
  return (
    POST_HEADER_HEIGHT +
    POST_HEADER_MARGIN +
    (post.files.length > 0 ? measureFiles(post.files) + POST_FILE_MARGIN : 0) +
    (post.message.length > 0 ? (measureMarkup(post.messageParsed) + 1) * POST_MESSAGE_LINE_HEIGHT : 0) +
    POST_MARGIN
  );
}

function measureFiles(files: FileModel[]): number {
  return Math.max(...files.map((file) => file.thumbnailHeight));
}

function measureMarkup(markup: Markup[]): number {
  return markup
    .map((node) => {
      switch (node.type) {
        case 'style':
          return measureMarkup(node.children);

        case 'text':
          return Math.floor((8 * node.text.length) / Math.min(800, window.innerWidth));

        case 'newline':
          return 1;

        default:
          return 0;
      }
    })
    .reduce((prev: number, curr) => prev + curr, 0);
}

export function PostList({ posts }: PostListProps) {
  const postHeightCache = useRef(new Map<number, number>());

  useEffect(() => {
    const handler = () => postHeightCache.current.clear();
    window.addEventListener('resize', handler, { passive: true });
    return () => window.removeEventListener('resize', handler);
  });

  const estimateSize = useCallback(
    (index: number) => {
      if (postHeightCache.current.has(index)) {
        return postHeightCache.current.get(index)!;
      }

      const height = measurePost(posts[index]);
      postHeightCache.current.set(index, height);

      return height;
    },
    [posts]
  );

  const observeElementOffset = useCallback(
    (instance: Virtualizer<Window, unknown>, callback: (offset: number) => void) => {
      function update() {
        const { scrollTop } = document.scrollingElement!;
        callback(scrollTop);
      }

      window.addEventListener('resize', update, { passive: true });
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

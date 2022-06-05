import { useCallback, useRef } from 'react';
import { useWindowVirtualizer, Virtualizer } from '@tanstack/react-virtual';
import { Post as PostModel, File as FileModel, Markup } from '../domain';
import { Post } from './post';

interface Rect {
  readonly width: number;
  readonly height: number;
}

interface PostListProps {
  readonly className?: string;
  readonly posts: PostModel[];
}

const POST_HEADER_HEIGHT = 24;
const POST_HEADER_MARGIN = 4;
const POST_FILE_MARGIN = 4;
const BORDER_WIDTH = 1;
const POST_MESSAGE_LINE_HEIGHT = 24;
const POST_MARGIN = 16;

function measurePost(post: PostModel): number {
  return (
    POST_HEADER_HEIGHT +
    POST_HEADER_MARGIN +
    (post.files.length > 0 ? measureFiles(post.files) + 2 * BORDER_WIDTH + POST_FILE_MARGIN : 0) +
    (post.message.length > 0 ? measureMarkup(post.messageParsed) : 0) +
    POST_MARGIN
  );
}

function measureFiles(files: FileModel[]): number {
  let height = 0;
  for (const file of files) {
    height = Math.max(height, file.thumbnailHeight);
  }

  return height;
}

function measureMarkup(markup: Markup[]): number {
  return (1 + estimateMarkupLines(markup)) * POST_MESSAGE_LINE_HEIGHT;
}

function estimateMarkupLines(markup: Markup[]): number {
  let height = 0;
  for (const node of markup) {
    switch (node.type) {
      case 'style':
        height += estimateMarkupLines(node.children);
        break;

      case 'text':
        height += Math.floor((8 * node.text.length) / Math.min(800, window.innerWidth));
        break;

      case 'newline':
        height += 1;
        break;
    }
  }

  return height;
}

export function PostList({ className, posts }: PostListProps) {
  const postHeightCache = useRef(new Map<number, number>());
  const estimateSize = useCallback(
    (index: number) => {
      const cachedHeight = postHeightCache.current.get(index);
      if (typeof cachedHeight !== 'undefined') {
        return cachedHeight;
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
    <div className={[className, 'post-list'].join()}>
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

import { useCallback, useEffect, useRef } from 'react';
import { useWindowVirtualizer, Virtualizer } from '@tanstack/react-virtual';
import { Post as PostModel, File as FileModel, Markup, File } from '../domain';
import { Post } from './post';
import { cls } from '../utils';
import { useLocation } from '@tanstack/react-location';

interface Rect {
  readonly width: number;
  readonly height: number;
}

interface PostListProps {
  readonly className?: string;
  readonly posts: PostModel[];
  readonly ownPostIds?: number[];
  readonly onThumbnailClick: (newFile: File) => void;
}

const SCROLL_DELAY = 100;
const POST_TOP_PADDING = 4;
const POST_BOTTOM_PADDING = 8;
const POST_HEADER_HEIGHT = 24;
const POST_HEADER_MARGIN = 4;
const BORDER_WIDTH = 2;
const POST_MESSAGE_LINE_HEIGHT = 24;
const POST_MARGIN = 16;

function measurePost(post: PostModel): number {
  let height = POST_TOP_PADDING + POST_HEADER_HEIGHT + POST_HEADER_MARGIN + POST_BOTTOM_PADDING + POST_MARGIN;

  const filesHeight = post.files.length > 0 ? measureFiles(post.files) : 0;
  const messageHeight = post.message.length > 0 ? measureMarkup(post.messageParsed) : 0;
  height += post.files.length === 1 ? Math.max(filesHeight, messageHeight) : filesHeight + messageHeight;

  return height;
}

function measureFiles(files: FileModel[]): number {
  let height = 0;
  for (const file of files) {
    height = Math.max(height, file.thumbnailHeight) + 2 * BORDER_WIDTH;
  }

  if (files.length > 4) {
    height += 8 + files[4].thumbnailHeight + 2 * BORDER_WIDTH;
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
        height += Math.floor((10 * node.text.length) / Math.min(800, window.innerWidth));
        break;

      case 'newline':
        height += 1;
        break;
    }
  }

  return height;
}

export function PostList({ className, posts, ownPostIds, onThumbnailClick }: PostListProps) {
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

  const location = useLocation();
  const previousHash = useRef(location.current.hash);
  useEffect(() => {
    const { hash } = location.current;
    if (hash === previousHash.current) {
      return;
    }

    previousHash.current = hash;

    const matches = hash.match(/post_(\d+)/);
    if (matches !== null) {
      const index = posts.findIndex((post) => post.id === Number(matches[1]));
      if (index !== -1) {
        setTimeout(() => virtualizer.scrollToIndex(index, { align: 'auto' }), SCROLL_DELAY);
      }
    }
  }, [location.current, virtualizer, posts]);

  return (
    <div className={cls([className, 'post-list'])}>
      <div className="post-list__inner" style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            className="post-list__item-wrapper"
            style={{ transform: `translateY(${virtualRow.start}px)` }}
            ref={virtualRow.measureElement}
            key={posts[virtualRow.index].id}
          >
            <Post
              className={cls([
                'post-list__item',
                ownPostIds?.includes(posts[virtualRow.index].id) && 'post-list__item_own',
              ])}
              post={posts[virtualRow.index]}
              ownPostIds={ownPostIds}
              onThumbnailClick={onThumbnailClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWindowVirtualizer, Virtualizer } from '@tanstack/react-virtual';
import { Post as PostModel, File as FileModel, Markup, File } from '../domain';
import { Post } from './post';
import { Lightbox } from './lightbox';
import { eventBus } from '../event-bus';
import { POST_CREATED } from '../events';

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
  let height = POST_HEADER_HEIGHT + POST_HEADER_MARGIN + POST_MARGIN;

  const filesHeight = post.files.length > 0 ? measureFiles(post.files) + 2 * BORDER_WIDTH + POST_FILE_MARGIN : 0;
  const messageHeight = post.message.length > 0 ? measureMarkup(post.messageParsed) : 0;
  height += post.files.length === 1 ? Math.max(filesHeight, messageHeight) : filesHeight + messageHeight;

  return height;
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

  const scrollToTop = useCallback(() => {
    virtualizer.scrollToIndex(0, { align: 'end' });
  }, []);

  const scrollToBottom = useCallback(() => {
    virtualizer.scrollToIndex(posts.length, { align: 'start' });
  }, [posts]);

  useEffect(() => {
    function handler() {
      scrollToBottom();
    }

    return eventBus.subscribe(POST_CREATED, handler);
  }, [scrollToBottom]);

  const [scrollTopVisible, setScrollTopVisible] = useState(false);
  const [scrollBottomVisible, setScrollBottomVisible] = useState(true);

  useEffect(() => {
    function handler() {
      const { scrollingElement } = document;
      if (scrollingElement === null) {
        return;
      }

      setScrollTopVisible(scrollingElement.scrollTop > 0.5 * scrollingElement.clientHeight);
      setScrollBottomVisible(
        scrollingElement.scrollTop < scrollingElement.scrollHeight - 1.5 * scrollingElement.clientHeight
      );
    }

    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const [lightboxVisible, setLightboxVisible] = useState<boolean>(false);
  const [file, setFile] = useState<FileModel | null>(null);

  const resetPosition = useRef((file: FileModel) => {});
  const setResetPosition = useCallback((value: (file: FileModel) => void) => (resetPosition.current = value), []);

  const onThumbnailClick = useCallback(
    (newFile: FileModel) => {
      setFile((file) => {
        if (file?.hash === newFile?.hash) {
          if (lightboxVisible) {
            setLightboxVisible(false);
            return file;
          } else {
            resetPosition.current(file);
          }
        }

        setTimeout(() => {
          setLightboxVisible(true);
          setFile(newFile);
        });

        return file?.originalUrl === newFile.originalUrl ? file : null;
      });
    },
    [lightboxVisible]
  );

  const onLightboxClose = useCallback(() => setLightboxVisible(false), []);

  const lightbox = useMemo(
    () => (
      <Lightbox visible={lightboxVisible} file={file} setResetPosition={setResetPosition} onClose={onLightboxClose} />
    ),
    [lightboxVisible, file]
  );

  return (
    <div className={[className, 'post-list'].join(' ')}>
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

      <button
        type="button"
        className={[
          'layout__scroll-top',
          scrollTopVisible ? 'layout__scroll-top_visible' : 'layout__scroll-top_hidden',
        ].join(' ')}
        onClick={scrollToTop}
      >
        <span className="icon icon_up"></span>
      </button>

      <button
        type="button"
        className={[
          'layout__scroll-bottom',
          scrollBottomVisible ? 'layout__scroll-bottom_visible' : 'layout__scroll-bottom_hidden',
        ].join(' ')}
        onClick={scrollToBottom}
      >
        <span className="icon icon_down"></span>
      </button>

      {lightbox}
    </div>
  );
}

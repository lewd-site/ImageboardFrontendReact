import { DragEvent, MouseEvent, useCallback, useEffect, useRef, useState } from 'react';
import { DraggableData, Rnd } from 'react-rnd';
import { CSSTransition } from 'react-transition-group';
import { throttle } from 'throttle-debounce';
import { File } from '../domain';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'audio-player': any;
      'video-player': any;
    }
  }
}

interface LightboxProps {
  readonly visible: boolean;
  readonly file: File | null;
  readonly setResetPosition?: (resetPosition: (file: File) => void) => void;
  readonly onClose?: () => void;
}

const MAX_THUMB_WIDTH = 200;
const MAX_THUMB_HEIGHT = 200;

export function Lightbox({ visible, file, setResetPosition, onClose }: LightboxProps) {
  const nodeRef = useRef<HTMLDivElement>(null);

  const [lightboxVisible, setLightboxVisible] = useState(true);
  useEffect(() => setLightboxVisible(false), []);

  const elementRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (elementRef.current === null) {
      return;
    }

    function handle(event: WheelEvent) {
      event.preventDefault();
    }

    elementRef.current.addEventListener('wheel', handle);
    return () => elementRef.current?.removeEventListener('wheel', handle);
  });

  const onEnter = useCallback(() => setLightboxVisible(true), []);
  const onExited = useCallback(() => setLightboxVisible(false), []);

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 0, height: 0 });

  const resetPosition = useCallback((file: File) => {
    const fileWidth = file.width || MAX_THUMB_WIDTH;
    const fileHeight = file.height || MAX_THUMB_HEIGHT;

    const maxWidth = Math.min(fileWidth, window.innerWidth, 800);
    const maxHeight = Math.min(fileHeight, window.innerHeight, 800);

    const scale = Math.min(1, maxWidth / fileWidth, maxHeight / fileHeight);

    let width = scale * fileWidth;
    if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
      width = Math.max(width, 350);
    }

    const height = scale * fileHeight;

    setPosition({ x: window.innerWidth / 2 - width / 2, y: window.innerHeight / 2 - height / 2 });
    setSize({ width, height });
  }, []);

  useEffect(() => {
    if (typeof setResetPosition !== 'undefined') {
      setResetPosition(resetPosition);
    }
  }, [resetPosition, setResetPosition]);

  useEffect(() => {
    if (file === null) {
      return;
    }

    resetPosition(file);
  }, [file]);

  const dragStartPosition = useRef({ x: 0, y: 0 });
  const onRndDragStart = useCallback((event: any, data: DraggableData) => {
    dragStartPosition.current = data;
  }, []);

  const [transition, setTransition] = useState(false);

  const onRndDragStop = useCallback(
    (event: any, data: DraggableData) => {
      const minX = Math.min(window.innerWidth - size.width, 0);
      const minY = Math.min(window.innerHeight - size.height, 0);

      const maxX = Math.max(0, window.innerWidth - size.width);
      const maxY = Math.max(0, window.innerHeight - size.height);

      const x = Math.max(minX, Math.min(data.x, maxX));
      const y = Math.max(minY, Math.min(data.y, maxY));

      setPosition({ x, y });

      if (transitionTimeout.current !== null) {
        clearTimeout(transitionTimeout.current);
      }

      setTransition(true);
      transitionTimeout.current = setTimeout(() => {
        setTransition(false);
        transitionTimeout.current = null;
      }, 100);

      if (
        typeof onClose !== 'undefined' &&
        file?.type.startsWith('image/') &&
        Math.abs(dragStartPosition.current.x - data.x) < 1 &&
        Math.abs(dragStartPosition.current.y - data.y) < 1
      ) {
        onClose();
      }
    },
    [file, size, onClose]
  );

  const onDragStart = useCallback((event: DragEvent) => {
    event.preventDefault();
  }, []);

  const transitionTimeout = useRef<any>();

  const onWheel = useCallback(
    throttle(100, (event: React.WheelEvent) => {
      const scale = event.deltaY > 0 ? 1 / 1.1 : 1.1;

      setSize((size) => {
        if (file === null) {
          return size;
        }

        const fileWidth = file.width || MAX_THUMB_WIDTH;
        const fileHeight = file.height || MAX_THUMB_HEIGHT;

        const newWidth = size.width * scale;
        const newHeight = size.height * scale;

        if (
          (newWidth < fileWidth && newWidth < MAX_THUMB_WIDTH) ||
          (newHeight < fileHeight && newHeight < MAX_THUMB_HEIGHT)
        ) {
          return size;
        }

        return { width: newWidth, height: newHeight };
      });

      setPosition((position) => {
        if (file === null) {
          return position;
        }

        const fileWidth = file.width || MAX_THUMB_WIDTH;
        const fileHeight = file.height || MAX_THUMB_HEIGHT;

        const relativeX = (event.clientX - position.x) / size.width;
        const relativeY = (event.clientY - position.y) / size.height;

        const newWidth = size.width * scale;
        const newHeight = size.height * scale;

        if (
          (newWidth < fileWidth && newWidth < MAX_THUMB_WIDTH) ||
          (newHeight < fileHeight && newHeight < MAX_THUMB_HEIGHT)
        ) {
          return position;
        }

        const deltaWidth = newWidth - size.width;
        const deltaHeight = newHeight - size.height;

        const newX = position.x - deltaWidth * relativeX;
        const newY = position.y - deltaHeight * relativeY;

        const minX = Math.min(window.innerWidth - size.width, 0);
        const minY = Math.min(window.innerHeight - size.height, 0);

        const maxX = Math.max(0, window.innerWidth - size.width);
        const maxY = Math.max(0, window.innerHeight - size.height);

        const x = Math.max(minX, Math.min(newX, maxX));
        const y = Math.max(minY, Math.min(newY, maxY));

        return { x, y };
      });

      // Can't work properly in other browsers
      if (navigator.userAgent.indexOf('Firefox') !== -1) {
        if (transitionTimeout.current !== null) {
          clearTimeout(transitionTimeout.current);
        }

        setTransition(true);
        transitionTimeout.current = setTimeout(() => {
          setTransition(false);
          transitionTimeout.current = null;
        }, 100);
      }
    }),
    [file, size]
  );

  const overlayClassName = [
    'lightbox-overlay',
    lightboxVisible ? 'lightbox-overlay_visible' : 'lightbox-overlay_hidden',
  ].join(' ');

  const lightboxClass = [
    'lightbox',
    transition ? 'lightbox_transition' : '',
    file !== null ? `lightbox_${file.type.split('/').shift()}` : '',
  ].join(' ');

  let fileElement = null;
  if (file !== null) {
    if (file.type.startsWith('image/')) {
      fileElement = (
        <picture className="lightbox__picture" ref={elementRef} onDragStart={onDragStart} onWheel={onWheel}>
          <img className="lightbox__image" src={file.originalUrl} alt="" />
        </picture>
      );
    } else if (file.type.startsWith('audio/')) {
      fileElement = (
        <div className="lightbox__audio-wrapper" ref={elementRef} onDragStart={onDragStart} onWheel={onWheel}>
          <picture className="lightbox__picture">
            <source srcSet={file.fallbackThumbnailUrl} type={file.fallbackThumbnailType} />
            <img className="file__image" src={file.thumbnailUrl} alt="" />
          </picture>
          {lightboxVisible && (
            <audio-player
              class="lightbox__audio"
              autoplay={true}
              loop={true}
              src={file.originalUrl}
              width={size.width}
            ></audio-player>
          )}
        </div>
      );
    } else if (file.type.startsWith('video/')) {
      fileElement = lightboxVisible && (
        <div className="lightbox__video-wrapper" ref={elementRef} onDragStart={onDragStart} onWheel={onWheel}>
          <video-player
            class="lightbox__video"
            autoplay={true}
            loop={true}
            src={file.originalUrl}
            width={size.width}
            height={size.height}
          ></video-player>
        </div>
      );
    }
  }

  return (
    <CSSTransition
      in={visible}
      timeout={200}
      classNames="lightbox-overlay"
      nodeRef={nodeRef}
      onEnter={onEnter}
      onExited={onExited}
    >
      <div className={overlayClassName} ref={nodeRef}>
        <Rnd
          className={lightboxClass}
          position={position}
          size={size}
          enableResizing={false}
          onDragStart={onRndDragStart}
          onDragStop={onRndDragStop}
        >
          {fileElement}
        </Rnd>
      </div>
    </CSSTransition>
  );
}

import { DragEvent, useCallback, useEffect, useRef, useState } from 'react';
import { DraggableData, Rnd } from 'react-rnd';
import { CSSTransition } from 'react-transition-group';
import { throttle } from 'throttle-debounce';
import { Embed, File, isFile } from '../domain';
import { cls } from '../utils';
import { Player } from './player/player';

interface LightboxProps {
  readonly className?: string;
  readonly visible: boolean;
  readonly file: File | Embed | null;
  readonly setResetPosition?: (resetPosition: (media: File | Embed) => void) => void;
  readonly onClose?: () => void;
}

const MAX_THUMB_WIDTH = 200;
const MAX_THUMB_HEIGHT = 200;

export function Lightbox({ className, visible, file, setResetPosition, onClose }: LightboxProps) {
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

  const resetPosition = useCallback((file: File | Embed) => {
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

  const overlayClassName = cls(['lightbox-overlay', `lightbox-overlay_${lightboxVisible ? 'visible' : 'hidden'}`]);
  const lightboxClass = cls([
    className,
    'lightbox',
    transition && 'lightbox_transition',
    file !== null && `lightbox_${file.type.split('/').shift()}`,
  ]);

  let fileElement = null;
  if (file !== null) {
    if (isFile(file)) {
      if (file.type.startsWith('image/')) {
        fileElement = (
          <picture className="lightbox__picture" ref={elementRef} onDragStart={onDragStart} onWheel={onWheel}>
            <img className="lightbox__image" src={file.originalUrl} alt="" />
          </picture>
        );
      } else if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
        fileElement = (
          <div className="lightbox__video" ref={elementRef} onDragStart={onDragStart} onWheel={onWheel}>
            {lightboxVisible && <Player type={file.type} url={file.originalUrl} />}
          </div>
        );
      }
    } else if (file.type === 'video/x-youtube') {
      fileElement = (
        <div className="lightbox__video" ref={elementRef} onDragStart={onDragStart} onWheel={onWheel}>
          {lightboxVisible && <Player type={file.type} url={file.url} />}
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
          size={{ width: Math.floor(size.width), height: Math.floor(size.height) }}
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

export function useLightbox() {
  const [lightboxVisible, setLightboxVisible] = useState<boolean>(false);
  const [file, setFile] = useState<File | Embed | null>(null);

  const resetPosition = useRef((file: File | Embed) => {});
  const setResetPosition = useCallback((value: (file: File | Embed) => void) => (resetPosition.current = value), []);

  const onThumbnailClick = useCallback(
    (newFile: File | Embed) => {
      const fileChanged =
        isFile(file) !== isFile(newFile) ||
        (isFile(file) && isFile(newFile) && file?.hash !== newFile?.hash) ||
        (!isFile(file) && !isFile(newFile) && file?.url !== newFile?.url);

      if (fileChanged) {
        setFile(null);
      } else {
        if (lightboxVisible) {
          setLightboxVisible(false);
          setFile(file);
        } else if (file !== null) {
          resetPosition.current(file);
        }
      }

      if (!lightboxVisible || fileChanged) {
        setTimeout(() => {
          setLightboxVisible(true);
          setFile(newFile);
        });
      }
    },
    [file, lightboxVisible]
  );

  const onLightboxClose = useCallback(() => setLightboxVisible(false), []);

  return { lightboxVisible, file, setResetPosition, onThumbnailClick, onLightboxClose };
}

import { DragEvent, useCallback, useEffect, useRef, useState } from 'react';
import { DraggableData, Rnd } from 'react-rnd';
import { CSSTransition } from 'react-transition-group';
import { File } from '../domain';

interface LightboxProps {
  readonly visible: boolean;
  readonly file: File | null;
  readonly onClose?: () => void;
}

export function Lightbox({ visible, file, onClose }: LightboxProps) {
  const nodeRef = useRef<HTMLDivElement>(null);

  const [lightboxVisible, setLightboxVisible] = useState(true);
  useEffect(() => setLightboxVisible(false), []);

  const onEnter = useCallback(() => setLightboxVisible(true), []);
  const onExited = useCallback(() => setLightboxVisible(false), []);

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    if (file === null) {
      return;
    }

    const fileWidth = file.width || 200;
    const fileHeight = file.height || 200;

    const maxWidth = Math.min(fileWidth, window.innerWidth, 800);
    const maxHeight = Math.min(fileHeight, window.innerHeight, 800);

    const scale = Math.min(1, maxWidth / fileWidth, maxHeight / fileHeight);
    const width = scale * fileWidth;
    const height = scale * fileHeight;

    setPosition({ x: window.innerWidth / 2 - width / 2, y: window.innerHeight / 2 - height / 2 });
    setSize({ width, height });
  }, [file]);

  const dragStartPosition = useRef({ x: 0, y: 0 });
  const onRndDragStart = useCallback((event: any, data: DraggableData) => {
    dragStartPosition.current = data;
  }, []);

  const onRndDragStop = useCallback(
    (event: any, data: DraggableData) => {
      setPosition(data);

      if (
        typeof onClose !== 'undefined' &&
        Math.abs(dragStartPosition.current.x - data.x) < 1 &&
        Math.abs(dragStartPosition.current.y - data.y) < 1
      ) {
        onClose();
      }
    },
    [onClose]
  );

  const onDragStart = useCallback((event: DragEvent) => {
    event.preventDefault();
  }, []);

  const overlayClassName = [
    'lightbox-overlay',
    lightboxVisible ? 'lightbox-overlay_visible' : 'lightbox-overlay_hidden',
  ].join(' ');

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
          className="lightbox"
          bounds="parent"
          position={position}
          size={size}
          enableResizing={false}
          onDragStart={onRndDragStart}
          onDragStop={onRndDragStop}
        >
          {file !== null && (
            <picture className="lightbox__picture" onDragStart={onDragStart}>
              <img className="lightbox__image" src={file.originalUrl} alt="" />
            </picture>
          )}
        </Rnd>
      </div>
    </CSSTransition>
  );
}

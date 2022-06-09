import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { DraggableData, Position, Rnd } from 'react-rnd';
import { CSSTransition } from 'react-transition-group';
import { eventBus } from '../event-bus';
import { SHOW_POST_FORM } from '../events';
import { PostingForm } from './posting-form';

interface PostingFormModalProps {
  readonly slug: string;
  readonly parentId: number;
}

const POSTING_FORM_LEFT = 'posting-form.left';
const POSTING_FORM_TOP = 'posting-form.top';
const POSTING_FORM_WIDTH = 'posting-form.width';
const POSTING_FORM_HEIGHT = 'posting-form.height';

const MODAL_MIN_WIDTH = 400;
const MODAL_MIN_HEIGHT = 250;

const MOBILE_MAX_WIDTH = 600;

export function PostingFormModal({ slug, parentId }: PostingFormModalProps) {
  const [modalTransition, setModalTransition] = useState(false);
  useEffect(() => {
    function handler() {
      setModalTransition(true);
    }

    return eventBus.subscribe(SHOW_POST_FORM, handler);
  }, []);

  const onCloseClick = useCallback(() => setModalTransition(false), []);

  const [position, setPosition] = useState(() => {
    const width = Number(localStorage.getItem(POSTING_FORM_WIDTH) || MODAL_MIN_WIDTH);
    const height = Number(localStorage.getItem(POSTING_FORM_HEIGHT) || MODAL_MIN_HEIGHT);

    const x = Number(localStorage.getItem(POSTING_FORM_LEFT) || window.innerWidth / 2 - width / 2);
    const y = Number(localStorage.getItem(POSTING_FORM_TOP) || window.innerHeight / 2 - height / 2);

    return { x, y };
  });

  const [size, setSize] = useState(() => {
    const width = Number(localStorage.getItem(POSTING_FORM_WIDTH) || MODAL_MIN_WIDTH);
    const height = Number(localStorage.getItem(POSTING_FORM_HEIGHT) || MODAL_MIN_HEIGHT);

    return { width, height };
  });

  const onDragStop = useCallback((e: any, data: DraggableData) => {
    setPosition(data);

    localStorage.setItem(POSTING_FORM_LEFT, data.x.toString());
    localStorage.setItem(POSTING_FORM_TOP, data.y.toString());
  }, []);

  const onResizeStop = useCallback((e: any, dir: any, ref: HTMLElement, delta: any, position: Position) => {
    setPosition(position);
    setSize({ width: ref.offsetWidth, height: ref.offsetHeight });

    localStorage.setItem(POSTING_FORM_LEFT, position.x.toString());
    localStorage.setItem(POSTING_FORM_TOP, position.y.toString());
    localStorage.setItem(POSTING_FORM_WIDTH, ref.offsetWidth.toString());
    localStorage.setItem(POSTING_FORM_HEIGHT, ref.offsetHeight.toString());
  }, []);

  const nodeRef = useRef<HTMLDivElement>(null);

  const [modalVisible, setModalVisible] = useState(true);
  useEffect(() => setModalVisible(false), []);

  const onEnter = useCallback(() => setModalVisible(true), []);
  const onExited = useCallback(() => setModalVisible(false), []);

  const postingForm = useMemo(
    () => <PostingForm className="modal__body" slug={slug} parentId={parentId} />,
    [slug, parentId]
  );

  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_MAX_WIDTH);

  useEffect(() => {
    function handler() {
      setIsMobile(window.innerWidth < MOBILE_MAX_WIDTH);
    }

    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return (
    <CSSTransition
      in={modalTransition}
      timeout={200}
      classNames="modal-overlay"
      nodeRef={nodeRef}
      onEnter={onEnter}
      onExited={onExited}
    >
      <div
        className={['modal-overlay', modalVisible ? 'modal-overlay_visible' : 'modal-overlay_hidden'].join(' ')}
        ref={nodeRef}
      >
        <Rnd
          className="modal"
          bounds="parent"
          minWidth={MODAL_MIN_WIDTH}
          minHeight={MODAL_MIN_HEIGHT}
          position={position}
          size={size}
          onDragStop={onDragStop}
          onResizeStop={onResizeStop}
          disableDragging={isMobile}
        >
          <div className="modal__header">
            <h3 className="modal__title">Ответ в тред #{parentId}</h3>

            <button type="button" className="modal__close" title="Закрыть" onClick={onCloseClick}>
              <span className="icon icon_close"></span>
            </button>
          </div>

          {postingForm}
        </Rnd>
      </div>
    </CSSTransition>
  );
}

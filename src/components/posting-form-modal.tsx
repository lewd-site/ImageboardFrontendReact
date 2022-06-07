import { useState, useCallback, useEffect, useRef } from 'react';
import { DraggableData, Position, Rnd } from 'react-rnd';
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
const MODAL_MIN_HEIGHT = 200;

export function PostingFormModal({ slug, parentId }: PostingFormModalProps) {
  const [postFormVisible, setPostFormVisible] = useState(false);
  useEffect(() => {
    function handler() {
      setPostFormVisible(true);
    }

    return eventBus.subscribe(SHOW_POST_FORM, handler);
  }, []);

  const onCloseClick = useCallback(() => setPostFormVisible(false), []);

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

  if (!postFormVisible) {
    return null;
  }

  return (
    <div className="modal-overlay">
      <Rnd
        className="modal"
        bounds="parent"
        minWidth={MODAL_MIN_WIDTH}
        minHeight={MODAL_MIN_HEIGHT}
        position={position}
        size={size}
        onDragStop={onDragStop}
        onResizeStop={onResizeStop}
      >
        <div className="modal__header">
          <h3 className="modal__title">Ответ в тред #{parentId}</h3>

          <button type="button" className="modal__close" onClick={onCloseClick}>
            <span className="icon icon_close"></span>
          </button>
        </div>

        <PostingForm className="modal__body" slug={slug} parentId={parentId} />
      </Rnd>
    </div>
  );
}

import { useRef, useEffect } from 'react';
import { cls } from '../../utils';

interface SeekBarProps {
  readonly className?: string;
  readonly value: number;
  readonly maxValue: number;
  readonly children?: any;
  readonly onChange?: (value: number, seeking: boolean) => void;
  readonly onStartSeeking?: () => void;
  readonly onEndSeeking?: () => void;
}

export function SeekBar({
  className,
  value,
  maxValue,
  children,
  onChange,
  onStartSeeking,
  onEndSeeking,
}: SeekBarProps) {
  const width = maxValue > 0 ? value / maxValue : 0;

  const ref = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (event.button !== 0) {
        return;
      }

      try {
        if (typeof onStartSeeking !== 'undefined') {
          onStartSeeking();
        }

        const { x, width } = ref.current!.getBoundingClientRect();
        if (typeof onChange !== 'undefined') {
          onChange((event.clientX - x) / width, true);
        }

        fillRef.current!.style.width = `${(100 * (event.clientX - x)) / width}%`;
      } finally {
        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointercancel', onPointerUp);
        document.addEventListener('pointerup', onPointerUp);
      }
    }

    function onPointerMove(event: MouseEvent) {
      const { x, width } = ref.current!.getBoundingClientRect();
      if (typeof onChange !== 'undefined') {
        onChange((event.clientX - x) / width, true);
      }

      fillRef.current!.style.width = `${(100 * (event.clientX - x)) / width}%`;
    }

    function onPointerUp(event: MouseEvent) {
      try {
        const { x, width } = ref.current!.getBoundingClientRect();
        if (typeof onChange !== 'undefined') {
          onChange((event.clientX - x) / width, false);
        }

        if (typeof onEndSeeking !== 'undefined') {
          onEndSeeking();
        }

        fillRef.current!.style.width = `${(100 * (event.clientX - x)) / width}%`;
      } finally {
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointercancel', onPointerUp);
        document.removeEventListener('pointerup', onPointerUp);
      }
    }

    ref.current?.addEventListener('pointerdown', onPointerDown);
    return () => ref.current?.removeEventListener('pointerdown', onPointerDown);
  }, [onChange]);

  return (
    <div className={cls([className, 'seek-bar'])} ref={ref}>
      <div className="seek-bar__inner">
        <div className="seek-bar__fill" style={{ width: `${100 * width}%` }} ref={fillRef}></div>
      </div>
      {children}
    </div>
  );
}

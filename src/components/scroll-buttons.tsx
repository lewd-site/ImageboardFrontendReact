import { useEffect, useState } from 'react';
import { cls, scrollToBottom, scrollToTop } from '../utils';

export function ScrollButtons() {
  const [scrollTopVisible, setScrollTopVisible] = useState(false);
  const [scrollBottomVisible, setScrollBottomVisible] = useState(true);

  useEffect(() => {
    function handler() {
      const { scrollingElement } = document;
      if (scrollingElement === null || scrollingElement.scrollHeight < 1.5 * scrollingElement.clientHeight) {
        setScrollTopVisible(false);
        setScrollBottomVisible(false);
        return;
      }

      setScrollTopVisible(scrollingElement.scrollTop > 0.5 * scrollingElement.clientHeight);
      setScrollBottomVisible(
        scrollingElement.scrollTop < scrollingElement.scrollHeight - 1.5 * scrollingElement.clientHeight
      );
    }

    window.addEventListener('scroll', handler, { passive: true });
    window.addEventListener('resize', handler, { passive: true });
    handler();

    return () => {
      window.removeEventListener('scroll', handler);
      window.removeEventListener('resize', handler);
    };
  }, []);

  return (
    <>
      <button
        type="button"
        className={cls(['layout__scroll-top', `layout__scroll-top_${scrollTopVisible ? 'visible' : 'hidden'}`])}
        onClick={scrollToTop}
      >
        <span className="icon icon_up"></span>
      </button>

      <button
        type="button"
        className={cls([
          'layout__scroll-bottom',
          `layout__scroll-bottom_${scrollBottomVisible ? 'visible' : 'hidden'}`,
        ])}
        onClick={scrollToBottom}
      >
        <span className="icon icon_down"></span>
      </button>
    </>
  );
}

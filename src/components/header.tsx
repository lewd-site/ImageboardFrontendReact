import { useMatches } from '@tanstack/react-location';
import { useCallback } from 'react';
import { eventBus } from '../event-bus';
import { SHOW_POST_FORM } from '../events';
import { LocationGenerics } from '../types';

export function Header() {
  const matches = useMatches<LocationGenerics>();
  const onCreatePostClick = useCallback(() => eventBus.dispatch(SHOW_POST_FORM), []);

  return (
    <div className="header">
      <div className="header__left"></div>
      <div className="header__center"></div>

      <div className="header__right">
        {matches.some((match) => match.route.meta?.name === 'thread') && (
          <button type="button" className="header__show-post-form" onClick={onCreatePostClick}>
            <span className="icon icon_discussion"></span>
            Ответить в тред
          </button>
        )}
      </div>
    </div>
  );
}

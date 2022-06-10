import { useMatches } from '@tanstack/react-location';
import { useCallback } from 'react';
import { eventBus } from '../event-bus';
import { SHOW_MENU, SHOW_POST_FORM } from '../events';
import { LocationGenerics } from '../types';

export function Header() {
  const matches = useMatches<LocationGenerics>();
  const onMenuClick = useCallback(() => eventBus.dispatch(SHOW_MENU), []);
  const showPostForm = useCallback(() => eventBus.dispatch(SHOW_POST_FORM), []);

  return (
    <div className="header">
      <div className="header__left">
        <button type="button" className="header__show-menu" onClick={onMenuClick}>
          <span className="icon icon_menu"></span>
        </button>
      </div>

      <div className="header__center"></div>

      <div className="header__right">
        {matches.some((match) => match.route.meta?.name === 'board') && (
          <button type="button" className="header__show-post-form" onClick={showPostForm}>
            <span className="icon icon_discussion"></span>
            Создать тред
          </button>
        )}

        {matches.some((match) => match.route.meta?.name === 'thread') && (
          <button type="button" className="header__show-post-form" onClick={showPostForm}>
            <span className="icon icon_discussion"></span>
            Ответить в тред
          </button>
        )}
      </div>
    </div>
  );
}

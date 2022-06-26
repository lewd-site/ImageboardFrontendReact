import { useCallback } from 'react';
import { Post, Thread } from '../domain';
import { eventBus } from '../event-bus';
import { INSERT_QUOTE } from '../events';
import { TimeAgo } from './time-ago';

interface PostHeaderProps {
  readonly post: Post | Thread;
  readonly before?: any;
  readonly after?: any;
}

const DEFAULT_NAME = 'Anonymous';

export function PostHeader({ post, before, after }: PostHeaderProps) {
  const name = !post.name.length && !post.tripcode.length ? DEFAULT_NAME : post.name;
  const onReplyClick = useCallback(() => eventBus.dispatch(INSERT_QUOTE, post), [post.id]);

  return (
    <div className="post__header">
      {before}

      <span className="post__author">
        <span className="post__name">{name}</span>
        <span className="post__tripcode">{post.tripcode}</span>
      </span>

      <TimeAgo className="post__date" value={post.createdAt} />
      <span className="post__id">{post.id}</span>

      <button type="button" className="post__reply" onClick={onReplyClick}>
        <span className="icon icon_reply"></span>
      </button>

      {after}
    </div>
  );
}

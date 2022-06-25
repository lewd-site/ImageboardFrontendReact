import { useCallback, useMemo } from 'react';
import { Post as PostModel, File as FileModel } from '../domain';
import { Markup } from './markup';
import { File } from './file';
import { eventBus } from '../event-bus';
import { INSERT_QUOTE } from '../events';
import { TimeAgo } from './time-ago';
import { cls } from '../utils';

const DEFAULT_NAME = 'Anonymous';

interface PostProps {
  readonly className?: string;
  readonly post: PostModel;
  readonly ownPostIds?: number[];
  readonly onThumbnailClick?: (file: FileModel) => void;
}

export function Post({ className, post, ownPostIds, onThumbnailClick }: PostProps) {
  const onReplyClick = useCallback(() => eventBus.dispatch(INSERT_QUOTE, post), [post.id]);

  const header = useMemo(() => {
    const name = !post.name.length && !post.tripcode.length ? DEFAULT_NAME : post.name;

    return (
      <div className="post__header">
        <span className="post__author">
          <span className="post__name">{name}</span>
          <span className="post__tripcode">{post.tripcode}</span>
        </span>

        <TimeAgo className="post__date" value={post.createdAt} />
        <span className="post__id">{post.id}</span>

        <button type="button" className="post__reply" onClick={onReplyClick}>
          <span className="icon icon_reply"></span>
        </button>
      </div>
    );
  }, [post.name, post.tripcode, post.createdAt, post.id]);

  const message = useMemo(
    () => (
      <div className="post__message">
        <Markup markup={post.messageParsed} ownPostIds={ownPostIds} />
      </div>
    ),
    [post.messageParsed, ownPostIds]
  );

  const files = useMemo(
    () => (
      <div
        className={cls([
          'post__files',
          `post__files_${post.files.length > 1 ? 'multiple' : post.files.length === 1 ? 'single' : 'empty'}`,
        ])}
      >
        {post.files.map((file, index) => (
          <File className="post__file" file={file} key={index} onThumbnailClick={onThumbnailClick} />
        ))}
      </div>
    ),
    [post.files, onThumbnailClick]
  );

  return (
    <div id={`post_${post.id}`} className={cls(['post', className])}>
      {header}
      {files}
      {message}
    </div>
  );
}

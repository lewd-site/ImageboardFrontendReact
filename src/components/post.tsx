import { useCallback, useMemo } from 'react';
import { Post as PostModel, File as FileModel } from '../domain';
import { Markup } from './markup';
import { File } from './file';
import { eventBus } from '../event-bus';
import { INSERT_QUOTE } from '../events';
import { TimeAgo } from './time-ago';

const DEFAULT_NAME = 'Anonymous';

interface PostProps {
  readonly className?: string;
  readonly post: PostModel;
  readonly ownPostIds?: number[];
  readonly onReflinkClick?: (id: number) => void;
  readonly onThumbnailClick?: (file: FileModel) => void;
}

export function Post({ className, post, ownPostIds, onReflinkClick, onThumbnailClick }: PostProps) {
  const onReplyClick = useCallback(() => {
    eventBus.dispatch(INSERT_QUOTE, post.id);
  }, [post.id]);

  const header = useMemo(() => {
    const name = !post.name.length && !post.tripcode.length ? DEFAULT_NAME : post.name;

    return (
      <div className="post__header">
        <span className="post__author">
          <span className="post__name">{name}</span>
          <span className="post__tripcode">{post.tripcode}</span>
        </span>

        <time className="post__date" dateTime={post.createdAt.toISOString()} title={post.createdAt.toLocaleString()}>
          <TimeAgo value={post.createdAt} />
        </time>

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
        <Markup markup={post.messageParsed} ownPostIds={ownPostIds} onReflinkClick={onReflinkClick} />
      </div>
    ),
    [post.messageParsed, ownPostIds, onReflinkClick]
  );

  const files = useMemo(
    () => (
      <div
        className={[
          'post__files',
          post.files.length === 1 ? 'post__files_single' : post.files.length > 1 ? 'post__files_multiple' : '',
        ].join(' ')}
      >
        {post.files.map((file, index) => (
          <File file={file} key={index} onThumbnailClick={onThumbnailClick} />
        ))}
      </div>
    ),
    [post.files, onThumbnailClick]
  );

  return (
    <div id={`post_${post.id}`} className={['post', className].join(' ')}>
      {header}
      {files}
      {message}
    </div>
  );
}

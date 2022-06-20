import { useMemo } from 'react';
import { Thread as ThreadModel, File as FileModel } from '../domain';
import { Markup } from './markup';
import { File } from './file';
import { Link } from '@tanstack/react-location';
import { TimeAgo } from './time-ago';
import { Post } from './post';

const DEFAULT_NAME = 'Anonymous';

interface ThreadProps {
  readonly className?: string;
  readonly thread: ThreadModel;
  readonly ownPostIds?: number[];
  readonly onReflinkClick?: (id: number, parentId?: number, slug?: string) => void;
  readonly onThumbnailClick?: (file: FileModel) => void;
}

export function Thread({ className, thread, ownPostIds, onReflinkClick, onThumbnailClick }: ThreadProps) {
  const header = useMemo(() => {
    const name = !thread.name.length && !thread.tripcode.length ? DEFAULT_NAME : thread.name;

    return (
      <div className="post__header">
        <span className="post__subject">{thread.subject}</span>

        <span className="post__author">
          <span className="post__name">{name}</span>
          <span className="post__tripcode">{thread.tripcode}</span>
        </span>

        <time
          className="post__date"
          dateTime={thread.createdAt.toISOString()}
          title={thread.createdAt.toLocaleString()}
        >
          <TimeAgo value={thread.createdAt} />
        </time>

        <span className="post__id">{thread.id}</span>

        <span className="post__actions">
          <Link className="button" to={`/${thread.slug}/res/${thread.id}`}>
            Перейти в тред
          </Link>
        </span>
      </div>
    );
  }, [thread.name, thread.tripcode, thread.createdAt, thread.slug, thread.id]);

  const files = useMemo(
    () => (
      <div
        className={[
          'post__files',
          thread.files.length === 1 ? 'post__files_single' : thread.files.length > 1 ? 'post__files_multiple' : '',
        ].join(' ')}
      >
        {thread.files.map((file, index) => (
          <File file={file} key={index} onThumbnailClick={onThumbnailClick} />
        ))}
      </div>
    ),
    [thread.files, onThumbnailClick]
  );

  const markup = useMemo(
    () => (
      <div className="post__message">
        <Markup markup={thread.messageParsed} ownPostIds={ownPostIds} onReflinkClick={onReflinkClick} />
      </div>
    ),
    [thread.messageParsed, ownPostIds, onReflinkClick]
  );

  return (
    <div id={`post_${thread.id}`} className={['post', className].join(' ')}>
      {header}
      {files}
      {markup}
      {thread.postCount - thread.replies.length > 1 && (
        <div className="post__omitted-replies">Пропущено ответов: {thread.postCount - thread.replies.length - 1}</div>
      )}
      <div className="post__replies">
        {thread.replies.map((post) => (
          <Post
            className="post__replies-item"
            key={post.id}
            post={post}
            ownPostIds={ownPostIds}
            onThumbnailClick={onThumbnailClick}
          />
        ))}
      </div>
    </div>
  );
}

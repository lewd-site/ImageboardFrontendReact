import { useMemo } from 'react';
import { Thread as ThreadModel, File as FileModel } from '../domain';
import { Markup } from './markup';
import { File } from './file';
import { Link } from '@tanstack/react-location';
import { TimeAgo } from './time-ago';

const DEFAULT_NAME = 'Anonymous';

interface ThreadProps {
  readonly className?: string;
  readonly thread: ThreadModel;
  readonly onReflinkClick?: (id: number) => void;
  readonly onThumbnailClick?: (file: FileModel) => void;
}

export function Thread({ className, thread, onReflinkClick, onThumbnailClick }: ThreadProps) {
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
        <Markup markup={thread.messageParsed} onReflinkClick={onReflinkClick} />
      </div>
    ),
    [thread.messageParsed, onReflinkClick]
  );

  return (
    <div id={`post_${thread.id}`} className={['post', className].join(' ')}>
      {header}
      {files}
      {markup}
      <span className="post__footer">Ответов: {thread.postCount - 1}</span>
    </div>
  );
}

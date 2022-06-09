import { useMemo } from 'react';
import { Thread as ThreadModel, File as FileModel } from '../domain';
import { Markup } from './markup';
import { File } from './file';
import { Link } from '@tanstack/react-location';

const DEFAULT_NAME = 'Anonymous';

interface ThreadProps {
  readonly className?: string;
  readonly thread: ThreadModel;
  readonly onReflinkClick?: (id: number) => void;
  readonly onThumbnailClick?: (file: FileModel) => void;
}

export function Thread({ className, thread, onReflinkClick, onThumbnailClick }: ThreadProps) {
  const name = !thread.name.length && !thread.tripcode.length ? DEFAULT_NAME : thread.name;
  const files = useMemo(
    () => thread.files.map((file, index) => <File file={file} key={index} onThumbnailClick={onThumbnailClick} />),
    [thread.files, onThumbnailClick]
  );

  const markup = useMemo(
    () => <Markup markup={thread.messageParsed} onReflinkClick={onReflinkClick} />,
    [thread.messageParsed, onReflinkClick]
  );

  return (
    <div id={`post_${thread.id}`} className={['post', className].join(' ')}>
      <div className="post__header">
        <span className="post__author">
          <span className="post__name">{name}</span>
          <span className="post__tripcode">{thread.tripcode}</span>
        </span>

        <time className="post__date" dateTime={thread.createdAt.toISOString()}>
          {thread.createdAt.toLocaleString()}
        </time>

        <span className="post__id">{thread.id}</span>

        <span className="post__actions">
          <Link className="button" to={`/${thread.slug}/res/${thread.id}`}>
            Перейти в тред
          </Link>
        </span>
      </div>

      <div
        className={[
          'post__files',
          files.length === 1 ? 'post__files_single' : files.length > 1 ? 'post__files_multiple' : '',
        ].join(' ')}
      >
        {files}
      </div>
      <div className="post__message">{markup}</div>
    </div>
  );
}

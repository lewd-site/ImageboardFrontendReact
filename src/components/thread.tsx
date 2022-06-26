import { useCallback, useMemo } from 'react';
import { Thread as ThreadModel, File as FileModel } from '../domain';
import { Markup } from './markup';
import { File } from './file';
import { Link } from '@tanstack/react-location';
import { TimeAgo } from './time-ago';
import { Post } from './post';
import { cls } from '../utils';
import { Reflink } from './reflink';
import { eventBus } from '../event-bus';
import { INSERT_QUOTE } from '../events';

const DEFAULT_NAME = 'Anonymous';

interface ThreadProps {
  readonly className?: string;
  readonly thread: ThreadModel;
  readonly ownPostIds?: number[];
  readonly onThumbnailClick?: (file: FileModel) => void;
}

export function Thread({ className, thread, ownPostIds, onThumbnailClick }: ThreadProps) {
  const onReplyClick = useCallback(() => eventBus.dispatch(INSERT_QUOTE, thread), [thread.id]);

  const header = useMemo(() => {
    const name = !thread.name.length && !thread.tripcode.length ? DEFAULT_NAME : thread.name;

    return (
      <div className="post__header">
        <span className="post__subject">{thread.subject}</span>

        <span className="post__author">
          <span className="post__name">{name}</span>
          <span className="post__tripcode">{thread.tripcode}</span>
        </span>

        <TimeAgo className="post__date" value={thread.createdAt} />
        <span className="post__id">{thread.id}</span>

        <button type="button" className="post__reply" onClick={onReplyClick}>
          <span className="icon icon_reply"></span>
        </button>

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
        className={cls([
          'post__files',
          `post__files_${thread.files.length > 1 ? 'multiple' : thread.files.length === 1 ? 'single' : 'empty'}`,
        ])}
      >
        {thread.files.map((file, index) => (
          <File className="post__file" file={file} key={index} onThumbnailClick={onThumbnailClick} />
        ))}
      </div>
    ),
    [thread.files, onThumbnailClick]
  );

  const markup = useMemo(
    () => (
      <div className="post__message">
        <Markup markup={thread.messageParsed} ownPostIds={ownPostIds} />
      </div>
    ),
    [thread.messageParsed, ownPostIds]
  );

  return (
    <div id={`post_${thread.id}`} className={cls([className, 'post'])}>
      {header}
      {files}

      <div className="post__content">
        {markup}
        {thread.referencedBy.length > 0 && (
          <div className="post__refs">
            Ответы:
            {thread.referencedBy.map((ref) => (
              <Reflink
                className="post__ref"
                key={ref.sourceId}
                slug={thread.slug}
                threadId={ref.sourceParentId || undefined}
                postId={ref.sourceId}
                ownPostIds={ownPostIds}
              />
            ))}
          </div>
        )}
        {thread.postCount - thread.replies.length > 1 && (
          <div className="post__omitted-replies">Пропущено постов: {thread.postCount - thread.replies.length - 1}</div>
        )}
      </div>

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

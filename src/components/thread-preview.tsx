import { useMemo } from 'react';
import { Thread, File, Embed } from '../domain';
import { Markup } from './markup';
import { Link } from '@tanstack/react-location';
import { Post } from './post';
import { cls } from '../utils';
import { PostHeader } from './post-header';
import { PostFiles } from './post-files';
import { PostReferences } from './post-references';
import { PostEmbeds } from './post-embeds';

interface ThreadPreviewProps {
  readonly className?: string;
  readonly thread: Thread;
  readonly ownPostIds?: number[];
  readonly onThumbnailClick?: (media: File | Embed) => void;
}

export function ThreadPreview({ className, thread, ownPostIds, onThumbnailClick }: ThreadPreviewProps) {
  const beforeHeader = <span className="post__subject">{thread.subject}</span>;
  const afterHeader = (
    <span className="post__actions">
      <Link className="button" to={`/${thread.slug}/res/${thread.id}`}>
        Перейти в тред
      </Link>
    </span>
  );

  const markup = useMemo(
    () => (
      <div className="post__message">
        <Markup markup={thread.messageParsed} ownPostIds={ownPostIds} />
      </div>
    ),
    [thread.messageParsed, ownPostIds]
  );

  const omittedReplies = thread.postCount - thread.replies.length - 1;

  return (
    <div id={`post_${thread.id}`} className={cls([className, 'post'])}>
      <PostHeader post={thread} before={beforeHeader} after={afterHeader} />
      <PostFiles post={thread} onThumbnailClick={onThumbnailClick} />

      <div className="post__content">
        {markup}
        <PostEmbeds post={thread} onThumbnailClick={onThumbnailClick} />
        <PostReferences post={thread} ownPostIds={ownPostIds} />
        {omittedReplies > 0 && <div className="post__omitted-replies">Пропущено постов: {omittedReplies}</div>}
      </div>

      <ThreadReplies thread={thread} ownPostIds={ownPostIds} onThumbnailClick={onThumbnailClick} />
    </div>
  );
}

interface ThreadRepliesProps {
  readonly thread: Thread;
  readonly ownPostIds?: number[];
  readonly onThumbnailClick?: (media: File | Embed) => void;
}

function ThreadReplies({ thread, ownPostIds, onThumbnailClick }: ThreadRepliesProps) {
  return (
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
  );
}

import { useMemo } from 'react';
import { Embed, File, Thread as ThreadModel } from '../domain';
import { Markup } from './markup';
import { cls } from '../utils';
import { PostHeader } from './post-header';
import { PostFiles } from './post-files';
import { PostReferences } from './post-references';
import { PostEmbeds } from './post-embeds';

interface ThreadProps {
  readonly className?: string;
  readonly thread: ThreadModel;
  readonly ownPostIds?: number[];
  readonly onThumbnailClick?: (media: File | Embed) => void;
}

export function Thread({ className, thread, ownPostIds, onThumbnailClick }: ThreadProps) {
  const beforeHeader = <span className="post__subject">{thread.subject}</span>;

  const markup = useMemo(
    () => (
      <div className="post__message">
        <Markup markup={thread.messageParsed} ownPostIds={ownPostIds} />
      </div>
    ),
    [thread.messageParsed, ownPostIds]
  );

  return (
    <div id={`post_${thread.id}`} className={cls(['post', className])}>
      <PostHeader post={thread} before={beforeHeader} />
      <PostFiles post={thread} onThumbnailClick={onThumbnailClick} />

      <div className="post__content">
        {markup}
        <PostEmbeds post={thread} onThumbnailClick={onThumbnailClick} />
        <PostReferences post={thread} ownPostIds={ownPostIds} />
      </div>
    </div>
  );
}

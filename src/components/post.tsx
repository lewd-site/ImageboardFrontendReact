import { useMemo } from 'react';
import { Post as PostModel, File } from '../domain';
import { Markup } from './markup';
import { cls } from '../utils';
import { PostHeader } from './post-header';
import { PostFiles } from './post-files';
import { PostReferences } from './post-references';

interface PostProps {
  readonly className?: string;
  readonly post: PostModel;
  readonly ownPostIds?: number[];
  readonly onThumbnailClick?: (file: File) => void;
}

export function Post({ className, post, ownPostIds, onThumbnailClick }: PostProps) {
  const markup = useMemo(
    () => (
      <div className="post__message">
        <Markup markup={post.messageParsed} ownPostIds={ownPostIds} />
      </div>
    ),
    [post.messageParsed, ownPostIds]
  );

  return (
    <div id={`post_${post.id}`} className={cls(['post', className])}>
      <PostHeader post={post} />
      <PostFiles post={post} onThumbnailClick={onThumbnailClick} />

      <div className="post__content">
        {markup}
        <PostReferences post={post} ownPostIds={ownPostIds} />
      </div>
    </div>
  );
}

import { useMemo } from 'react';
import { Post as PostModel, File, Embed as EmbedModel } from '../domain';
import { Markup } from './markup';
import { cls } from '../utils';
import { PostHeader } from './post-header';
import { PostFiles } from './post-files';
import { PostReferences } from './post-references';
import { PostEmbeds } from './post-embeds';

interface PostProps {
  readonly className?: string;
  readonly post: PostModel;
  readonly ownPostIds?: number[];
  readonly onThumbnailClick?: (media: File | EmbedModel) => void;
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
        <PostEmbeds post={post} onThumbnailClick={onThumbnailClick} />
        <PostReferences post={post} ownPostIds={ownPostIds} />
      </div>
    </div>
  );
}

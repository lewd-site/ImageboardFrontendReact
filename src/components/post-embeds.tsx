import { MouseEvent, useCallback } from 'react';
import { Post as PostModel, Embed as EmbedModel, Thread } from '../domain';
import { cls } from '../utils';

interface PostEmbedsProps {
  readonly post: PostModel | Thread;
  readonly onThumbnailClick?: (embed: EmbedModel) => void;
}

export function PostEmbeds({ post, onThumbnailClick }: PostEmbedsProps) {
  return (
    <div className="post__embeds">
      {post.embeds.map((embed, index) => (
        <Embed key={index} className="post__embed" embed={embed} onThumbnailClick={onThumbnailClick} />
      ))}
    </div>
  );
}

interface EmbedProps {
  readonly className?: string;
  readonly embed: EmbedModel;
  readonly onThumbnailClick?: (embed: EmbedModel) => void;
}

function Embed({ className, embed, onThumbnailClick }: EmbedProps) {
  const onClick = useCallback(
    (event: MouseEvent) => {
      if (typeof onThumbnailClick !== 'undefined') {
        event.preventDefault();
        onThumbnailClick(embed);
      }
    },
    [embed, onThumbnailClick]
  );

  return (
    <div
      className={cls([className, 'embed'])}
      style={{ width: `${embed.thumbnailWidth}px`, height: `${embed.thumbnailHeight}px` }}
    >
      <a className="embed__link" href={embed.url} title={embed.name} target="_blank" rel="ugc" onClick={onClick}>
        <img className="embed__image" src={embed.thumbnailUrl} alt="" />
      </a>
    </div>
  );
}

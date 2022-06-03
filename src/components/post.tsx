import { useMemo } from 'react';
import { Post as PostModel, File as FileModel } from '../domain';
import { Markup } from './markup';
import { File } from './file';

interface PostProps {
  readonly className?: string;
  readonly post: PostModel;
  readonly onReflinkClick?: (id: number) => void;
  readonly onThumbnailClick?: (file: FileModel) => void;
}

export function Post({ className, post, onReflinkClick, onThumbnailClick }: PostProps) {
  const name = !post.name.length && !post.tripcode.length ? 'Anonymous' : post.name;
  const files = useMemo(
    () => post.files.map((file, index) => <File file={file} key={index} onThumbnailClick={onThumbnailClick} />),
    [post.files, onThumbnailClick]
  );

  const markup = useMemo(
    () => <Markup markup={post.messageParsed} onReflinkClick={onReflinkClick} />,
    [post.messageParsed, onReflinkClick]
  );

  return (
    <div id={`post_${post.id}`} className={['post', className].join(' ')}>
      <div className="post__header">
        <span className="post__author">
          <span className="post__name">{name}</span>
          <span className="post__tripcode">{post.tripcode}</span>
        </span>

        <time className="post__date" dateTime={post.createdAt.toISOString()}>
          {post.createdAt.toLocaleString()}
        </time>

        <span className="post__id">{post.id}</span>
      </div>

      <div className="post__files">{files}</div>
      <div className="post__message">{markup}</div>
    </div>
  );
}

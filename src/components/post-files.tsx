import { File as FileModel, Post, Thread } from '../domain';
import { cls } from '../utils';
import { File } from './file';

interface PostFilesProps {
  readonly post: Post | Thread;
  readonly onThumbnailClick?: (file: FileModel) => void;
}

export function PostFiles({ post, onThumbnailClick }: PostFilesProps) {
  return (
    <div
      className={cls([
        'post__files',
        `post__files_${post.files.length > 1 ? 'multiple' : post.files.length === 1 ? 'single' : 'empty'}`,
      ])}
    >
      {post.files.map((file, index) => (
        <File key={index} className="post__file" file={file} onThumbnailClick={onThumbnailClick} />
      ))}
    </div>
  );
}

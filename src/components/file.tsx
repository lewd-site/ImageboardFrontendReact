import { useCallback, MouseEvent } from 'react';
import { File as FileModel } from '../domain';

interface FileProps {
  readonly file: FileModel;
  readonly onThumbnailClick?: (file: FileModel) => void;
}

const BORDER_WIDTH = 1;

const THUMB_WIDTH = 200;
const THUMB_HEIGHT = 200;

export function File({ file, onThumbnailClick }: FileProps) {
  const width = file.width || THUMB_WIDTH;
  const height = file.height || THUMB_HEIGHT;

  const scale = Math.max(1, width / THUMB_WIDTH, height / THUMB_HEIGHT);

  const thumbnailWidth = width / scale;
  const thumbnailHeight = height / scale;

  const onClick = useCallback(
    (event: MouseEvent) => {
      if (typeof onThumbnailClick !== 'undefined') {
        event.preventDefault();
        onThumbnailClick(file);
      }
    },
    [onThumbnailClick]
  );

  return (
    <div
      className="post__file file"
      style={{ width: `${thumbnailWidth + 2 * BORDER_WIDTH}px`, height: `${thumbnailHeight + 2 * BORDER_WIDTH}px` }}
    >
      <a className="file__link" href={file.originalUrl} target="_blank" onClick={onClick}>
        <picture className="file__picture">
          <source srcSet={file.fallbackThumbnailUrl} type={file.fallbackThumbnailType} />
          <img className="file__image" src={file.thumbnailUrl} loading="lazy" alt="" />
        </picture>
      </a>
    </div>
  );
}

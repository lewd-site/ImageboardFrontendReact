import { useCallback, MouseEvent, useMemo } from 'react';
import { File as FileModel } from '../domain';
import { cls, formatFileSize } from '../utils';

interface FileProps {
  readonly className?: string;
  readonly file: FileModel;
  readonly onThumbnailClick?: (file: FileModel) => void;
}

const BORDER_WIDTH = 1;

const AUDIO_THUMB_WIDTH = 96;
const AUDIO_THUMB_HEIGHT = 96;

const MAX_THUMB_WIDTH = 200;
const MAX_THUMB_HEIGHT = 200;

export function File({ className, file, onThumbnailClick }: FileProps) {
  const width = file.width || AUDIO_THUMB_WIDTH;
  const height = file.height || AUDIO_THUMB_HEIGHT;

  const scale = Math.max(1, width / MAX_THUMB_WIDTH, height / MAX_THUMB_HEIGHT);

  const thumbnailWidth = width / scale;
  const thumbnailHeight = height / scale;

  const onClick = useCallback(
    (event: MouseEvent) => {
      if (typeof onThumbnailClick !== 'undefined') {
        event.preventDefault();
        onThumbnailClick(file);
      }
    },
    [file, onThumbnailClick]
  );

  const fileType = file.type.split('/').shift();
  const fileInfo = useMemo(() => {
    let fileInfo = file.name;
    if (file.width !== null && file.height !== null) {
      fileInfo += `, ${file.width}x${file.height}`;
    }

    return fileInfo + `, ${formatFileSize(file.size)}`;
  }, [file]);

  return (
    <div
      className={cls([className, 'file', `file_${fileType}`])}
      style={{ width: `${thumbnailWidth + 2 * BORDER_WIDTH}px`, height: `${thumbnailHeight + 2 * BORDER_WIDTH}px` }}
    >
      <a className="file__link" href={file.originalUrl} target="_blank" title={fileInfo} onClick={onClick}>
        <picture className="file__picture">
          <source srcSet={file.fallbackThumbnailUrl} type={file.fallbackThumbnailType} />
          <img className="file__image" src={file.thumbnailUrl} loading="lazy" alt="" />
        </picture>
      </a>
    </div>
  );
}

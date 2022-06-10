import { useCallback, MouseEvent, useMemo } from 'react';
import { File as FileModel } from '../domain';

interface FileProps {
  readonly file: FileModel;
  readonly onThumbnailClick?: (file: FileModel) => void;
}

const BORDER_WIDTH = 1;

const AUDIO_THUMB_WIDTH = 96;
const AUDIO_THUMB_HEIGHT = 96;

const MAX_THUMB_WIDTH = 200;
const MAX_THUMB_HEIGHT = 200;

const units = ['', 'К', 'М', 'Г', 'Т', 'П'];

function formatFileSize(value: number): string {
  if (value < 1024) {
    return `${value} байт`;
  }

  const unitIndex = Math.floor(Math.log2(value) / 10);
  return `${(value / Math.pow(1024, unitIndex)).toFixed(2)} ${units[unitIndex]}байт`;
}

export function File({ file, onThumbnailClick }: FileProps) {
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
    [onThumbnailClick]
  );

  const fileInfo = useMemo(() => {
    let fileInfo = file.name;
    if (file.width !== null && file.height !== null) {
      fileInfo += `, ${file.width}x${file.height}`;
    }

    return fileInfo + `, ${formatFileSize(file.size)}`;
  }, [file]);

  return (
    <div
      className={['post__file', 'file', `file_${file.type.split('/').shift()}`].join(' ')}
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

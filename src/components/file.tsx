import { useCallback, MouseEvent, useMemo } from 'react';
import { File as FileModel } from '../domain';

interface FileProps {
  readonly file: FileModel;
  readonly onThumbnailClick?: (file: FileModel) => void;
}

const BORDER_WIDTH = 1;

const THUMB_WIDTH = 200;
const THUMB_HEIGHT = 200;

const units = ['', 'К', 'М', 'Г', 'Т', 'П'];

function formatFileSize(value: number): string {
  if (value < 1024) {
    return `${value} байт`;
  }

  const unitIndex = Math.floor(Math.log2(value) / 10);
  return `${(value / Math.pow(1024, unitIndex)).toFixed(2)} ${units[unitIndex]}байт`;
}

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

  const fileInfo = useMemo(() => {
    let fileInfo = file.name;
    if (file.width !== null && file.height !== null) {
      fileInfo += `, ${file.width}x${file.height}`;
    }

    return fileInfo + `, ${formatFileSize(file.size)}`;
  }, [file]);

  return (
    <div
      className="post__file file"
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

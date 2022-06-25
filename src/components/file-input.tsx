import { useRef, useState, useCallback, ChangeEvent, useMemo, useEffect } from 'react';

interface FileInputProps {
  readonly className?: string;
  readonly onChange?: (files: File[]) => void;
  readonly setAddFiles?: (addFiles: (files: File[]) => void) => void;
  readonly setClear?: (clear: () => void) => void;
}

const MAX_FILES = 5;

export function FileInput({ className, onChange, setAddFiles, setClear }: FileInputProps) {
  const files = useRef<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const addFiles = useCallback(
    (filesToAdd: File[]) => {
      const newFiles = filesToAdd.slice(0, MAX_FILES - files.current.length);
      files.current = files.current.concat(...newFiles);

      setPreviewUrls((previews) => previews.concat(...newFiles.map((file) => URL.createObjectURL(file))));

      if (typeof onChange !== 'undefined') {
        onChange(files.current);
      }
    },
    [onChange]
  );

  const onFilesChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (event.target.files === null) {
        return;
      }

      addFiles([...event.target.files]);
    },
    [addFiles]
  );

  const removeFile = useCallback((index: number) => {
    files.current.splice(index, 1);

    setPreviewUrls((previews) => {
      const result: string[] = [];
      for (let i = 0; i < previews.length; i++) {
        if (i !== index) {
          result.push(previews[i]);
        } else {
          URL.revokeObjectURL(previews[i]);
        }
      }

      return result;
    });

    if (typeof onChange !== 'undefined') {
      onChange(files.current);
    }
  }, []);

  const previews = useMemo(
    () =>
      previewUrls.map((preview, index) => {
        const file = files.current[index];

        let img = null;
        if (file.type.startsWith('image/')) {
          img = <img className="file-input__preview-image" src={preview} alt="" />;
        } else if (file.type.startsWith('audio/')) {
          img = <img className="file-input__preview-image" src="/audio.png" alt="" />;
        } else if (file.type.startsWith('video/')) {
          img = (
            <video className="file-input__preview-image" autoPlay={true} loop={true} muted={true}>
              <source type={file.type} src={preview} />
            </video>
          );
        } else {
          img = <div className="file-input__preview-image"></div>;
        }

        return (
          <div className="file-input__preview" title="Удалить файл" key={preview} onClick={() => removeFile(index)}>
            {img}

            <div className="file-input__preview-overlay">
              <span className="icon icon_close"></span>
            </div>
          </div>
        );
      }),
    [previewUrls]
  );

  const filesRef = useRef<HTMLInputElement>(null);
  const clear = useCallback(() => {
    const filesElement = filesRef.current;
    if (filesElement !== null) {
      filesElement.type = 'text';
      filesElement.value = '';
      filesElement.type = 'file';
    }

    files.current = [];

    setPreviewUrls((previews) => {
      for (const preview of previews) {
        URL.revokeObjectURL(preview);
      }

      return [];
    });
  }, []);

  useEffect(() => {
    if (typeof setAddFiles !== 'undefined') {
      setAddFiles(addFiles);
    }

    if (typeof setClear !== 'undefined') {
      setClear(clear);
    }
  }, [setAddFiles, setClear]);

  return (
    <div className={[className, 'file-input'].join(' ')}>
      <div className="file-input__previews">{previews}</div>

      <label className="file-input__files">
        <span className="icon icon_attach"></span>
        <span className="file-input__files-label">Прикрепить файлы…</span>

        <input
          className="file-input__files-input"
          name="files"
          type="file"
          multiple
          accept="image/webp,image/jpeg,image/png,image/gif,image/bmp,video/webm,video/mp4,audio/mpeg,audio/mp4,audio/flac,audio/x-flac,audio/wav,audio/x-wav,audio/vnd.wave"
          ref={filesRef}
          onChange={onFilesChange}
        />
      </label>
    </div>
  );
}

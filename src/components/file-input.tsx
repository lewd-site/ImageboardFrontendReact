import { useRef, useState, useCallback, ChangeEvent, useMemo, useEffect } from 'react';

interface FileInputProps {
  readonly className?: string;
  readonly onChange?: (files: File[]) => void;
  readonly setClear?: (clear: () => void) => void;
}

const MAX_FILES = 5;

export function FileInput({ className, onChange, setClear }: FileInputProps) {
  const files = useRef<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const onFilesChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files === null) {
      return;
    }

    const newFiles = [...event.target.files].slice(0, MAX_FILES - files.current.length);
    files.current = files.current.concat(...newFiles);

    setPreviewUrls((previews) => previews.concat(...newFiles.map((file) => URL.createObjectURL(file))));

    if (typeof onChange !== 'undefined') {
      onChange(files.current);
    }
  }, []);

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
      previewUrls.map((preview, index) => (
        <div className="file-input__preview" title="Удалить файл" key={preview} onClick={() => removeFile(index)}>
          <img className="file-input__preview-image" src={preview} alt="" />

          <div className="file-input__preview-overlay">
            <span className="icon icon_close"></span>
          </div>
        </div>
      )),
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
    if (typeof setClear !== 'undefined') {
      setClear(clear);
    }
  }, [setClear]);

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
          ref={filesRef}
          onChange={onFilesChange}
        />
      </label>
    </div>
  );
}

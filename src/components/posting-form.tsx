import { ChangeEvent, useCallback, useRef, useEffect, FormEvent, useState, useMemo } from 'react';
import { createPost } from '../api';
import { FileInput } from './file-input';

interface PostingFormProps {
  readonly className?: string;
  readonly slug: string;
  readonly parentId: number;
}

const NAME = 'posting-form.name';
const MESSAGE = 'posting-form.message';

const MAX_NAME_LEGTH = 100;
const MAX_MESSAGE_LENGTH = 8000;

export function PostingForm({ className, slug, parentId }: PostingFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    function handler(event: Event) {
      event.stopPropagation();
    }

    formRef.current?.addEventListener('mousedown', handler, { capture: true });
    formRef.current?.addEventListener('pointerdown', handler, { capture: true });
    formRef.current?.addEventListener('touchstart', handler, { capture: true });

    return () => {
      formRef.current?.removeEventListener('mousedown', handler, { capture: true });
      formRef.current?.removeEventListener('pointerdown', handler, { capture: true });
      formRef.current?.removeEventListener('touchstart', handler, { capture: true });
    };
  }, [formRef]);

  const defaultName = useMemo(() => localStorage.getItem(NAME) || '', []);
  const defaultMessage = useMemo(() => localStorage.getItem(MESSAGE) || '', []);

  const name = useRef(defaultName);
  const message = useRef(defaultMessage);
  const files = useRef<File[]>([]);

  const onNameChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    name.current = event.target.value;
    localStorage.setItem(NAME, name.current);
  }, []);

  const onMessageChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    message.current = event.target.value;
    localStorage.setItem(MESSAGE, message.current);
  }, []);

  const onFilesChange = useCallback((value: File[]) => (files.current = value), []);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<any>(null);

  const messageRef = useRef<HTMLTextAreaElement>(null);
  const clearFileInput = useRef(() => {});
  const setClearFileInput = useCallback((clear: () => void) => (clearFileInput.current = clear), []);

  const onSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      setSubmitting(true);
      setError(null);

      try {
        await createPost(slug, parentId, name.current, message.current, files.current);

        message.current = '';
        files.current = [];

        if (messageRef.current !== null) {
          messageRef.current.value = '';
        }

        clearFileInput.current();

        localStorage.setItem(MESSAGE, message.current);
      } catch (e) {
        setError(e);
      } finally {
        setSubmitting(false);
      }
    },
    [slug, parentId]
  );

  return (
    <form className={[className, 'posting-form'].join(' ')} onSubmit={onSubmit} ref={formRef}>
      <div className="posting-form__name-row">
        <input
          className="posting-form__name"
          name="name"
          placeholder="Имя"
          maxLength={MAX_NAME_LEGTH}
          defaultValue={defaultName}
          onChange={onNameChange}
        />

        <button type="submit" className="posting-form__submit" title="Отправить">
          <span className="icon icon_submit"></span>
        </button>
      </div>

      <textarea
        className="posting-form__message"
        name="message"
        placeholder="Сообщение"
        maxLength={MAX_MESSAGE_LENGTH}
        defaultValue={defaultMessage}
        onChange={onMessageChange}
        ref={messageRef}
      ></textarea>

      <FileInput className="posting-form__files-row" setClear={setClearFileInput} onChange={onFilesChange} />
    </form>
  );
}

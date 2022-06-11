import { ChangeEvent, useCallback, useRef, useEffect, FormEvent, useState, useMemo, KeyboardEvent } from 'react';
import { createPost, createThread } from '../api';
import { eventBus } from '../event-bus';
import { INSERT_QUOTE, POST_CREATED, THREAD_CREATED } from '../events';
import { FileInput } from './file-input';

interface PostingFormProps {
  readonly className?: string;
  readonly slug: string;
  readonly parentId: number | null;
  readonly showSubject: boolean;
}

const SUBJECT = 'posting-form.subject';
const NAME = 'posting-form.name';
const MESSAGE = 'posting-form.message';

const MAX_SUBJECT_LEGTH = 100;
const MAX_NAME_LEGTH = 100;
const MAX_MESSAGE_LENGTH = 8000;

export function PostingForm({ className, slug, parentId, showSubject }: PostingFormProps) {
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

  const defaultSubject = useMemo(() => localStorage.getItem(SUBJECT) || '', []);
  const defaultName = useMemo(() => localStorage.getItem(NAME) || '', []);
  const defaultMessage = useMemo(() => localStorage.getItem(MESSAGE) || '', []);

  const subject = useRef(defaultSubject);
  const name = useRef(defaultName);
  const message = useRef(defaultMessage);
  const files = useRef<File[]>([]);

  const onSubjectChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    subject.current = event.target.value;
    localStorage.setItem(SUBJECT, subject.current);
  }, []);

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

  const subjectRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const clearFileInput = useRef(() => {});
  const setClearFileInput = useCallback((clear: () => void) => (clearFileInput.current = clear), []);

  useEffect(() => {
    function handler(postId?: number) {
      if (typeof postId === 'undefined') {
        return;
      }

      const messageInput = messageRef.current;
      if (messageInput === null) {
        return;
      }

      const selection = window.getSelection();
      const quote = selection ? selection.toString().replace(/\r/g, '').trim() : '';

      const selectionStart = messageInput.selectionStart;
      const selectionEnd = messageInput.selectionEnd;

      const textBefore = messageInput.value.substring(0, selectionStart);
      const textAfter = messageInput.value.substring(selectionEnd);

      let cursor = selectionStart;
      let textToInsert = `>>${postId}` + (quote.length ? `\n${quote}`.replace(/\n/g, '\n> ') : '');

      if (textBefore.length && !textBefore.endsWith('\n')) {
        textToInsert = `\n${textToInsert}`;
      }

      if (textAfter.length) {
        if (textAfter.startsWith('\n')) {
          textToInsert = `${textToInsert}\n`;
        } else {
          textToInsert = `${textToInsert}\n\n`;
          cursor--;
        }
      } else {
        textToInsert = `${textToInsert}\n`;
      }

      cursor += textToInsert.length;
      message.current = `${textBefore}${textToInsert}${textAfter}`;
      messageInput.value = message.current;

      setTimeout(() => {
        messageRef.current?.focus();

        setTimeout(() => {
          messageRef.current?.setSelectionRange(cursor, cursor);
        });
      }, 100);
    }

    return eventBus.subscribe(INSERT_QUOTE, handler);
  }, []);

  const onKeyDown = useCallback((event: KeyboardEvent) => {
    event.stopPropagation();
  }, []);

  const onSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      if (submitting) {
        return;
      }

      setSubmitting(true);
      setError(null);

      try {
        if (parentId === null) {
          const thread = await createThread(slug, subject.current, name.current, message.current, files.current);
          eventBus.dispatch(THREAD_CREATED, thread);
        } else {
          const post = await createPost(slug, parentId, name.current, message.current, files.current);
          eventBus.dispatch(POST_CREATED, post);
        }

        subject.current = '';
        message.current = '';
        files.current = [];

        if (subjectRef.current !== null) {
          subjectRef.current.value = '';
        }

        if (messageRef.current !== null) {
          messageRef.current.value = '';
        }

        clearFileInput.current();

        localStorage.setItem(SUBJECT, subject.current);
        localStorage.setItem(MESSAGE, message.current);
      } catch (e) {
        setError(e);
        console.error(e); // TODO: show notification
      } finally {
        setSubmitting(false);
      }
    },
    [submitting, slug, parentId]
  );

  return (
    <form className={[className, 'posting-form'].join(' ')} onKeyDown={onKeyDown} onSubmit={onSubmit} ref={formRef}>
      {showSubject && (
        <div className="posting-form__row">
          <input
            className="posting-form__subject"
            name="subject"
            placeholder="Тема"
            maxLength={MAX_SUBJECT_LEGTH}
            defaultValue={defaultSubject}
            onChange={onSubjectChange}
            ref={subjectRef}
          />
        </div>
      )}

      <div className="posting-form__row">
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

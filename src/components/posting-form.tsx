import {
  ChangeEvent,
  useCallback,
  useRef,
  useEffect,
  FormEvent,
  useState,
  useMemo,
  KeyboardEvent,
  ClipboardEvent,
} from 'react';
import { createPost, createThread } from '../api';
import { eventBus } from '../event-bus';
import { INSERT_MARKUP, INSERT_QUOTE, POST_CREATED, SHOW_POST_FORM, THREAD_CREATED } from '../events';
import { storage } from '../storage';
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

const FOCUS_DELAY = 100;

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

  const addFiles = useRef((files: File[]) => {});
  const setAddFiles = useCallback((fn: (files: File[]) => void) => (addFiles.current = fn), []);

  const clearFileInput = useRef(() => {});
  const setClearFileInput = useCallback((clear: () => void) => (clearFileInput.current = clear), []);

  useEffect(() => {
    function setFocus() {
      setTimeout(() => {
        messageRef.current?.focus();
      }, FOCUS_DELAY);
    }

    function insertQuote(postId?: number) {
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
      }, FOCUS_DELAY);
    }

    function insertMarkup(args?: { before: string; after: string }) {
      if (typeof args === 'undefined') {
        return;
      }

      const { before, after } = args;
      const messageInput = messageRef.current;
      if (messageInput === null) {
        return;
      }

      const selectionStart = messageInput.selectionStart;
      const selectionEnd = messageInput.selectionEnd;

      const textSelected = messageInput.value.substring(selectionStart, selectionEnd);
      const textToInsert = `${before}${textSelected}${after}`;

      const textBefore = messageInput.value.substring(0, selectionStart);
      const textAfter = messageInput.value.substring(selectionEnd);

      message.current = `${textBefore}${textToInsert}${textAfter}`;
      messageInput.value = message.current;

      setTimeout(() => {
        messageRef.current?.focus();

        setTimeout(() => {
          const start = selectionStart + before.length;
          const end = selectionEnd + before.length;
          messageRef.current?.setSelectionRange(start, end);
        });
      }, FOCUS_DELAY);
    }

    const subscriptions = [
      eventBus.subscribe(SHOW_POST_FORM, setFocus),
      eventBus.subscribe(INSERT_QUOTE, insertQuote),
      eventBus.subscribe(INSERT_MARKUP, insertMarkup),
    ];

    return () => subscriptions.forEach((unsubscribe) => unsubscribe());
  }, []);

  const onKeyDown = useCallback((event: KeyboardEvent) => {
    event.stopPropagation();
  }, []);

  const submit = useCallback(async () => {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (parentId === null) {
        const thread = await createThread(slug, subject.current, name.current, message.current, files.current);
        eventBus.dispatch(THREAD_CREATED, thread);
        storage.addOwnPost({ parent_id: null, id: thread.id });
      } else {
        const post = await createPost(slug, parentId, name.current, message.current, files.current);
        eventBus.dispatch(POST_CREATED, post);
        storage.addOwnPost({ parent_id: post.parentId, id: post.id });
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
  }, [submitting, slug, parentId]);

  const insertMarkup = useCallback(
    (before: string, after: string) => eventBus.dispatch(INSERT_MARKUP, { before, after }),
    []
  );

  const insertBold = useCallback(() => insertMarkup('**', '**'), []);
  const insertItalic = useCallback(() => insertMarkup('*', '*'), []);
  const insertUnderline = useCallback(() => insertMarkup('[u]', '[/u]'), []);
  const insertStrike = useCallback(() => insertMarkup('~~', '~~'), []);
  const insertSuperscript = useCallback(() => insertMarkup('[sup]', '[/sup]'), []);
  const insertSubscript = useCallback(() => insertMarkup('[sub]', '[/sub]'), []);
  const insertSpoiler = useCallback(() => insertMarkup('%%', '%%'), []);

  const onMessageKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.ctrlKey && event.code === 'Enter') {
        event.preventDefault();
        submit();
      } else if (event.altKey) {
        if (event.code === 'KeyB') {
          insertBold();
        } else if (event.code === 'KeyI') {
          insertItalic();
        } else if (event.code === 'KeyT') {
          insertStrike();
        } else if (event.code === 'KeyP') {
          insertSpoiler();
        }
      }
    },
    [submit]
  );

  const onMessagePaste = useCallback((event: ClipboardEvent) => {
    if (!event.clipboardData.files.length) {
      return;
    }

    addFiles.current([...event.clipboardData.files]);
  }, []);

  const onSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      submit();
    },
    [submit]
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
          placeholder="Имя#Трипкод"
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
        onKeyDown={onMessageKeyDown}
        onPaste={onMessagePaste}
        ref={messageRef}
      ></textarea>

      <div className="posting-form__markup">
        <button
          type="button"
          className="posting-form__markup-button posting-form__markup-button_bold"
          title="Полужирный, Alt+B"
          onClick={insertBold}
        >
          Тт
        </button>

        <button
          type="button"
          className="posting-form__markup-button posting-form__markup-button_italic"
          title="Курсив. Alt+I"
          onClick={insertItalic}
        >
          Тт
        </button>

        <button
          type="button"
          className="posting-form__markup-button posting-form__markup-button_underline"
          title="Подчёркнутый"
          onClick={insertUnderline}
        >
          Тт
        </button>

        <button
          type="button"
          className="posting-form__markup-button posting-form__markup-button_strike"
          title="Зачёркнутый, Alt+T"
          onClick={insertStrike}
        >
          Тт
        </button>

        <button
          type="button"
          className="posting-form__markup-button posting-form__markup-button_superscript"
          title="Надстрочный"
          onClick={insertSuperscript}
        >
          <sup>Тт</sup>
        </button>

        <button
          type="button"
          className="posting-form__markup-button posting-form__markup-button_subscript"
          title="Подстрочный"
          onClick={insertSubscript}
        >
          <sub>Тт</sub>
        </button>

        <button
          type="button"
          className="posting-form__markup-button posting-form__markup-button_spoiler"
          title="Спойлер, Alt+P"
          onClick={insertSpoiler}
        >
          Спойлер
        </button>
      </div>

      <FileInput
        className="posting-form__files-row"
        setAddFiles={setAddFiles}
        setClear={setClearFileInput}
        onChange={onFilesChange}
      />
    </form>
  );
}

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
import { Post } from '../domain';
import { eventBus } from '../event-bus';
import { INSERT_MARKUP, INSERT_QUOTE, POST_CREATED, SHOW_POST_FORM, THREAD_CREATED } from '../events';
import { storage } from '../storage';
import { cls, formatFileSize, formatUploadProgress } from '../utils';
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
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('???????????????? ??????????...');
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

    function insertQuote(post: Post) {
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
      let textToInsert = `>>${post.id}` + (quote.length ? `\n${quote}`.replace(/\n/g, '\n> ') : '');

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

  const cancelSubmit = useRef(() => {});
  const setCancelSubmit = useCallback((fn: () => void) => (cancelSubmit.current = fn), []);
  const onCancelClick = useCallback(() => cancelSubmit.current(), []);

  const submit = useCallback(async () => {
    if (submitting) {
      return;
    }

    setProgress(0);
    setProgressText('???????????????? ??????????...');
    setSubmitting(true);
    setError(null);

    try {
      const requestOptions = {
        onUploadProgress: (sent: number, total: number, speed: number) => {
          const percent = ((100 * sent) / total).toFixed(2);
          const progress = formatUploadProgress(sent, total);
          setProgress(Number(percent));
          setProgressText(`???????????????? ??????????... ${percent}%\n${progress}, ${formatFileSize(speed)}/??`);
        },
        onDownloadProgress: (received: number, total: number, speed: number) => {
          const percent = ((100 * received) / total).toFixed(2);
          const progress = formatUploadProgress(received, total);
          setProgress(Number(percent));
          setProgressText(`?????????????????? ????????????... ${percent}%\n${progress}, ${formatFileSize(speed)}/??`);
        },
        setCancel: setCancelSubmit,
      };

      if (parentId === null) {
        const thread = await createThread(
          slug,
          subject.current,
          name.current,
          message.current,
          files.current,
          requestOptions
        );
        eventBus.dispatch(THREAD_CREATED, thread);
        storage.addOwnPost({ parent_id: null, id: thread.id });
      } else {
        const post = await createPost(slug, parentId, name.current, message.current, files.current, requestOptions);
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

      setTimeout(() => setSubmitting(false));
    } catch (e) {
      setError(e);
      setTimeout(() => setSubmitting(false), 2000);
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
  const insertCode = useCallback(() => insertMarkup('[code]', '[/code]'), []);

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
        } else if (event.code === 'KeyC') {
          insertCode();
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

  const hideDropOverlayTimeout = useRef<any>(null);
  const [dropOverlayVisible, setDropOverlayVisible] = useState(false);
  useEffect(() => {
    function onDragEnter(event: Event) {
      event.preventDefault();
      event.stopPropagation();

      if (hideDropOverlayTimeout.current !== null) {
        clearTimeout(hideDropOverlayTimeout.current);
        hideDropOverlayTimeout.current = null;
      }

      setDropOverlayVisible(true);
    }

    function onDragOver(event: Event) {
      event.preventDefault();
      event.stopPropagation();

      if (hideDropOverlayTimeout.current !== null) {
        clearTimeout(hideDropOverlayTimeout.current);
        hideDropOverlayTimeout.current = null;
      }

      setDropOverlayVisible(true);
    }

    function onDragLeave(event: Event) {
      event.preventDefault();
      event.stopPropagation();

      if (hideDropOverlayTimeout.current !== null) {
        clearTimeout(hideDropOverlayTimeout.current);
        hideDropOverlayTimeout.current = null;
      }

      hideDropOverlayTimeout.current = setTimeout(() => {
        setDropOverlayVisible(false);
        hideDropOverlayTimeout.current = null;
      }, 100);
    }

    function onDrop(event: DragEvent) {
      event.preventDefault();
      event.stopPropagation();

      if (hideDropOverlayTimeout.current !== null) {
        clearTimeout(hideDropOverlayTimeout.current);
        hideDropOverlayTimeout.current = null;
      }

      hideDropOverlayTimeout.current = setTimeout(() => {
        setDropOverlayVisible(false);
        hideDropOverlayTimeout.current = null;
      }, 100);

      if (event.dataTransfer === null) {
        return;
      }

      const files: File[] = [];
      const fileList = event.dataTransfer.files;
      for (let i = 0; i < fileList.length; i++) {
        files.push(fileList[i]);
      }

      addFiles.current(files);
    }

    formRef.current?.addEventListener('dragenter', onDragEnter);
    formRef.current?.addEventListener('dragover', onDragOver);
    formRef.current?.addEventListener('dragleave', onDragLeave);
    formRef.current?.addEventListener('drop', onDrop);

    return () => {
      formRef.current?.removeEventListener('dragenter', onDragEnter);
      formRef.current?.removeEventListener('dragover', onDragOver);
      formRef.current?.removeEventListener('dragleave', onDragLeave);
      formRef.current?.removeEventListener('drop', onDrop);
    };
  }, [formRef.current]);

  return (
    <form className={cls([className, 'posting-form'])} onKeyDown={onKeyDown} onSubmit={onSubmit} ref={formRef}>
      {showSubject && (
        <div className="posting-form__row">
          <input
            className="posting-form__subject"
            name="subject"
            placeholder="????????"
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
          placeholder="??????#??????????????"
          maxLength={MAX_NAME_LEGTH}
          defaultValue={defaultName}
          onChange={onNameChange}
        />

        <button type="submit" className="posting-form__submit" title="??????????????????">
          <span className="icon icon_submit"></span>
        </button>
      </div>

      <textarea
        className="posting-form__message"
        name="message"
        placeholder="??????????????????"
        maxLength={MAX_MESSAGE_LENGTH}
        defaultValue={defaultMessage}
        onChange={onMessageChange}
        onKeyDown={onMessageKeyDown}
        onPaste={onMessagePaste}
        ref={messageRef}
      ></textarea>

      <MarkupButtons
        className="posting-form__markup"
        buttons={[
          {
            key: 'bold',
            title: '????????????????????, Alt+B',
            children: '????',
            onClick: insertBold,
          },
          {
            key: 'italic',
            title: '????????????. Alt+I',
            children: '????',
            onClick: insertItalic,
          },
          {
            key: 'underline',
            title: '????????????????????????',
            children: '????',
            onClick: insertUnderline,
          },
          {
            key: 'strike',
            title: '??????????????????????, Alt+T',
            children: '????',
            onClick: insertStrike,
          },
          {
            key: 'superscript',
            title: '??????????????????????',
            children: <sup>????</sup>,
            onClick: insertSuperscript,
          },
          {
            key: 'subscript',
            title: '??????????????????????',
            children: <sub>????</sub>,
            onClick: insertSubscript,
          },
          {
            key: 'spoiler',
            title: '??????????????, Alt+P',
            children: '??????????????',
            onClick: insertSpoiler,
          },
          {
            key: 'code',
            title: '??????, Alt+C',
            children: '??????',
            onClick: insertCode,
          },
        ]}
      />

      <FileInput
        className="posting-form__files-row"
        setAddFiles={setAddFiles}
        setClear={setClearFileInput}
        onChange={onFilesChange}
      />

      <div
        className={cls([
          'posting-form__drop-wrapper',
          `posting-form__drop-wrapper_${dropOverlayVisible ? 'visible' : 'hidden'}`,
        ])}
      >
        <span className="icon icon_download"></span>
      </div>

      {submitting ? (
        <div className="posting-form__progress-wrapper">
          {error !== null ? (
            <>????????????: {error.message}</>
          ) : (
            <>
              {progressText}

              <div className="posting-form__progress">
                <div className="posting-form__progress-bar" style={{ width: `${progress}%` }}></div>
              </div>

              <button className="button" onClick={onCancelClick}>
                ????????????????
              </button>
            </>
          )}
        </div>
      ) : null}
    </form>
  );
}

interface MarkupButtonsProps {
  readonly className?: string;
  readonly buttons: MarkupButton[];
}

interface MarkupButton {
  readonly key: string;
  readonly title: string;
  readonly children?: any;
  readonly onClick?: () => void;
}

function MarkupButtons({ className, buttons }: MarkupButtonsProps) {
  return (
    <div className={className}>
      {buttons.map((button) => (
        <button
          key={button.key}
          type="button"
          className={cls(['posting-form__markup-button', `posting-form__markup-button_${button.key}`])}
          title={button.title}
          onClick={button.onClick}
        >
          {button.children}
        </button>
      ))}
    </div>
  );
}

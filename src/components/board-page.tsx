import { useMatch, useNavigate } from '@tanstack/react-location';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Thread as ThreadModel, File as FileModel } from '../domain';
import { eventBus } from '../event-bus';
import { THREAD_CREATED } from '../events';
import { LocationGenerics } from '../types';
import { Lightbox } from './lightbox';
import { PostingFormModal } from './posting-form-modal';
import { Thread } from './thread';

export function BoardPage() {
  const {
    data: { threads },
    params,
  } = useMatch<LocationGenerics>();

  const { slug } = params;

  const navigate = useNavigate();
  useEffect(() => {
    function handler(thread?: ThreadModel) {
      if (typeof thread === 'undefined') {
        return;
      }

      navigate({ to: `/${thread.slug}/res/${thread.id}` });
    }

    return eventBus.subscribe(THREAD_CREATED, handler);
  }, []);

  const [lightboxVisible, setLightboxVisible] = useState<boolean>(false);
  const [file, setFile] = useState<FileModel | null>(null);

  const resetPosition = useRef((file: FileModel) => {});
  const setResetPosition = useCallback((value: (file: FileModel) => void) => (resetPosition.current = value), []);

  const onThumbnailClick = useCallback(
    (newFile: FileModel) => {
      setFile((file) => {
        if (file?.hash === newFile?.hash) {
          if (lightboxVisible) {
            setLightboxVisible(false);
            return file;
          } else {
            resetPosition.current(file);
          }
        }

        return file?.originalUrl === newFile.originalUrl ? file : null;
      });

      if (!lightboxVisible || file?.hash !== newFile?.hash) {
        setTimeout(() => {
          setLightboxVisible(true);
          setFile(newFile);
        });
      }
    },
    [lightboxVisible]
  );

  const onLightboxClose = useCallback(() => setLightboxVisible(false), []);

  const threadList = useMemo(() => {
    if (typeof threads === 'undefined') {
      return null;
    }

    return (
      <div className="board-page__threads post-list">
        <h2 className="board-page__title">Список тредов</h2>
        {threads.map((thread) => (
          <Thread key={thread.id} className="post-list__item" thread={thread} onThumbnailClick={onThumbnailClick} />
        ))}
      </div>
    );
  }, [threads, onThumbnailClick]);

  const postingFormModal = useMemo(
    () => <PostingFormModal title="Создать тред" slug={slug} parentId={null} showSubject={true} />,
    [slug]
  );

  const lightbox = useMemo(
    () => (
      <Lightbox visible={lightboxVisible} file={file} setResetPosition={setResetPosition} onClose={onLightboxClose} />
    ),
    [lightboxVisible, file]
  );

  return (
    <div className="board-page">
      {threadList}
      {postingFormModal}
      {lightbox}
    </div>
  );
}

import { useMemo } from 'react';
import { cls } from '../utils';
import { PostingForm } from './posting-form';

interface PostingFormWrapperProps {
  readonly title: string;
  readonly slug: string;
  readonly parentId: number | null;
  readonly showSubject: boolean;
}

export function PostingFormWrapper({ title, slug, parentId, showSubject }: PostingFormWrapperProps) {
  const postingForm = useMemo(
    () => (
      <PostingForm className="posting-form-wrapper__body" slug={slug} parentId={parentId} showSubject={showSubject} />
    ),
    [slug, parentId]
  );

  return (
    <div className={cls(['posting-form-wrapper'])}>
      <div className="posting-form-wrapper__header">
        <h3 className="posting-form-wrapper__title">{title}</h3>
      </div>

      {postingForm}
    </div>
  );
}

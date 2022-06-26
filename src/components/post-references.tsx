import { Post, Thread } from '../domain';
import { Reflink } from './reflink';

interface PostReferencesProps {
  readonly post: Post | Thread;
  readonly ownPostIds?: number[];
}

export function PostReferences({ post, ownPostIds }: PostReferencesProps) {
  if (!post.referencedBy.length) {
    return null;
  }

  return (
    <div className="post__refs">
      Ответы:
      {post.referencedBy.map((ref) => (
        <Reflink
          className="post__ref"
          key={ref.sourceId}
          slug={post.slug}
          threadId={ref.sourceParentId || undefined}
          postId={ref.sourceId}
          ownPostIds={ownPostIds}
        />
      ))}
    </div>
  );
}

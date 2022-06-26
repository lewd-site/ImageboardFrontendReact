import { Link } from '@tanstack/react-location';
import { cls } from '../utils';

interface ReflinkProps {
  readonly className?: string;
  readonly slug?: string;
  readonly threadId?: number;
  readonly postId: number;
  readonly ownPostIds?: number[];
}

export function Reflink({ className, postId, threadId, slug, ownPostIds }: ReflinkProps) {
  const url = typeof threadId !== 'undefined' && typeof slug !== 'undefined' ? `/${slug}/res/${threadId}` : '.';

  return (
    <Link
      className={cls([className, 'reflink', ownPostIds?.includes(postId) && 'reflink_own'])}
      to={url}
      hash={`post_${postId}`}
      rel="ugc"
    >
      &gt;&gt;{postId}
    </Link>
  );
}

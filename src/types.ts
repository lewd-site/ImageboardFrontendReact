import { MakeGenerics } from '@tanstack/react-location';
import { Board, Post, Thread } from './domain';

export type LocationGenerics = MakeGenerics<{
  LoaderData: {
    boards: Board[];
    threads: Thread[];
    posts: Post[];
  };

  RouteMeta: {
    name: string;
  };
}>;

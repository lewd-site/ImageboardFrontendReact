import { MakeGenerics } from '@tanstack/react-location';

export type LocationGenerics = MakeGenerics<{
  RouteMeta: { name: string };
}>;

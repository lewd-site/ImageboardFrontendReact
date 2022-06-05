import { Outlet, ReactLocation, Route, Router } from '@tanstack/react-location';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { browseBoards, browsePosts, browseThreads } from './api';
import { BoardPage } from './components/board-page';
import { Layout } from './components/layout';
import { Spinner } from './components/spinner';
import { ThreadPage } from './components/thread-page';
import settings, { Settings } from './settings';
import { LocationGenerics } from './types';

function applySettings(settings: Settings) {
  if (settings.nsfw) {
    document.body.classList.add('nsfw');
  } else {
    document.body.classList.remove('nsfw');
  }
}

settings.subscribe(applySettings);
applySettings(settings);

document.addEventListener(
  'keydown',
  (e) => {
    if (e.code === 'KeyB') {
      settings.nsfw = !settings.nsfw;
    }
  },
  { passive: true }
);

function createApp() {
  const element = document.getElementById('app');
  if (element === null) {
    throw new Error('#app not found');
  }

  const location = new ReactLocation<LocationGenerics>();
  const routes: Route<LocationGenerics>[] = [
    {
      path: '/',
      element: <Layout />,
      loader: async () => ({ boards: await browseBoards() }),
      children: [
        {
          path: ':slug',
          loader: async ({ params: { slug } }) => ({
            threads: await browseThreads(slug),
          }),
          loaderMaxAge: 0,
          children: [
            {
              path: '/',
              element: <BoardPage />,
              pendingElement: <Spinner />,
              pendingMs: 100,
              pendingMinMs: 100,
            },
            {
              path: 'res/:parentId',
              element: <ThreadPage />,
              loader: async ({ params: { slug, parentId } }) => ({
                posts: await browsePosts(slug, Number(parentId)),
              }),
              loaderMaxAge: 0,
              pendingElement: <Spinner />,
              pendingMs: 100,
              pendingMinMs: 100,
            },
          ],
        },
      ],
    },
    {
      path: '*',
    },
  ];

  const root = createRoot(element);
  root.render(
    <StrictMode>
      <Router location={location} routes={routes}>
        <Outlet />
      </Router>
    </StrictMode>
  );
}

createApp();

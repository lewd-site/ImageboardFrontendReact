import { Outlet, ReactLocation, Route, Router } from '@tanstack/react-location';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { browseBoards, browsePosts, browseThreads } from './api';
import { BoardPage } from './components/board-page';
import { IndexPage } from './components/index-page';
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
  (event) => {
    if (event.code === 'KeyB') {
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
      id: 'layout',
      path: '/',
      element: <Layout />,
      loader: async () => ({ boards: await browseBoards() }),
      children: [
        {
          id: 'index',
          path: '/',
          element: <IndexPage />,
          pendingElement: <Spinner />,
          pendingMs: 100,
          pendingMinMs: 100,
          meta: {
            name: 'index',
          },
        },
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
              meta: {
                name: 'board',
              },
            },
            {
              path: 'res/:parentId',
              element: <ThreadPage />,
              loader: async ({ params: { slug, parentId } }) => ({
                posts: await browsePosts(slug, Number(parentId.split('.').shift())),
              }),
              loaderMaxAge: 0,
              pendingElement: <Spinner />,
              pendingMs: 100,
              pendingMinMs: 100,
              meta: {
                name: 'thread',
              },
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
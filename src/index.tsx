import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './components/app';
import settings, { Settings } from './settings';

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

  const root = createRoot(element);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

createApp();

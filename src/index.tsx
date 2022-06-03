import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './components/app';

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

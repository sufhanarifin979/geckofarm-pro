import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';

console.log("main.tsx: Module is loading...");

import App from './App';
import './index.css';

console.log("main.tsx: All imports done, attempting to render...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("main.tsx: Root element not found!");
  throw new Error('Root element not found');
}

console.log("main.tsx: Root element found, calling createRoot...");

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      registration.unregister().then(() => {
        console.log('Past service worker cleanly unregistered');
      });
    }
  });
}

// Dynamically delete stale cache storage to bust physical file cache
if ('caches' in window) {
  caches.keys().then(names => {
    for (const name of names) {
      caches.delete(name).then(() => {
        console.log('Cache storage cleaned:', name);
      });
    }
  });
}

console.log("main.tsx: createRoot and render called.");

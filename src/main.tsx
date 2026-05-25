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
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}

console.log("main.tsx: createRoot and render called.");

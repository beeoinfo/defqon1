import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Entry point for the application.  This file mirrors the original project
// entry point and simply mounts the root React component into the DOM.  It
// pulls in the global stylesheet and renders the App wrapped in React's
// StrictMode to aid in catching potential side‑effects during development.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
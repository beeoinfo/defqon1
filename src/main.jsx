import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerAppServiceWorker } from './lib/pwaRegistration';
import './global.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

registerAppServiceWorker();

const SERVICE_WORKER_URL = '/service-worker.js';

export const registerAppServiceWorker = () => {
  if (
    !import.meta.env.PROD ||
    typeof window === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !window.isSecureContext
  ) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(SERVICE_WORKER_URL, { scope: '/' })
      .then((registration) => {
        registration.update().catch(() => {});
      })
      .catch(() => {});
  });
};

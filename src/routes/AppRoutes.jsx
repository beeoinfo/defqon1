export const APP_ROUTES = [
  { path: '/', view: 'lineup' },
  { path: '/lineup', view: 'lineup' },
  { path: '/maps', view: 'maps' },
  { path: '/reviews', view: 'reviews' },
  { path: '/tribe', view: 'tribe' },
  { path: '/search', view: 'search' },
  { path: '/profile', view: 'profileSettings' },
];

const normalizePath = (pathname) => pathname.replace(/\/+/g, '/').replace(/\/$/, '') || '/';

export const resolveRoute = (pathname) => {
  const normalizedPath = normalizePath(pathname);
  return APP_ROUTES.find((route) => route.path === normalizedPath) ?? APP_ROUTES[0];
};

export const getPathForView = (view) => {
  const route = APP_ROUTES.find((entry) => entry.view === view);
  return route?.path ?? '/lineup';
};

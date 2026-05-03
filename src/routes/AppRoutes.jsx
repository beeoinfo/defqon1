import { activeSite } from '@/sites/siteDefinitions';

export const isStorybookViewEnabled = import.meta.env.DEV && Boolean(import.meta.env.VITE_ENV);

export const APP_DOCUMENT_TITLE = activeSite.name;

export const VIEW_TITLES = {
  lineup: 'Line-up',
  maps: 'Maps',
  reviews: 'Reviews',
  search: 'Search',
  storybook: 'Storybook',
  timetable: 'Timetable',
};

export const APP_ROUTES = [
  { path: '/', view: 'lineup' },
  { path: '/lineup', view: 'lineup' },
  { path: '/search', view: 'search' },
  { path: '/timetable', view: 'timetable' },
  { path: '/maps', view: 'maps' },
  { path: '/reviews', view: 'reviews' },
];

export const STORYBOOK_VIEW_ROUTE = {
  path: '/',
  view: 'storybook',
  searchParam: 'view',
};

const normalizePath = (pathname) => pathname.replace(/\/+/g, '/').replace(/\/$/, '') || '/';

const matchesStorybookRoute = (pathname, search) => {
  if (!isStorybookViewEnabled) {
    return false;
  }

  const searchParams = new URLSearchParams(search);

  return pathname === STORYBOOK_VIEW_ROUTE.path
    && searchParams.get('storybook') === STORYBOOK_VIEW_ROUTE.searchParam;
};

export const resolveRoute = (pathname, search = '') => {
  const normalizedPath = normalizePath(pathname);

  if (matchesStorybookRoute(normalizedPath, search)) {
    return STORYBOOK_VIEW_ROUTE;
  }

  return APP_ROUTES.find((route) => route.path === normalizedPath) ?? APP_ROUTES[0];
};

export const getPathForView = (view) => {
  if (view === STORYBOOK_VIEW_ROUTE.view) {
    return STORYBOOK_VIEW_ROUTE.path;
  }

  const route = APP_ROUTES.find((entry) => entry.view === view);
  return route?.path ?? '/lineup';
};

export const getUrlForView = (view) => {
  if (view === STORYBOOK_VIEW_ROUTE.view && isStorybookViewEnabled) {
    return `${STORYBOOK_VIEW_ROUTE.path}?storybook=${STORYBOOK_VIEW_ROUTE.searchParam}`;
  }

  return getPathForView(view);
};

export const getTitleForView = (view) => VIEW_TITLES[view] ?? APP_DOCUMENT_TITLE;

export const formatDocumentTitle = (title) => {
  const normalizedTitle = String(title ?? '').trim();

  if (!normalizedTitle || normalizedTitle === APP_DOCUMENT_TITLE) {
    return APP_DOCUMENT_TITLE;
  }

  return `${normalizedTitle} | ${APP_DOCUMENT_TITLE}`;
};

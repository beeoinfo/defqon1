const PAGE_STACK_HISTORY_KEY = 'dqPageStack';

const isValidHistoryPage = (page, pageDefinitions) => (
  Boolean(page)
  && typeof page.id === 'string'
  && typeof page.type === 'string'
  && Boolean(pageDefinitions[page.type])
);

const getNumericIdSuffix = (pageId) => {
  const match = /-(\d+)$/.exec(pageId);

  return match ? Number(match[1]) : 0;
};

const createHistoryState = (pageStack) => ({
  [PAGE_STACK_HISTORY_KEY]: pageStack.map((page) => ({
    id: page.id,
    type: page.type,
  })),
});

export const getHistoryPageStack = ({ historyState, pageDefinitions }) => {
  const historyPageStack = historyState?.[PAGE_STACK_HISTORY_KEY];

  if (!Array.isArray(historyPageStack)) {
    return [];
  }

  return historyPageStack.filter((page) => isValidHistoryPage(page, pageDefinitions));
};

export const pushHistoryPageStackState = ({ url, pageStack }) => {
  window.history.pushState(createHistoryState(pageStack), '', url);
};

export const replaceHistoryPageStackState = ({ url, pageStack }) => {
  window.history.replaceState(createHistoryState(pageStack), '', url);
};

export const syncPageStackIdRef = ({ pageIdRef, pageStack }) => {
  const maxPageIndex = pageStack.reduce((maxIndex, page) => (
    Math.max(maxIndex, getNumericIdSuffix(page.id))
  ), 0);

  pageIdRef.current = Math.max(pageIdRef.current, maxPageIndex);
};

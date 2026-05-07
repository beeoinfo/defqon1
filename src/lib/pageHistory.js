const PAGE_STACK_HISTORY_KEY = 'dqPageStack';

const isValidHistoryPage = (page, pageDefinitions) => (
  Boolean(page)
  && typeof page.id === 'string'
  && typeof page.type === 'string'
  && Boolean(pageDefinitions[page.type])
);

const normalizeHistoryPageStack = (pageStack, pageDefinitions) => (
  pageStack.reduce((stack, page) => {
    const pageDefinition = pageDefinitions[page.type] ?? {};
    const stackGroup = pageDefinition.stackGroup ?? null;
    const nextStack = stack.filter((stackPage) => {
      if (stackPage.type === page.type) {
        return false;
      }

      if (!stackGroup) {
        return true;
      }

      return pageDefinitions[stackPage.type]?.stackGroup !== stackGroup;
    });

    return [...nextStack, page];
  }, [])
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

const normalizeUrl = (url) => String(url ?? '').trim();

const getCurrentHistoryUrl = () => `${window.location.pathname}${window.location.search}`;

const getHistoryPageStackSnapshot = (historyState) => (
  Array.isArray(historyState?.[PAGE_STACK_HISTORY_KEY])
    ? historyState[PAGE_STACK_HISTORY_KEY].map((page) => ({
        id: page.id,
        type: page.type,
      }))
    : []
);

const pageStacksMatch = (leftStack, rightStack) => (
  leftStack.length === rightStack.length &&
  leftStack.every((leftPage, index) => {
    const rightPage = rightStack[index];

    return leftPage.id === rightPage?.id && leftPage.type === rightPage?.type;
  })
);

export const getHistoryPageStack = ({ historyState, pageDefinitions }) => {
  const historyPageStack = historyState?.[PAGE_STACK_HISTORY_KEY];

  if (!Array.isArray(historyPageStack)) {
    return [];
  }

  return normalizeHistoryPageStack(
    historyPageStack.filter((page) => isValidHistoryPage(page, pageDefinitions)),
    pageDefinitions
  );
};

export const pushHistoryPageStackState = ({ url, pageStack }) => {
  window.history.pushState(createHistoryState(pageStack), '', url);
};

export const replaceHistoryPageStackState = ({ url, pageStack }) => {
  window.history.replaceState(createHistoryState(pageStack), '', url);
};

export const commitPageHistoryState = ({ url, pageStack, mode = 'auto' }) => {
  const nextUrl = normalizeUrl(url);
  const currentUrl = getCurrentHistoryUrl();
  const currentStack = getHistoryPageStackSnapshot(window.history.state);
  const nextState = createHistoryState(pageStack);
  const nextStack = nextState[PAGE_STACK_HISTORY_KEY];
  const isSameState =
    normalizeUrl(currentUrl) === nextUrl &&
    pageStacksMatch(currentStack, nextStack);

  if (isSameState) {
    return 'none';
  }

  const shouldPush = mode === 'push' || (
    mode === 'auto' &&
    nextStack.length > currentStack.length
  );

  if (shouldPush) {
    window.history.pushState(nextState, '', nextUrl);
    return 'push';
  }

  window.history.replaceState(nextState, '', nextUrl);
  return 'replace';
};

export const syncPageStackIdRef = ({ pageIdRef, pageStack }) => {
  const maxPageIndex = pageStack.reduce((maxIndex, page) => (
    Math.max(maxIndex, getNumericIdSuffix(page.id))
  ), 0);

  pageIdRef.current = Math.max(pageIdRef.current, maxPageIndex);
};

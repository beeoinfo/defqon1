import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Page from './components/layout/Page';
import View from './components/layout/View';
import useAnimatedPageStack from './hooks/useAnimatedPageStack';
import useDocumentScrollLock from './hooks/useDocumentScrollLock';
import { getNextPageStackOnOpen } from './lib/pageStack';
import { PAGE_DEFINITIONS } from './page/pageDefinitions';
import { getPathForView, resolveRoute } from './routes/AppRoutes';
import UiThemeScope from './theme/UiThemeScope';
import LineUpView from './views/LineUpView';
import StorybookView from './views/StorybookView';

const getStorybookMode = () => {
  if (!import.meta.env.DEV || typeof window === 'undefined') {
    return null;
  }

  const searchParams = new URLSearchParams(window.location.search);
  const mode = searchParams.get('storybook');

  return mode === 'view' || mode === 'page' ? mode : null;
};

const AppBaseView = memo(({ activeView, onOpenSettings, isHidden }) => {
  if (activeView !== 'lineup') {
    return null;
  }

  return (
    <View onUserClick={onOpenSettings} isHidden={isHidden}>
      <LineUpView />
    </View>
  );
});

AppBaseView.displayName = 'AppBaseView';

const AppPageLayer = memo(({
  page,
  layerIndex,
  onClosePage,
  onOpenPage,
  isHidden,
  transitionState,
}) => {
  const pageDefinition = PAGE_DEFINITIONS[page.type];

  if (!pageDefinition) {
    return null;
  }

  const PageContent = pageDefinition.Component;

  return (
    <Page
      title={pageDefinition.title}
      onClose={() => onClosePage(page.id)}
      onOpenPage={onOpenPage}
      isHidden={isHidden}
      transitionState={transitionState}
      layerIndex={layerIndex}
    >
      <PageContent onOpenPage={onOpenPage} />
    </Page>
  );
});

AppPageLayer.displayName = 'AppPageLayer';

const App = () => {
  const storybookMode = useMemo(() => getStorybookMode(), []);
  const initialRoute = useMemo(() => resolveRoute(window.location.pathname), []);
  const pageIdRef = useRef(0);
  const [activeView, setActiveView] = useState(initialRoute.view);
  const [pageStack, setPageStack] = useState([]);
  const {
    renderedPageStack,
    hasRenderedPages,
    shouldHideBaseView,
    getIsPageHidden,
  } = useAnimatedPageStack(pageStack);

  useDocumentScrollLock(hasRenderedPages);

  useEffect(() => {
    if (storybookMode) {
      return undefined;
    }

    const handlePopState = () => {
      const nextRoute = resolveRoute(window.location.pathname);
      setActiveView(nextRoute.view);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [storybookMode]);

  useEffect(() => {
    if (storybookMode) {
      return undefined;
    }

    const nextPath = getPathForView(activeView);
    const currentPath = window.location.pathname;

    if (currentPath === nextPath) {
      return undefined;
    }

    const nextUrl = `${nextPath}${window.location.search}${window.location.hash}`;
    window.history.pushState({}, '', nextUrl);

    return undefined;
  }, [activeView, storybookMode]);

  const openPage = useCallback((type) => {
    if (!PAGE_DEFINITIONS[type]) {
      return;
    }

    setPageStack((currentStack) =>
      getNextPageStackOnOpen({
        currentStack,
        nextType: type,
        pageDefinitions: PAGE_DEFINITIONS,
        createPageId: (pageType) => {
          pageIdRef.current += 1;
          return `${pageType}-${pageIdRef.current}`;
        },
      })
    );
  }, []);

  const closePage = useCallback((pageId) => {
    setPageStack((currentStack) => currentStack.filter((page) => page.id !== pageId));
  }, []);

  const openSettings = useCallback(() => {
    openPage('settings');
  }, [openPage]);

  const baseView = useMemo(() => (
    <AppBaseView
      activeView={activeView}
      onOpenSettings={openSettings}
      isHidden={shouldHideBaseView}
    />
  ), [activeView, openSettings, shouldHideBaseView]);

  if (storybookMode) {
    return <StorybookView mode={storybookMode} />;
  }

  return (
    <UiThemeScope>
      {baseView}

      {renderedPageStack.map((page, index) => (
        <AppPageLayer
          key={page.id}
          page={page}
          layerIndex={index}
          onClosePage={closePage}
          onOpenPage={openPage}
          isHidden={getIsPageHidden(index)}
          transitionState={page.transitionState}
        />
      ))}
    </UiThemeScope>
  );
};

export default App;

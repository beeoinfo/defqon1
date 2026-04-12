import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Page from './components/layout/Page';
import View from './components/layout/View';
import useAnimatedPageStack from './hooks/useAnimatedPageStack';
import useDocumentScrollLock from './hooks/useDocumentScrollLock';
import {
  getHistoryPageStack,
  pushHistoryPageStackState,
  replaceHistoryPageStackState,
  syncPageStackIdRef,
} from './lib/pageHistory';
import {
  getNextPageStackOnClose,
  getNextPageStackOnOpen,
} from './lib/pageStack';
import { PAGE_DEFINITIONS } from './page/pageDefinitions';
import { getUrlForView, resolveRoute } from './routes/AppRoutes';
import UiThemeScope from './theme/UiThemeScope';
import LineUpView from './views/LineUpView';
import MapsView from './views/MapsView';
import ReviewsView from './views/ReviewsView';
import StorybookView from './views/StorybookView';
import TribeView from './views/TribeView';

const VIEW_COMPONENTS = {
  lineup: LineUpView,
  maps: MapsView,
  reviews: ReviewsView,
  tribe: TribeView,
};

const AppBaseView = memo(({
  activeView,
  onOpenView,
  onOpenSearch,
  onOpenSettings,
  headerTransitionState,
  isHidden,
}) => {
  const ActiveViewComponent = VIEW_COMPONENTS[activeView];

  if (!ActiveViewComponent) {
    return null;
  }

  return (
    <View
      navbar
      activeView={activeView}
      onOpenView={onOpenView}
      onOpenSearch={onOpenSearch}
      onUserClick={onOpenSettings}
      headerTransitionState={headerTransitionState}
      isHidden={isHidden}
    >
      <ActiveViewComponent />
    </View>
  );
});

AppBaseView.displayName = 'AppBaseView';

const AppPageLayer = memo(({
  page,
  layerIndex,
  onClosePage,
  onOpenPage,
  onOpenView,
  isHidden,
  transitionState,
}) => {
  const pageDefinition = PAGE_DEFINITIONS[page.type];

  if (!pageDefinition) {
    return null;
  }

  const PageContent = pageDefinition.Component;
  const HeaderContent = pageDefinition.HeaderContentComponent;

  return (
    <Page
      title={pageDefinition.title}
      onClose={() => onClosePage(page.id)}
      onOpenPage={onOpenPage}
      onOpenView={onOpenView}
      headerContent={HeaderContent ? <HeaderContent onClosePage={() => onClosePage(page.id)} /> : null}
      showFooter={pageDefinition.showFooter !== false}
      wideHeaderContent={pageDefinition.wideHeaderContent === true}
      hideHeaderBrand={pageDefinition.hideHeaderBrand === true}
      showCloseButton={pageDefinition.showCloseButton !== false}
      inlineCloseButton={pageDefinition.inlineCloseButton === true}
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
  const initialRoute = useMemo(
    () => resolveRoute(window.location.pathname, window.location.search),
    []
  );
  const pageIdRef = useRef(0);
  const initialPageStack = useMemo(
    () => getHistoryPageStack({
      historyState: window.history.state,
      pageDefinitions: PAGE_DEFINITIONS,
    }),
    []
  );
  const pageStackRef = useRef(initialPageStack);
  const [activeView, setActiveView] = useState(initialRoute.view);
  const [pageStack, setPageStack] = useState(initialPageStack);
  const {
    renderedPageStack,
    hasRenderedPages,
    shouldHideBaseView,
    topPageTransitionState,
    getIsPageHidden,
  } = useAnimatedPageStack(pageStack);

  useDocumentScrollLock(hasRenderedPages);

  useEffect(() => {
    pageStackRef.current = pageStack;
    syncPageStackIdRef({
      pageIdRef,
      pageStack,
    });
  }, [pageStack]);

  useEffect(() => {
    replaceHistoryPageStackState({
      url: `${window.location.pathname}${window.location.search}`,
      pageStack,
    });
  }, []);

  useEffect(() => {
    const handlePopState = (event) => {
      const nextRoute = resolveRoute(window.location.pathname, window.location.search);
      const nextPageStack = getHistoryPageStack({
        historyState: event.state,
        pageDefinitions: PAGE_DEFINITIONS,
      });

      pageStackRef.current = nextPageStack;
      setActiveView(nextRoute.view);
      setPageStack(nextPageStack);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const openPage = useCallback((type) => {
    if (!PAGE_DEFINITIONS[type]) {
      return;
    }

    const nextStack = getNextPageStackOnOpen({
      currentStack: pageStackRef.current,
      nextType: type,
      pageDefinitions: PAGE_DEFINITIONS,
      createPageId: (pageType) => {
        pageIdRef.current += 1;
        return `${pageType}-${pageIdRef.current}`;
      },
    });

    if (nextStack === pageStackRef.current) {
      return;
    }

    pushHistoryPageStackState({
      url: getUrlForView(activeView),
      pageStack: nextStack,
    });

    pageStackRef.current = nextStack;
    setPageStack(nextStack);
  }, [activeView]);

  const closePage = useCallback((pageId) => {
    const nextStack = getNextPageStackOnClose({
      currentStack: pageStackRef.current,
      pageId,
    });

    if (nextStack === pageStackRef.current) {
      return;
    }

    pushHistoryPageStackState({
      url: getUrlForView(activeView),
      pageStack: nextStack,
    });

    pageStackRef.current = nextStack;
    setPageStack(nextStack);
  }, [activeView]);

  const openSettings = useCallback(() => {
    openPage('settings');
  }, [openPage]);

  const openView = useCallback((view) => {
    if (view === activeView && pageStack.length === 0) {
      return;
    }

    pushHistoryPageStackState({
      url: getUrlForView(view),
      pageStack: [],
    });

    pageStackRef.current = [];
    setPageStack([]);
    setActiveView(view);
  }, [activeView, pageStack.length]);

  const openSearch = useCallback(() => {
    openPage('search');
  }, [openPage]);

  const baseViewHeaderTransitionState = useMemo(() => {
    if (!hasRenderedPages) {
      return 'open';
    }

    if (topPageTransitionState === 'entering') {
      return 'exiting';
    }

    if (topPageTransitionState === 'exiting') {
      return 'entering';
    }

    return 'covered';
  }, [hasRenderedPages, topPageTransitionState]);

  const baseView = useMemo(() => (
    <AppBaseView
      activeView={activeView}
      onOpenView={openView}
      onOpenSearch={openSearch}
      onOpenSettings={openSettings}
      headerTransitionState={baseViewHeaderTransitionState}
      isHidden={shouldHideBaseView}
    />
  ), [activeView, baseViewHeaderTransitionState, openSearch, openSettings, openView, shouldHideBaseView]);

  if (activeView === 'storybook') {
    return <StorybookView onOpenView={openView} />;
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
          onOpenView={openView}
          isHidden={getIsPageHidden(index)}
          transitionState={page.transitionState}
        />
      ))}
    </UiThemeScope>
  );
};

export default App;

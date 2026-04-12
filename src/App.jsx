import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Page from './components/layout/Page';
import View from './components/layout/View';
import useAnimatedPageStack from './hooks/useAnimatedPageStack';
import useDocumentScrollLock from './hooks/useDocumentScrollLock';
import { getNextPageStackOnOpen } from './lib/pageStack';
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
    const handlePopState = () => {
      const nextRoute = resolveRoute(window.location.pathname, window.location.search);
      setPageStack([]);
      setActiveView(nextRoute.view);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    const nextUrl = getUrlForView(activeView);
    const currentUrl = `${window.location.pathname}${window.location.search}`;

    if (currentUrl === nextUrl) {
      return undefined;
    }

    window.history.pushState({}, '', nextUrl);

    return undefined;
  }, [activeView]);

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

  const openView = useCallback((view) => {
    setPageStack([]);
    setActiveView(view);
  }, []);

  const openSearch = useCallback(() => {
    openPage('search');
  }, [openPage]);

  const baseView = useMemo(() => (
    <AppBaseView
      activeView={activeView}
      onOpenView={openView}
      onOpenSearch={openSearch}
      onOpenSettings={openSettings}
      isHidden={shouldHideBaseView}
    />
  ), [activeView, openSearch, openSettings, openView, shouldHideBaseView]);

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

import { useEffect, useRef, useState } from 'react';

const PAGE_STACK_EXIT_DURATION_MS = 200;

const useAnimatedPageStack = (pageStack) => {
  const [renderedPageStack, setRenderedPageStack] = useState(() =>
    pageStack.map((page) => ({
      ...page,
      transitionState: 'open',
    }))
  );
  const exitTimeoutsRef = useRef(new Map());

  useEffect(() => {
    setRenderedPageStack((currentStack) => {
      const currentPagesById = new Map(currentStack.map((page) => [page.id, page]));
      const nextIds = new Set(pageStack.map((page) => page.id));
      const nextRenderedStack = pageStack.map((page) => {
        const existingPage = currentPagesById.get(page.id);

        if (!existingPage) {
          return {
            ...page,
            transitionState: 'entering',
          };
        }

        const existingExitTimeout = exitTimeoutsRef.current.get(page.id);

        if (existingExitTimeout) {
          window.clearTimeout(existingExitTimeout);
          exitTimeoutsRef.current.delete(page.id);
        }

        return {
          ...existingPage,
          ...page,
          transitionState:
            existingPage.transitionState === 'exiting'
              ? 'entering'
              : existingPage.transitionState,
        };
      });

      currentStack.forEach((page) => {
        if (nextIds.has(page.id)) {
          return;
        }

        nextRenderedStack.push({
          ...page,
          transitionState: 'exiting',
        });
      });

      return nextRenderedStack;
    });
  }, [pageStack]);

  useEffect(() => {
    const hasEnteringPages = renderedPageStack.some((page) => page.transitionState === 'entering');

    if (!hasEnteringPages) {
      return undefined;
    }

    const animationFrameId = window.requestAnimationFrame(() => {
      setRenderedPageStack((currentStack) =>
        currentStack.map((page) =>
          page.transitionState === 'entering'
            ? {
                ...page,
                transitionState: 'open',
              }
            : page
        )
      );
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [renderedPageStack]);

  useEffect(() => {
    const exitingPages = renderedPageStack.filter((page) => page.transitionState === 'exiting');
    const exitingPageIds = new Set(exitingPages.map((page) => page.id));

    exitingPages.forEach((page) => {
      if (exitTimeoutsRef.current.has(page.id)) {
        return;
      }

      const timeoutId = window.setTimeout(() => {
        exitTimeoutsRef.current.delete(page.id);
        setRenderedPageStack((currentStack) =>
          currentStack.filter((currentPage) => currentPage.id !== page.id)
        );
      }, PAGE_STACK_EXIT_DURATION_MS);

      exitTimeoutsRef.current.set(page.id, timeoutId);
    });

    exitTimeoutsRef.current.forEach((timeoutId, pageId) => {
      if (exitingPageIds.has(pageId)) {
        return;
      }

      window.clearTimeout(timeoutId);
      exitTimeoutsRef.current.delete(pageId);
    });

    return undefined;
  }, [renderedPageStack]);

  useEffect(() => {
    return () => {
      exitTimeoutsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      exitTimeoutsRef.current.clear();
    };
  }, []);

  const topPage = renderedPageStack[renderedPageStack.length - 1] ?? null;
  const shouldRevealPreviousLayer =
    topPage?.transitionState === 'entering' || topPage?.transitionState === 'exiting';
  const firstVisiblePageIndex =
    renderedPageStack.length === 0
      ? -1
      : shouldRevealPreviousLayer
        ? Math.max(renderedPageStack.length - 2, 0)
        : renderedPageStack.length - 1;
  const shouldHideBaseView =
    renderedPageStack.length > 0 &&
    !(renderedPageStack.length === 1 && shouldRevealPreviousLayer);

  return {
    renderedPageStack,
    hasRenderedPages: renderedPageStack.length > 0,
    shouldHideBaseView,
    topPageTransitionState: topPage?.transitionState ?? 'closed',
    getIsPageHidden: (index) => index < firstVisiblePageIndex,
  };
};

export default useAnimatedPageStack;

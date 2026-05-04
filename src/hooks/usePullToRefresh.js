import { useCallback, useEffect, useRef, useState } from 'react';

const PULL_THRESHOLD = 92;
const PULL_RESISTANCE = 0.42;
const REFRESH_HOLD_DISTANCE = 88;
const REFRESH_TRIGGER_DELAY = 80;
const RESET_DELAY = 360;

const getScrollTop = (container) => {
  if (!container) {
    return window.scrollY || document.documentElement.scrollTop || 0;
  }

  return container.scrollTop;
};

const getScrollContainer = (target) => {
  const pageLayer = target?.closest?.('.dq-layout-page');

  return pageLayer ?? null;
};

const shouldIgnoreTouchTarget = (target) => (
  Boolean(target?.closest?.('input, textarea, select, button, [contenteditable="true"]'))
);

const getPullDistance = (deltaY) => Math.max(deltaY * PULL_RESISTANCE, 0);

const usePullToRefresh = ({ disabled = false, onRefresh }) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshState, setRefreshState] = useState('idle');
  const [isDragging, setIsDragging] = useState(false);
  const pullProgress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const gestureRef = useRef({
    isTracking: false,
    startX: 0,
    startY: 0,
    scrollContainer: null,
    pullDistance: 0,
    hasTriggeredRefresh: false,
    hasArmedRefresh: false,
  });
  const resetTimeoutRef = useRef(0);
  const triggerTimeoutRef = useRef(0);
  const refreshStateRef = useRef(refreshState);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    refreshStateRef.current = refreshState;
  }, [refreshState]);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  const resetPull = useCallback((delay = 0) => {
    if (resetTimeoutRef.current) {
      window.clearTimeout(resetTimeoutRef.current);
    }

    if (triggerTimeoutRef.current) {
      window.clearTimeout(triggerTimeoutRef.current);
      triggerTimeoutRef.current = 0;
    }

    resetTimeoutRef.current = window.setTimeout(() => {
      resetTimeoutRef.current = 0;
      setPullDistance(0);
      setRefreshState('idle');
      setIsDragging(false);
    }, delay);
  }, []);

  const triggerRefresh = useCallback(() => {
    const gesture = gestureRef.current;

    if (gesture.hasTriggeredRefresh) {
      return;
    }

    gesture.hasTriggeredRefresh = true;
    gesture.isTracking = false;
    gesture.pullDistance = REFRESH_HOLD_DISTANCE;
    setIsDragging(false);
    setPullDistance(REFRESH_HOLD_DISTANCE);
    setRefreshState('refreshing');

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        Promise.resolve(onRefreshRef.current?.())
          .catch((error) => {
            console.error(error);
          })
          .finally(() => {
            resetPull(RESET_DELAY);
          });
      });
    });
  }, [resetPull]);

  useEffect(() => {
    if (disabled) {
      return undefined;
    }

    const handleTouchStart = (event) => {
      if (event.touches.length !== 1 || refreshStateRef.current === 'refreshing') {
        return;
      }

      const touch = event.touches[0];
      const scrollContainer = getScrollContainer(event.target);

      if (shouldIgnoreTouchTarget(event.target) || getScrollTop(scrollContainer) > 0) {
        return;
      }

      gestureRef.current = {
        isTracking: true,
        startX: touch.clientX,
        startY: touch.clientY,
        scrollContainer,
        pullDistance: 0,
        hasTriggeredRefresh: false,
        hasArmedRefresh: false,
      };
      setIsDragging(true);
    };

    const handleTouchMove = (event) => {
      const gesture = gestureRef.current;

      if (!gesture.isTracking || event.touches.length !== 1) {
        return;
      }

      if (getScrollTop(gesture.scrollContainer) > 0) {
        gesture.isTracking = false;
        setIsDragging(false);
        resetPull();
        return;
      }

      const touch = event.touches[0];
      const deltaX = touch.clientX - gesture.startX;
      const deltaY = touch.clientY - gesture.startY;

      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 12) {
        gesture.isTracking = false;
        setIsDragging(false);
        resetPull();
        return;
      }

      if (deltaY <= 0) {
        gesture.pullDistance = 0;
        setPullDistance(0);
        setRefreshState('idle');
        return;
      }

      event.preventDefault();

      const nextDistance = getPullDistance(deltaY);

      gesture.pullDistance = nextDistance;
      setPullDistance(nextDistance);
      setRefreshState(nextDistance >= PULL_THRESHOLD ? 'ready' : 'pulling');

      if (nextDistance >= PULL_THRESHOLD && !gesture.hasArmedRefresh) {
        gesture.hasArmedRefresh = true;
        triggerTimeoutRef.current = window.setTimeout(() => {
          triggerTimeoutRef.current = 0;
          triggerRefresh();
        }, REFRESH_TRIGGER_DELAY);
      }
    };

    const handleTouchEnd = () => {
      const gesture = gestureRef.current;

      if (!gesture.isTracking) {
        return;
      }

      gesture.isTracking = false;
      setIsDragging(false);

      if (gesture.hasArmedRefresh) {
        triggerRefresh();
      } else {
        resetPull();
      }
    };

    const handleTouchCancel = () => {
      const gesture = gestureRef.current;

      gesture.isTracking = false;
      setIsDragging(false);

      if (gesture.hasArmedRefresh) {
        triggerRefresh();
      } else {
        resetPull();
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchCancel);

      if (resetTimeoutRef.current) {
        window.clearTimeout(resetTimeoutRef.current);
      }

      if (triggerTimeoutRef.current) {
        window.clearTimeout(triggerTimeoutRef.current);
      }
    };
  }, [disabled, resetPull, triggerRefresh]);

  return {
    pullDistance,
    pullProgress,
    refreshState,
    isDragging,
    isPullVisible: pullDistance > 0 || refreshState === 'refreshing',
  };
};

export default usePullToRefresh;

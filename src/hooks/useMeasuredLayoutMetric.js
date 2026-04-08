import { useEffect } from 'react';

const getLayoutMetricScope = (element) => (
  element?.closest?.('.dq-ui-theme') ?? document.documentElement
);

const useMeasuredLayoutMetric = (ref, propertyName) => {
  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return undefined;
    }

    const scope = getLayoutMetricScope(element);

    const syncMetric = () => {
      scope.style.setProperty(propertyName, `${element.getBoundingClientRect().height}px`);
    };

    syncMetric();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', syncMetric);

      return () => {
        window.removeEventListener('resize', syncMetric);
        scope.style.removeProperty(propertyName);
      };
    }

    const resizeObserver = new ResizeObserver(syncMetric);
    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
      scope.style.removeProperty(propertyName);
    };
  }, [propertyName, ref]);
};

export default useMeasuredLayoutMetric;

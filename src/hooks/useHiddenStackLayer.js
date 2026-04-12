import { useEffect, useRef } from 'react';

const useHiddenStackLayer = (isHidden) => {
  const layerRef = useRef(null);

  useEffect(() => {
    const element = layerRef.current;

    if (!element) {
      return undefined;
    }

    if (isHidden) {
      const activeElement = document.activeElement;

      if (activeElement instanceof HTMLElement && element.contains(activeElement)) {
        activeElement.blur();
      }

      element.setAttribute('inert', '');
      return () => {
        element.removeAttribute('inert');
      };
    }

    element.removeAttribute('inert');
    return undefined;
  }, [isHidden]);

  return layerRef;
};

export default useHiddenStackLayer;

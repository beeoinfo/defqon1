import { useEffect } from 'react';
import { lockDocumentScroll, unlockDocumentScroll } from '../lib/documentScrollLock';

const useDocumentScrollLock = (isLocked) => {
  useEffect(() => {
    if (!isLocked) {
      return undefined;
    }

    lockDocumentScroll();

    return () => {
      unlockDocumentScroll();
    };
  }, [isLocked]);
};

export default useDocumentScrollLock;

let documentScrollLockCount = 0;
let previousHtmlOverflow = '';
let previousBodyOverflow = '';

export const lockDocumentScroll = () => {
  if (typeof document === 'undefined') {
    return;
  }

  if (documentScrollLockCount === 0) {
    previousHtmlOverflow = document.documentElement.style.overflow;
    previousBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
  }

  documentScrollLockCount += 1;
};

export const unlockDocumentScroll = () => {
  if (typeof document === 'undefined' || documentScrollLockCount === 0) {
    return;
  }

  documentScrollLockCount -= 1;

  if (documentScrollLockCount > 0) {
    return;
  }

  document.documentElement.style.overflow = previousHtmlOverflow;
  document.body.style.overflow = previousBodyOverflow;
};

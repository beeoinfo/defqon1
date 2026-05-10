import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const isIosDevice = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  const userAgent = window.navigator.userAgent.toLowerCase();
  const platform = window.navigator.platform?.toLowerCase() ?? '';

  return (
    /iphone|ipad|ipod/.test(userAgent) ||
    (platform === 'macintel' && window.navigator.maxTouchPoints > 1)
  );
};

const isStandaloneDisplay = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.matchMedia?.('(display-mode: fullscreen)').matches ||
    window.navigator.standalone === true
  );
};

const getInitialInstallState = () => ({
  canPromptInstall: false,
  isInstalled: isStandaloneDisplay(),
  isIos: isIosDevice(),
  isStandalone: isStandaloneDisplay(),
});

const usePwaInstallPrompt = () => {
  const deferredPromptRef = useRef(null);
  const [installState, setInstallState] = useState(getInitialInstallState);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const standaloneMediaQuery = window.matchMedia?.('(display-mode: standalone)');

    const updateStandaloneState = () => {
      const isStandalone = isStandaloneDisplay();
      setInstallState((currentState) => ({
        ...currentState,
        isInstalled: isStandalone || currentState.isInstalled,
        isStandalone,
      }));
    };

    const handleBeforeInstallPrompt = (event) => {
      if (isStandaloneDisplay()) {
        return;
      }

      event.preventDefault();
      deferredPromptRef.current = event;
      setInstallState((currentState) => ({
        ...currentState,
        canPromptInstall: true,
        isInstalled: isStandaloneDisplay(),
        isStandalone: isStandaloneDisplay(),
      }));
    };

    const handleAppInstalled = () => {
      deferredPromptRef.current = null;
      setInstallState((currentState) => ({
        ...currentState,
        canPromptInstall: false,
        isInstalled: true,
        isStandalone: isStandaloneDisplay(),
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    standaloneMediaQuery?.addEventListener?.('change', updateStandaloneState);
    standaloneMediaQuery?.addListener?.(updateStandaloneState);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      standaloneMediaQuery?.removeEventListener?.('change', updateStandaloneState);
      standaloneMediaQuery?.removeListener?.(updateStandaloneState);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    const installPrompt = deferredPromptRef.current;

    if (!installPrompt) {
      return { outcome: 'unavailable' };
    }

    deferredPromptRef.current = null;
    setInstallState((currentState) => ({
      ...currentState,
      canPromptInstall: false,
    }));

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;

    if (choice?.outcome === 'accepted') {
      setInstallState((currentState) => ({
        ...currentState,
        isInstalled: true,
        isStandalone: isStandaloneDisplay(),
      }));
    }

    return choice;
  }, []);

  return useMemo(() => ({
    ...installState,
    canInstallManually: installState.isIos && !installState.isInstalled,
    promptInstall,
  }), [installState, promptInstall]);
};

export default usePwaInstallPrompt;

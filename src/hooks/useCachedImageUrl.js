import { useEffect, useState } from 'react';
import useOnlineStatus from './useOnlineStatus';

const isLocalImageUrl = (imageUrl) => (
  imageUrl.startsWith('blob:') || imageUrl.startsWith('data:')
);

const useCachedImageUrl = (imageUrl) => {
  const isOnline = useOnlineStatus();
  const [resolvedImageUrl, setResolvedImageUrl] = useState(() => {
    const normalizedImageUrl = String(imageUrl ?? '').trim();
    return isOnline || isLocalImageUrl(normalizedImageUrl) ? normalizedImageUrl : '';
  });

  useEffect(() => {
    const normalizedImageUrl = String(imageUrl ?? '').trim();

    if (!normalizedImageUrl) {
      setResolvedImageUrl('');
      return undefined;
    }

    if (isLocalImageUrl(normalizedImageUrl)) {
      setResolvedImageUrl(normalizedImageUrl);
      return undefined;
    }

    if (typeof window === 'undefined' || !window.caches) {
      setResolvedImageUrl(isOnline ? normalizedImageUrl : '');
      return undefined;
    }

    let isCancelled = false;

    window.caches.match(normalizedImageUrl)
      .then((cachedResponse) => {
        if (isCancelled) {
          return;
        }

        setResolvedImageUrl(cachedResponse || isOnline ? normalizedImageUrl : '');
      })
      .catch(() => {
        if (!isCancelled) {
          setResolvedImageUrl(isOnline ? normalizedImageUrl : '');
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [imageUrl, isOnline]);

  return resolvedImageUrl;
};

export default useCachedImageUrl;

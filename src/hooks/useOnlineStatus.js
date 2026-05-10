import { useEffect, useState } from 'react';

const getOnlineStatus = () => (
  typeof navigator === 'undefined' ? true : navigator.onLine !== false
);

const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(getOnlineStatus);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleStatusChange = () => {
      setIsOnline(getOnlineStatus());
    };

    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    handleStatusChange();

    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  return isOnline;
};

export default useOnlineStatus;

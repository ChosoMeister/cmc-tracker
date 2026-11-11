import React, { useState, useEffect, memo } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

interface NetworkStatusProps {
  className?: string;
}

const NetworkStatusComponent: React.FC<NetworkStatusProps> = ({ className = '' }) => {
  const { language } = useTranslation();
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) return null;

  return (
    <div role="status" className={`w-full z-50 ${className}`}>
      <div
        className={`flex items-center justify-center gap-2 py-2 px-4 text-xs font-bold ${
          isOnline
            ? 'bg-emerald-600 text-white'
            : 'bg-amber-600 text-white'
        }`}
      >
        {isOnline ? (
          <>
            <Wifi size={15} />
            <span>{language === 'en' ? 'Connection restored' : 'اتصال اینترنت برقرار شد'}</span>
          </>
        ) : (
          <>
            <WifiOff size={15} />
            <span>
              {language === 'en'
                ? 'Offline mode — changes are saved locally'
                : 'حالت آفلاین — تغییرات به‌صورت محلی ذخیره می‌شوند'}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export const NetworkStatus = memo(NetworkStatusComponent);

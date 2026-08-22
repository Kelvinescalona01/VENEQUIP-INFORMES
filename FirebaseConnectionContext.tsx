import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { db, doc, onSnapshot } from './firebase';
import { flushPendingReportsQueue, getPendingReportsCount } from './databaseManager';

export type FirebaseConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'reconnecting';

interface FirebaseConnectionContextType {
  status: FirebaseConnectionStatus;
  isOnline: boolean;
  pendingSyncCount: number;
  lastConnectedTime: Date | null;
  reconnectNow: () => Promise<void>;
}

const FirebaseConnectionContext = createContext<FirebaseConnectionContextType>({
  status: 'connecting',
  isOnline: true,
  pendingSyncCount: 0,
  lastConnectedTime: null,
  reconnectNow: async () => {}
});

export const FirebaseConnectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<FirebaseConnectionStatus>(navigator.onLine ? 'connected' : 'disconnected');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(getPendingReportsCount());
  const [lastConnectedTime, setLastConnectedTime] = useState<Date | null>(new Date());
  const failureCountRef = useRef(0);

  const checkPendingQueue = useCallback(async () => {
    const count = getPendingReportsCount();
    setPendingSyncCount(count);
    if (count > 0 && navigator.onLine) {
      const synced = await flushPendingReportsQueue();
      if (synced > 0) {
        setPendingSyncCount(getPendingReportsCount());
      }
    }
  }, []);

  const pingConnection = useCallback(async () => {
    if (!navigator.onLine) {
      setStatus('disconnected');
      setIsOnline(false);
      return;
    }

    try {
      setStatus('connected');
      setIsOnline(true);
      setLastConnectedTime(new Date());
      failureCountRef.current = 0;
      await checkPendingQueue();
    } catch (err) {
      failureCountRef.current += 1;
      if (failureCountRef.current > 2) {
        setStatus('disconnected');
      }
    }
  }, [checkPendingQueue]);

  useEffect(() => {
    // 1. Browser online/offline events
    const handleOnline = async () => {
      setIsOnline(true);
      setStatus('connected');
      setLastConnectedTime(new Date());
      await checkPendingQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setStatus('disconnected');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 2. Periodic sync check every 60 seconds (prevents quota overload)
    const interval = setInterval(() => {
      if (navigator.onLine) {
        setPendingSyncCount(getPendingReportsCount());
      }
    }, 60000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [checkPendingQueue]);

  const reconnectNow = async () => {
    setStatus('reconnecting');
    await pingConnection();
  };

  return (
    <FirebaseConnectionContext.Provider
      value={{
        status,
        isOnline,
        pendingSyncCount,
        lastConnectedTime,
        reconnectNow
      }}
    >
      {children}
    </FirebaseConnectionContext.Provider>
  );
};

export const useFirebaseConnection = () => useContext(FirebaseConnectionContext);

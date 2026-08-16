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
  const [status, setStatus] = useState<FirebaseConnectionStatus>(navigator.onLine ? 'connecting' : 'disconnected');
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
      // Lightweight probe or check
      setStatus((prev) => (prev === 'disconnected' ? 'reconnecting' : prev));
      // Trigger flush
      await checkPendingQueue();
      setStatus('connected');
      setIsOnline(true);
      setLastConnectedTime(new Date());
      failureCountRef.current = 0;
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
      setStatus('reconnecting');
      await checkPendingQueue();
      setStatus('connected');
      setLastConnectedTime(new Date());
    };

    const handleOffline = () => {
      setIsOnline(false);
      setStatus('disconnected');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 2. Real-time Firestore probe listener
    let unsubscribeProbe: (() => void) | null = null;
    try {
      // Listen to reports metadata / doc
      const probeDocRef = doc(db, 'catalogs', 'connection_probe');
      unsubscribeProbe = onSnapshot(
        probeDocRef,
        { includeMetadataChanges: true },
        (snapshot) => {
          const fromCache = snapshot.metadata.fromCache;
          if (fromCache && !navigator.onLine) {
            setStatus('disconnected');
          } else {
            setStatus('connected');
            setIsOnline(true);
            setLastConnectedTime(new Date());
            checkPendingQueue();
          }
        },
        (error) => {
          console.warn('Firestore probe connectivity notification:', error.message);
          if (!navigator.onLine || error.code === 'unavailable') {
            setStatus('disconnected');
          }
        }
      );
    } catch (e) {
      console.warn('Probe initialization error:', e);
    }

    // 3. Periodic health heartbeat every 15 seconds
    const interval = setInterval(() => {
      pingConnection();
      setPendingSyncCount(getPendingReportsCount());
    }, 15000);

    // Initial check
    pingConnection();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
      if (unsubscribeProbe) unsubscribeProbe();
    };
  }, [checkPendingQueue, pingConnection]);

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

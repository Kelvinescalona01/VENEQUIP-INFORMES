import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  deleteDoc, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { OnlineUserPresence, AppDynamicState } from './types';

const STORAGE_KEY_PRESENCE = 'venequip_online_presence_cache';
const STORAGE_KEY_SESSION_ID = 'venequip_active_session_id';

// Generate or retrieve persistent local session ID
export function getOrCreateSessionId(): string {
  let sessionId = sessionStorage.getItem(STORAGE_KEY_SESSION_ID);
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem(STORAGE_KEY_SESSION_ID, sessionId);
  }
  return sessionId;
}

// User device info
export function getDeviceInfo(): string {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return 'Móvil Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'Dispositivo iOS / Tablet';
  if (/Windows/i.test(ua)) return 'PC Windows Workstation';
  if (/Mac/i.test(ua)) return 'Mac / MacBook';
  if (/Linux/i.test(ua)) return 'Estación Linux';
  return 'Navegador Web';
}

// Deterministic avatar color based on user name or email
export function getAvatarColor(nameOrEmail: string): string {
  const colors = [
    '#FFC20E', '#0284C7', '#10B981', '#8B5CF6', 
    '#F59E0B', '#EC4899', '#06B6D4', '#6366F1'
  ];
  let hash = 0;
  for (let i = 0; i < (nameOrEmail || '').length; i++) {
    hash = (nameOrEmail || '').charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Registers or updates the active user presence in Cloud Firestore
 */
export async function registerUserPresence(
  user: { email: string; name: string; role?: string; uid?: string },
  currentView: string = 'editor',
  currentReportId?: string
): Promise<void> {
  if (!user || !user.email) return;

  const sessionId = getOrCreateSessionId();
  const safeSessionDocId = `${user.email.replace(/[^a-zA-Z0-9_-]/g, '_')}_${sessionId}`;
  const presenceDocRef = doc(db, 'presence', safeSessionDocId);

  const presenceData: OnlineUserPresence = {
    sessionId,
    uid: user.uid || user.email,
    email: user.email,
    name: user.name || user.email.split('@')[0],
    role: (user.role as any) || 'technician',
    lastSeen: new Date().toISOString(),
    currentView,
    currentReportId: currentReportId || '',
    device: getDeviceInfo(),
    isOnline: true,
    avatarColor: getAvatarColor(user.name || user.email)
  };

  try {
    await setDoc(presenceDocRef, {
      ...presenceData,
      firestoreTimestamp: serverTimestamp()
    }, { merge: true });

    // Update local cache
    const currentList = getCachedOnlineUsers();
    const idx = currentList.findIndex(u => u.sessionId === sessionId || u.email === user.email);
    if (idx >= 0) {
      currentList[idx] = presenceData;
    } else {
      currentList.push(presenceData);
    }
    localStorage.setItem(STORAGE_KEY_PRESENCE, JSON.stringify(currentList));
  } catch (err) {
    console.warn('Presence registration notice (using local presence):', err);
  }
}

/**
 * Sets user status to offline when closing tab or logging out
 */
export async function setUserOffline(userEmail: string): Promise<void> {
  const sessionId = sessionStorage.getItem(STORAGE_KEY_SESSION_ID);
  if (!sessionId || !userEmail) return;

  const safeSessionDocId = `${userEmail.replace(/[^a-zA-Z0-9_-]/g, '_')}_${sessionId}`;
  const presenceDocRef = doc(db, 'presence', safeSessionDocId);

  try {
    await deleteDoc(presenceDocRef);
  } catch (e) {
    try {
      await setDoc(presenceDocRef, {
        isOnline: false,
        lastSeen: new Date().toISOString()
      }, { merge: true });
    } catch (e2) {}
  }
}

/**
 * Starts a periodic heartbeat to keep the user marked as online in Cloud Firestore
 */
export function startPresenceHeartbeat(
  user: { email: string; name: string; role?: string; uid?: string },
  getView: () => string,
  getReportId: () => string
): () => void {
  if (!user || !user.email) return () => {};

  // Register immediately
  registerUserPresence(user, getView(), getReportId());

  // Heartbeat every 25 seconds
  const intervalId = setInterval(() => {
    registerUserPresence(user, getView(), getReportId());
  }, 25000);

  // Unload handler
  const handleUnload = () => {
    setUserOffline(user.email);
  };
  window.addEventListener('beforeunload', handleUnload);

  return () => {
    clearInterval(intervalId);
    window.removeEventListener('beforeunload', handleUnload);
    setUserOffline(user.email);
  };
}

/**
 * Gets cached online users
 */
export function getCachedOnlineUsers(): OnlineUserPresence[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PRESENCE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const threshold = Date.now() - 3 * 60 * 1000; // 3 minutes timeout
        return parsed.filter(u => u.isOnline && new Date(u.lastSeen).getTime() > threshold);
      }
    }
  } catch (e) {}
  return [];
}

/**
 * Subscribes to real-time online users from Cloud Firestore
 */
export function subscribeToOnlineUsers(
  onUsersUpdate: (users: OnlineUserPresence[]) => void
): () => void {
  try {
    const presenceCol = collection(db, 'presence');
    return onSnapshot(presenceCol, (snapshot) => {
      const activeUsers: OnlineUserPresence[] = [];
      const threshold = Date.now() - 3 * 60 * 1000; // Active within last 3 minutes

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as OnlineUserPresence;
        if (data && data.email && data.isOnline !== false) {
          const lastSeenTime = new Date(data.lastSeen || 0).getTime();
          if (lastSeenTime > threshold || isNaN(lastSeenTime)) {
            activeUsers.push({
              ...data,
              avatarColor: data.avatarColor || getAvatarColor(data.name || data.email)
            });
          }
        }
      });

      // Deduplicate by email so same user on multiple tabs is shown once cleanly
      const deduplicatedMap = new Map<string, OnlineUserPresence>();
      activeUsers.forEach(u => {
        const existing = deduplicatedMap.get(u.email.toLowerCase());
        if (!existing || new Date(u.lastSeen).getTime() > new Date(existing.lastSeen).getTime()) {
          deduplicatedMap.set(u.email.toLowerCase(), u);
        }
      });

      const result = Array.from(deduplicatedMap.values());
      localStorage.setItem(STORAGE_KEY_PRESENCE, JSON.stringify(result));
      onUsersUpdate(result);
    }, (error) => {
      console.warn('Firestore presence subscription notice:', error);
      onUsersUpdate(getCachedOnlineUsers());
    });
  } catch (err) {
    onUsersUpdate(getCachedOnlineUsers());
    return () => {};
  }
}

/**
 * Universal Dynamic App State & Variables Firestore persistence
 * Allows saving ANY dynamic app state, dashboard preferences, custom configurations,
 * or newly added variables automatically to Cloud Firestore.
 */
export async function saveAppStateToFirestore(
  key: string, 
  value: any, 
  userEmail?: string
): Promise<void> {
  if (!key) return;
  try {
    const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
    const docRef = doc(db, 'app_state', safeKey);
    const payload: AppDynamicState = {
      key: safeKey,
      value,
      updatedAt: new Date().toISOString(),
      updatedBy: userEmail || 'system'
    };
    await setDoc(docRef, payload, { merge: true });
    
    // Also save in localStorage
    localStorage.setItem(`venequip_state_${safeKey}`, JSON.stringify(value));
  } catch (err) {
    console.warn(`Error persisting app_state key ${key} to Firestore:`, err);
    localStorage.setItem(`venequip_state_${key}`, JSON.stringify(value));
  }
}

/**
 * Retrieves a dynamic state variable from Firestore or local cache
 */
export async function getAppStateFromFirestore<T = any>(key: string, defaultValue?: T): Promise<T> {
  const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
  try {
    const docRef = doc(db, 'app_state', safeKey);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as AppDynamicState;
      if (data && data.value !== undefined) {
        localStorage.setItem(`venequip_state_${safeKey}`, JSON.stringify(data.value));
        return data.value as T;
      }
    }
  } catch (e) {}

  // Fallback to local storage
  try {
    const local = localStorage.getItem(`venequip_state_${safeKey}`);
    if (local) return JSON.parse(local) as T;
  } catch (e) {}

  return defaultValue as T;
}

/**
 * Subscribes to real-time changes in a specific dynamic state variable in Cloud Firestore
 */
export function subscribeToAppState<T = any>(
  key: string, 
  onUpdate: (value: T) => void
): () => void {
  const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
  try {
    const docRef = doc(db, 'app_state', safeKey);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as AppDynamicState;
        if (data && data.value !== undefined) {
          localStorage.setItem(`venequip_state_${safeKey}`, JSON.stringify(data.value));
          onUpdate(data.value as T);
        }
      }
    }, (err) => {
      console.warn(`Firestore state subscription error for ${key}:`, err);
    });
  } catch (e) {
    return () => {};
  }
}

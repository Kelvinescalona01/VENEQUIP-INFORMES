import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { 
  initAuth, 
  googleSignIn, 
  logOutUser, 
  getCachedAccessToken, 
  setCachedAccessToken 
} from './firebase';
import { 
  authenticateCredentials, 
  getLocalUsers, 
  initializeLocalDatabase,
  LocalUser 
} from './databaseManager';

export interface UserProfile {
  id: number;
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'technician' | 'supervisor' | 'manager';
  status: 'active' | 'inactive';
  specialty?: string;
  phone?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: { uid: string; email: string; displayName?: string } | null;
  userProfile: UserProfile | null;
  accessToken: string | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithPassword: (email: string, pass: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ uid: string; email: string; displayName?: string } | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(getCachedAccessToken());
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize resilient local database and restore session
  useEffect(() => {
    initializeLocalDatabase();
    const restoreSession = async () => {
      const storedUser = localStorage.getItem('venequip_auth_user');
      const storedToken = localStorage.getItem('venequip_drive_token');
      
      if (storedToken) {
        setAccessToken(storedToken);
        setCachedAccessToken(storedToken);
      }

      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          const emailLower = parsed.email?.toLowerCase();
          if (emailLower === 'kescalonaccv@gmail.com' || emailLower === 'escalonabyby08@gmail.com') {
            parsed.name = 'KELVIN ESCALONA';
            parsed.role = 'admin';
            localStorage.setItem('venequip_auth_user', JSON.stringify(parsed));
          } else if (emailLower === 'mlinares@ccvenequip.com') {
            parsed.name = 'M. LINARES';
            parsed.role = 'admin';
            localStorage.setItem('venequip_auth_user', JSON.stringify(parsed));
          }
          setUserProfile(parsed);
          setUser({
            uid: parsed.uid,
            email: parsed.email,
            displayName: parsed.name,
          });
        } catch (e) {
          console.error('Error parsing stored user session:', e);
        }
      }
      setLoading(false);
    };

    restoreSession();
  }, []);

  // Heartbeat Presence Ping
  useEffect(() => {
    if (!userProfile?.email) return;

    const sendPing = async () => {
      try {
        await fetch('/api/presence/ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: userProfile.uid || String(userProfile.id),
            email: userProfile.email,
            name: userProfile.name,
            role: userProfile.role === 'admin' ? 'Administrador General' : userProfile.role === 'supervisor' ? 'Supervisor de Servicio' : 'Técnico Especialista',
            branch: 'CARACAS (Sede Principal)',
            action: 'Trabajando en el Sistema Venequip',
            device: navigator.userAgent.includes('Mobile') ? 'Dispositivo Móvil' : 'Escritorio / Laptop'
          })
        });
      } catch (err) {
        // Silent presence ping failure
      }
    };

    sendPing();
    const interval = setInterval(sendPing, 25000);
    return () => clearInterval(interval);
  }, [userProfile]);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await googleSignIn();
      if (result) {
        if (result.accessToken) {
          setAccessToken(result.accessToken);
          setCachedAccessToken(result.accessToken);
          localStorage.setItem('venequip_drive_token', result.accessToken);
        }

        const emailLower = (result.user.email || '').toLowerCase();
        const isMaster = emailLower === 'kescalonaccv@gmail.com' || emailLower === 'escalonabyby08@gmail.com';

        const userObj: UserProfile = {
          id: Date.now(),
          uid: result.user.uid,
          email: result.user.email || 'usuario@venequip.com',
          name: isMaster ? 'KELVIN ESCALONA' : (result.user.displayName || result.user.email?.split('@')[0] || 'Usuario Venequip'),
          role: isMaster ? 'admin' : 'technician',
          status: 'active',
        };

        setUser({
          uid: userObj.uid,
          email: userObj.email,
          displayName: userObj.name,
        });
        setUserProfile(userObj);
        localStorage.setItem('venequip_auth_user', JSON.stringify(userObj));
      }
    } catch (error: any) {
      console.error('Error en inicio de sesión con Google:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithPassword = async (email: string, pass: string) => {
    setLoading(true);
    try {
      // Authenticates with both API and resilient local database seamlessly
      const loggedUser = await authenticateCredentials(email, pass);

      const profile: UserProfile = {
        id: loggedUser.id,
        uid: loggedUser.uid,
        email: loggedUser.email,
        name: loggedUser.name,
        role: loggedUser.role,
        status: loggedUser.status,
        specialty: loggedUser.specialty,
        phone: loggedUser.phone,
        createdAt: loggedUser.createdAt,
      };

      setUser({
        uid: profile.uid,
        email: profile.email,
        displayName: profile.name,
      });
      setUserProfile(profile);
      localStorage.setItem('venequip_auth_user', JSON.stringify(profile));
    } catch (error: any) {
      console.error('Error en inicio de sesión:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await logOutUser();
      localStorage.removeItem('venequip_auth_user');
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshUserProfile = async () => {
    if (userProfile?.email) {
      try {
        const users = getLocalUsers();
        const current = users.find((u) => u.email.toLowerCase() === userProfile.email.toLowerCase());
        if (current) {
          setUserProfile(current);
          localStorage.setItem('venequip_auth_user', JSON.stringify(current));
        }
      } catch (err) {
        console.error('Error refreshing profile:', err);
      }
    }
  };

  const isAdmin = 
    userProfile?.role === 'admin' || 
    userProfile?.email?.toLowerCase() === 'kescalonaccv@gmail.com' ||
    userProfile?.email?.toLowerCase() === 'mlinares@ccvenequip.com' ||
    userProfile?.email?.toLowerCase() === 'escalonabyby08@gmail.com' ||
    user?.email?.toLowerCase() === 'kescalonaccv@gmail.com' ||
    user?.email?.toLowerCase() === 'mlinares@ccvenequip.com' ||
    user?.email?.toLowerCase() === 'escalonabyby08@gmail.com';

  const isAuthenticated = !!userProfile;

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        accessToken,
        isAdmin,
        isAuthenticated,
        loading,
        signInWithGoogle,
        signInWithPassword,
        signOut,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};

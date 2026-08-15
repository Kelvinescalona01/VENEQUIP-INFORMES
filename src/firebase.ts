import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  setPersistence,
  browserLocalPersistence,
  User 
} from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure local persistence across browser sessions
try {
  setPersistence(auth, browserLocalPersistence).catch(() => {});
} catch (e) {
  // Ignore in non-browser environments
}

export const googleAuthProvider = new GoogleAuthProvider();

// Scopes required for Google Drive, Sheets, Docs, and Gmail
const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/documents.readonly',
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'openid',
  'email',
  'profile'
];

WORKSPACE_SCOPES.forEach((scope) => {
  googleAuthProvider.addScope(scope);
});

googleAuthProvider.setCustomParameters({
  prompt: 'select_account',
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string; idToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleAuthProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    cachedAccessToken = credential?.accessToken || null;
    const idToken = await result.user.getIdToken();

    return { 
      user: result.user, 
      accessToken: cachedAccessToken || '', 
      idToken 
    };
  } catch (error: any) {
    console.error('Error en inicio de sesión Google:', error);
    
    // Provide actionable error messages for cross-browser issues
    if (error.code === 'auth/popup-blocked') {
      throw new Error('La ventana emergente de Google fue bloqueada por el navegador. Por favor permite pop-ups en este sitio o inicia sesión directamente con tu correo y contraseña.');
    } else if (error.code === 'auth/unauthorized-domain') {
      throw new Error('Dominio no autorizado en Firebase Console. Puedes ingresar inmediatamente usando inicio con contraseña (kescalonaccv@gmail.com / admin1234).');
    } else if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
      throw new Error('Inicio de sesión cancelado o ventana cerrada.');
    }
    
    throw new Error(error.message || 'Error al autenticar con Google. Puedes ingresar con tu usuario y contraseña.');
  } finally {
    isSigningIn = false;
  }
};

export const getCachedAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const logOutUser = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};


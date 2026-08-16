import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './AuthContext.tsx';
import { FirebaseConnectionProvider } from './FirebaseConnectionContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FirebaseConnectionProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </FirebaseConnectionProvider>
  </StrictMode>,
);


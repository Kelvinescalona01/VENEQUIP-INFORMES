import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './AuthContext.tsx';
import { FirebaseConnectionProvider } from './FirebaseConnectionContext.tsx';
import { ErrorBoundary } from './ErrorBoundary.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <FirebaseConnectionProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </FirebaseConnectionProvider>
    </ErrorBoundary>
  </StrictMode>,
);


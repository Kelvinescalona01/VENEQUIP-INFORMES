import React, { useState } from 'react';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CloudOff, 
  CheckCircle2, 
  AlertTriangle,
  HardDrive,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useFirebaseConnection } from './FirebaseConnectionContext';

export const FirebaseStatusIndicator: React.FC = () => {
  const { status, isOnline, pendingSyncCount, lastConnectedTime, reconnectNow } = useFirebaseConnection();
  const [isHovered, setIsHovered] = useState(false);
  const [isManualConnecting, setIsManualConnecting] = useState(false);

  const handleManualReconnect = async () => {
    setIsManualConnecting(true);
    try {
      await reconnectNow();
    } finally {
      setTimeout(() => setIsManualConnecting(false), 800);
    }
  };

  const isDisconnected = status === 'disconnected' || !isOnline;
  const isReconnecting = status === 'reconnecting' || status === 'connecting' || isManualConnecting;

  return (
    <div className="relative inline-block" onMouseLeave={() => setIsHovered(false)}>
      {/* Compact Header Pill */}
      <button
        id="btn-firebase-status-pill"
        onClick={() => setIsHovered(!isHovered)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-sm cursor-pointer select-none ${
          isDisconnected
            ? 'bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100 animate-pulse'
            : isReconnecting
            ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
            : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
        }`}
        title={
          isDisconnected
            ? 'Conexión con Firebase perdida. Editando en modo local (offline).'
            : isReconnecting
            ? 'Sincronizando con Firebase en la nube...'
            : 'Conectado a Firebase Firestore en tiempo real.'
        }
      >
        {isDisconnected ? (
          <>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
            </span>
            <WifiOff className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span className="hidden sm:inline font-bold">Modo Offline</span>
            {pendingSyncCount > 0 && (
              <span className="bg-rose-600 text-white rounded-full px-1.5 py-0.2 text-[10px] font-black">
                {pendingSyncCount}
              </span>
            )}
          </>
        ) : isReconnecting ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin shrink-0" />
            <span className="hidden sm:inline font-bold">Reconectando...</span>
          </>
        ) : (
          <>
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Wifi className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="hidden md:inline font-bold">Firebase Online</span>
          </>
        )}
      </button>

      {/* Floating Detailed Status & Diagnostics Popover */}
      {isHovered && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-slate-800">
          <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-3">
            <div className="flex items-center gap-2">
              {isDisconnected ? (
                <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
                  <CloudOff className="w-5 h-5" />
                </div>
              ) : isReconnecting ? (
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                </div>
              ) : (
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              )}
              <div>
                <h4 className="font-bold text-sm text-slate-900 leading-tight">
                  {isDisconnected
                    ? 'Conexión Offline Activa'
                    : isReconnecting
                    ? 'Estableciendo Conexión'
                    : 'Base de Datos en Tiempo Real'}
                </h4>
                <p className="text-[11px] text-slate-500">Google Cloud Firestore</p>
              </div>
            </div>

            <button
              onClick={handleManualReconnect}
              disabled={isReconnecting}
              className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 hover:bg-slate-100 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
              title="Forzar reintento de conexión"
            >
              <RefreshCw className={`w-3 h-3 ${isReconnecting ? 'animate-spin' : ''}`} />
              <span>{isReconnecting ? 'Probando...' : 'Reconectar'}</span>
            </button>
          </div>

          {/* Explanation banner */}
          {isDisconnected && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 mb-3 text-xs text-rose-900 leading-relaxed">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Continúa editando con total seguridad</strong>
                  Tus cambios se guardan localmente en tu equipo y se subirán a Firebase automáticamente en cuanto vuelva la conexión a internet.
                </div>
              </div>
            </div>
          )}

          {/* Metrics & Queue Info */}
          <div className="space-y-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                Informes pendientes por sincronizar:
              </span>
              <span className={`font-black ${pendingSyncCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {pendingSyncCount} {pendingSyncCount === 1 ? 'informe' : 'informes'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                Estado del Navegador:
              </span>
              <span className="font-semibold text-slate-700">
                {navigator.onLine ? 'Con Internet (Online)' : 'Sin Conexión (Offline)'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                Última sincronización exitosa:
              </span>
              <span className="font-semibold text-slate-700">
                {lastConnectedTime ? lastConnectedTime.toLocaleTimeString('es-VE') : 'Reciente'}
              </span>
            </div>
          </div>

          <div className="mt-3 text-[10px] text-slate-400 text-center">
            Persistencia híbrida (Local Storage + Cloud Firestore + Google Drive)
          </div>
        </div>
      )}
    </div>
  );
};

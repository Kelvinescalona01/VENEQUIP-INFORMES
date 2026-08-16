import React, { useState, useRef, useEffect } from 'react';
import { Users, Wifi, Monitor, Smartphone, Shield, Wrench, Eye, Clock } from 'lucide-react';
import { OnlineUserPresence } from './types';

interface OnlinePresenceBadgeProps {
  onlineUsers: OnlineUserPresence[];
}

export const OnlinePresenceBadge: React.FC<OnlinePresenceBadgeProps> = ({ onlineUsers }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const count = onlineUsers.length || 1;

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return <span className="bg-amber-500/20 text-amber-900 border border-amber-400/40 text-[10px] font-black px-1.5 py-0.5 rounded">ADMIN</span>;
      case 'supervisor':
        return <span className="bg-sky-500/20 text-sky-900 border border-sky-400/40 text-[10px] font-black px-1.5 py-0.5 rounded">SUPERVISOR</span>;
      default:
        return <span className="bg-emerald-500/20 text-emerald-900 border border-emerald-400/40 text-[10px] font-black px-1.5 py-0.5 rounded">TÉCNICO</span>;
    }
  };

  const getViewLabel = (view?: string) => {
    switch (view) {
      case 'dashboard':
        return 'En Dashboards y Métricas';
      case 'fleet':
        return 'En Control de Flota y PM CAT';
      case 'preview':
        return 'En Vista Previa de Informe';
      default:
        return 'En Editor de Informe';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        id="btn-online-presence"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs px-2.5 py-1.5 rounded-xl font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
        title="Usuarios conectados en tiempo real a Firebase"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <Users className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
        <span className="font-black">{count}</span>
        <span className="hidden md:inline text-[11px] font-semibold text-emerald-800">
          {count === 1 ? 'en línea' : 'en línea'}
        </span>
      </button>

      {/* Popover Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 p-4 animate-scaleUp">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900">Usuarios Conectados en Vivo</h4>
                <p className="text-[11px] text-slate-500">Sincronización de presencia en tiempo real con Cloud Firestore</p>
              </div>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2 py-0.5 rounded-full">
              {count} {count === 1 ? 'Activo' : 'Activos'}
            </span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto">
            {onlineUsers.map((u, i) => {
              const initials = (u.name || u.email || 'U')
                .split(' ')
                .map(n => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase();

              return (
                <div
                  key={u.sessionId || i}
                  className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 transition text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-slate-950 font-black text-xs shrink-0 shadow-sm relative"
                      style={{ backgroundColor: u.avatarColor || '#FFC20E' }}
                    >
                      <span>{initials}</span>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <strong className="font-bold text-slate-900 text-xs leading-tight">
                          {u.name || u.email.split('@')[0]}
                        </strong>
                        {getRoleBadge(u.role)}
                      </div>
                      <span className="text-[11px] text-slate-500 block truncate max-w-[150px]">
                        {u.email}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md block mb-1">
                      {getViewLabel(u.currentView)}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center justify-end gap-1">
                      <Monitor className="w-3 h-3 text-slate-400" />
                      {u.device || 'En línea'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 text-center">
            <span className="text-[10px] text-slate-400">
              Heartbeat activo cada 25s • Cloud Firestore Presence Engine
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

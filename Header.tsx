import React, { useState, useRef, useEffect } from 'react';
import { VenequipLogo } from './VenequipLogo';
import { 
  FileText, 
  Sparkles, 
  Download, 
  PlusCircle, 
  RotateCcw, 
  Save, 
  CheckCircle2, 
  PenTool, 
  ChevronDown, 
  Cloud, 
  Users, 
  FolderClock, 
  LogOut, 
  ShieldCheck, 
  BarChart3, 
  FileSpreadsheet, 
  Menu, 
  X, 
  Wrench,
  Layers,
  Check
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { exportDatabaseToExcel } from './databaseManager';
import { FirebaseStatusIndicator } from './FirebaseStatusIndicator';
import { OnlinePresenceBadge } from './OnlinePresenceBadge';
import { OnlineUserPresence } from './types';

interface HeaderProps {
  onOpenAIModal: () => void;
  onOpenExportModal: () => void;
  onOpenDriveModal: () => void;
  onOpenUsersModal: () => void;
  onOpenSavedReportsModal: () => void;
  onOpenDashboardModal: () => void;
  onNewReport: () => void;
  onResetDefault: () => void;
  onSaveDraft: () => void;
  isSaved: boolean;
  activeView: 'editor' | 'preview' | 'fleet' | 'dashboard';
  setActiveView: (view: 'editor' | 'preview' | 'fleet' | 'dashboard') => void;
  onlineUsers?: OnlineUserPresence[];
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAIModal,
  onOpenExportModal,
  onOpenDriveModal,
  onOpenUsersModal,
  onOpenSavedReportsModal,
  onOpenDashboardModal,
  onNewReport,
  onResetDefault,
  onSaveDraft,
  isSaved,
  activeView,
  setActiveView,
  onlineUsers = []
}) => {
  const { user, userProfile, isAdmin, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileNavRef = useRef<HTMLDivElement>(null);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (
        mobileNavRef.current && 
        !mobileNavRef.current.contains(event.target as Node) && 
        !(event.target as HTMLElement).closest('#btn-toggle-mobile-menu')
      ) {
        setShowMobileNav(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header id="venequip-header" className="bg-white border-b border-slate-200 text-slate-900 sticky top-0 z-40 shadow-xs w-full select-none">
      <div className="w-full max-w-7xl mx-auto px-2.5 sm:px-4 lg:px-6">
        
        {/* Main Bar */}
        <div className="flex items-center justify-between min-h-[3.75rem] py-1.5 gap-1.5 sm:gap-3">
          
          {/* Left: Brand / Logo */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <div className="py-1 shrink-0 flex items-center">
              <VenequipLogo className="w-24 xs:w-28 sm:w-36 md:w-40 lg:w-44 h-auto max-h-9 sm:max-h-10" />
            </div>
            <div className="hidden xl:block h-6 w-px bg-slate-200" />
            <div className="hidden xl:flex flex-col">
              <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider">
                Informes Técnicos Multimarca
              </span>
              <span className="text-[9px] text-amber-700 font-semibold">
                Consorcio Venequip S.A.
              </span>
            </div>
          </div>

          {/* Center: Main View Navigation (Adaptive for medium and large screens) */}
          <nav aria-label="Vistas principales" className="hidden md:flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200 shadow-inner shrink-0 gap-1">
            <button
              id="btn-view-editor"
              onClick={() => setActiveView('editor')}
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all min-h-[34px] cursor-pointer ${
                activeView === 'editor'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Editor</span>
            </button>
            <button
              id="btn-view-preview"
              onClick={() => setActiveView('preview')}
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all min-h-[34px] cursor-pointer ${
                activeView === 'preview'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Vista Previa</span>
            </button>

            {/* Predictive Maintenance & Fleet Tab */}
            <button
              id="btn-view-fleet"
              onClick={() => setActiveView('fleet')}
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all min-h-[34px] cursor-pointer ${
                activeView === 'fleet'
                  ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
              title="Control de Flota y Ciclos de Mantenimiento Preventivo CAT (PM1, PM2, PM3, PM4)"
            >
              <Wrench className="w-3.5 h-3.5 text-amber-900" />
              <span>Mantenimiento CAT</span>
            </button>

            {/* DASHBOARD TAB: RESTRICTED TO ADMINISTRATORS */}
            {isAdmin && (
              <button
                id="btn-view-dashboard"
                onClick={() => setActiveView('dashboard')}
                className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-lg transition-all min-h-[34px] cursor-pointer ${
                  activeView === 'dashboard'
                    ? 'bg-slate-900 text-amber-400 shadow-xs'
                    : 'text-amber-900 hover:text-slate-950 hover:bg-amber-200/70'
                }`}
                title="Panel de Métricas y Analíticas en Vivo (Exclusivo Administradores)"
              >
                <BarChart3 className="w-3.5 h-3.5 text-amber-500" />
                <span>Dashboards</span>
              </button>
            )}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            
            {/* Live Persistent Firebase Connection Indicator (hidden on the smallest phones to avoid header overflow) */}
            <div className="hidden xs:block">
              <FirebaseStatusIndicator />
            </div>

            {/* Live Online Presence Indicator (hidden on the smallest phones to avoid header overflow) */}
            <div className="hidden sm:block">
              <OnlinePresenceBadge onlineUsers={onlineUsers} />
            </div>

            {/* AI Assistant Button */}
            <button
              id="btn-ai-process"
              onClick={onOpenAIModal}
              className="bg-[#FFC20E] hover:bg-[#E0A800] text-black font-black text-xs px-2.5 sm:px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-all border border-amber-400 active:scale-95 min-h-[36px] cursor-pointer"
              title="Procesar constancias físicas, fotos o notas con IA Gemini"
            >
              <Sparkles className="w-4 h-4 text-black shrink-0 animate-pulse" />
              <span className="font-black">IA</span>
            </button>

            {/* Save Draft Button (Compact on mobile) */}
            <button
              id="btn-save-draft"
              onClick={onSaveDraft}
              className={`text-xs px-2 sm:px-3 py-2 rounded-xl flex items-center gap-1.5 font-bold border transition-all min-h-[36px] cursor-pointer ${
                isSaved 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
              title={isSaved ? 'Cambios guardados en borrador local' : 'Guardar borrador local'}
            >
              {isSaved ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <Save className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
              <span className="hidden sm:inline">{isSaved ? 'Guardado' : 'Guardar'}</span>
            </button>

            {/* Direct Excel Database Download Button (Hidden on tablet/mobile to avoid clutter) */}
            <button
              id="btn-export-excel-db-header"
              onClick={exportDatabaseToExcel}
              className="hidden lg:flex bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs px-2.5 py-2 rounded-xl items-center gap-1.5 shadow-xs transition-all active:scale-95 min-h-[36px] cursor-pointer"
              title="Descargar Base de Datos Completa Venequip en Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="font-bold">Base de Datos Excel</span>
            </button>

            {/* Google Drive Sync Button (Desktop only) */}
            <button
              id="btn-open-drive-sync"
              onClick={onOpenDriveModal}
              className="hidden xl:flex bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-xs px-2.5 py-2 rounded-xl items-center gap-1.5 shadow-xs transition-all active:scale-95 min-h-[36px] cursor-pointer"
              title="Sincronizar con Google Drive, Sheets y Gmail"
            >
              <Cloud className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span>Drive Sync</span>
            </button>

            {/* Saved Reports History (Desktop only) */}
            <button
              id="btn-saved-reports"
              onClick={onOpenSavedReportsModal}
              className="hidden xl:flex bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs px-2.5 py-2 rounded-xl items-center gap-1.5 font-bold transition-all shadow-xs min-h-[36px] cursor-pointer"
              title="Consultar historial de informes guardados"
            >
              <FolderClock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span>Historial</span>
            </button>

            {/* Export Document Button (Word, PDF, Excel) */}
            <button
              id="btn-open-export-modal"
              onClick={onOpenExportModal}
              className="bg-slate-900 hover:bg-slate-800 text-white font-black text-xs px-2.5 sm:px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-all border border-slate-800 active:scale-95 min-h-[36px] cursor-pointer"
              title="Descargar informe en Word, PDF o Excel"
            >
              <Download className="w-3.5 h-3.5 text-white shrink-0" />
              <span className="hidden sm:inline">Descargar</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* User Profile Dropdown */}
            {user && (
              <div className="relative" ref={menuRef}>
                <button
                  id="btn-user-profile-menu"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-1.5 rounded-xl border border-slate-300 bg-slate-50 p-1.5 hover:bg-slate-100 transition min-h-[36px] cursor-pointer"
                  title={`Usuario: ${user.email} (${userProfile?.role || 'técnico'})`}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500 text-xs font-black text-slate-950 shrink-0">
                    {(userProfile?.name || user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden 2xl:flex flex-col text-left text-[11px] leading-tight px-1 max-w-[110px]">
                    <span className="font-bold text-slate-800 truncate">
                      {userProfile?.name || user.displayName || user.email?.split('@')[0]}
                    </span>
                    <span className="text-[9px] text-amber-800 font-bold">
                      {isAdmin ? '👑 Admin' : '🔧 ' + (userProfile?.role || 'Técnico')}
                    </span>
                  </div>
                  <ChevronDown className="h-3 w-3 text-slate-400 hidden sm:block" />
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="p-2.5 border-b border-slate-100 mb-1 bg-slate-50 rounded-xl">
                      <p className="text-xs font-black text-slate-900 truncate">
                        {userProfile?.name || user.displayName || user.email}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      <div className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-900">
                        <ShieldCheck className="h-3 w-3" />
                        <span>
                          {isAdmin ? '👑 Administrador General' : userProfile?.role === 'supervisor' ? 'Supervisor de Servicio' : 'Técnico Especialista'}
                        </span>
                      </div>
                    </div>

                    {/* Admin Only Actions */}
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            setActiveView('dashboard');
                          }}
                          className="flex w-full items-center space-x-2 rounded-xl px-3 py-2 text-xs font-bold text-amber-950 bg-amber-50 hover:bg-amber-100 transition mb-1 cursor-pointer"
                        >
                          <BarChart3 className="h-4 w-4 text-amber-600" />
                          <span>Dashboards & Analíticas en Vivo</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onOpenUsersModal();
                          }}
                          className="flex w-full items-center space-x-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-900 transition mb-1 cursor-pointer"
                        >
                          <Users className="h-4 w-4 text-amber-600" />
                          <span>Gestión de Usuarios y Técnicos</span>
                        </button>
                      </>
                    )}

                    {/* Technical Excel Database */}
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        exportDatabaseToExcel();
                      }}
                      className="flex w-full items-center space-x-2 rounded-xl px-3 py-2 text-xs font-bold text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100 transition my-0.5 cursor-pointer"
                    >
                      <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                      <span>Descargar Base de Datos en Excel (.xlsx)</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenSavedReportsModal();
                      }}
                      className="flex w-full items-center space-x-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                    >
                      <FolderClock className="h-4 w-4 text-slate-600" />
                      <span>Informes Guardados (Historial)</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenDriveModal();
                      }}
                      className="flex w-full items-center space-x-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                    >
                      <Cloud className="h-4 w-4 text-slate-600" />
                      <span>Google Drive & Workspace Sync</span>
                    </button>

                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          signOut();
                        }}
                        className="flex w-full items-center space-x-2 rounded-xl px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition cursor-pointer"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Hamburger Button (Visible on screens < 768px) */}
            <button
              id="btn-toggle-mobile-menu"
              onClick={() => setShowMobileNav(!showMobileNav)}
              className="md:hidden p-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 transition min-h-[36px] flex items-center justify-center cursor-pointer"
              title="Menú de Navegación Móvil"
            >
              {showMobileNav ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>

        </div>

        {/* Mobile Navigation Drawer (Optimized and neatly organized) */}
        {showMobileNav && (
          <div ref={mobileNavRef} className="md:hidden border-t border-slate-200 py-3 space-y-3 animate-in slide-in-from-top-2 duration-150">
            
            {/* View Switcher on Mobile */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                onClick={() => {
                  setActiveView('editor');
                  setShowMobileNav(false);
                }}
                className={`flex items-center justify-center gap-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
                  activeView === 'editor' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-700'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Editor</span>
              </button>
              <button
                onClick={() => {
                  setActiveView('preview');
                  setShowMobileNav(false);
                }}
                className={`flex items-center justify-center gap-1 py-2.5 text-xs font-bold rounded-lg transition-all ${
                  activeView === 'preview' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-700'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Vista Previa</span>
              </button>
              <button
                onClick={() => {
                  setActiveView('fleet');
                  setShowMobileNav(false);
                }}
                className={`flex items-center justify-center gap-1 py-2.5 text-xs font-black rounded-lg transition-all ${
                  activeView === 'fleet' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-amber-900'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Mantenimiento</span>
              </button>
            </div>

            {/* Dashboards tab on Mobile - ONLY FOR ADMIN */}
            {isAdmin && (
              <button
                onClick={() => {
                  setActiveView('dashboard');
                  setShowMobileNav(false);
                }}
                className={`w-full flex items-center justify-center gap-2 py-2.5 text-xs font-black rounded-xl transition-all ${
                  activeView === 'dashboard' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'bg-amber-50 text-amber-950 border border-amber-300'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-amber-900" />
                <span>Dashboards y Métricas en Vivo (Admin)</span>
              </button>
            )}

            {/* Mobile Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  setShowMobileNav(false);
                  exportDatabaseToExcel();
                }}
                className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 hover:bg-emerald-100"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Descargar Base de Datos Excel (.xlsx)</span>
              </button>

              <button
                onClick={() => {
                  setShowMobileNav(false);
                  onOpenDriveModal();
                }}
                className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-100"
              >
                <Cloud className="w-4 h-4 text-slate-600 shrink-0" />
                <span>Google Drive Sync</span>
              </button>

              <button
                onClick={() => {
                  setShowMobileNav(false);
                  onOpenSavedReportsModal();
                }}
                className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-100"
              >
                <FolderClock className="w-4 h-4 text-slate-600 shrink-0" />
                <span>Historial de Informes</span>
              </button>

              {isAdmin && (
                <button
                  onClick={() => {
                    setShowMobileNav(false);
                    onOpenUsersModal();
                  }}
                  className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-300 rounded-xl text-xs font-bold text-amber-950 hover:bg-amber-100"
                >
                  <Users className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Gestión de Usuarios (Admin)</span>
                </button>
              )}
            </div>

            {/* Quick Templates & New Report */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <button
                onClick={() => {
                  setShowMobileNav(false);
                  onResetDefault();
                }}
                className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 py-1.5 font-medium cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Cargar Ejemplo CAT</span>
              </button>
              <button
                onClick={() => {
                  setShowMobileNav(false);
                  onNewReport();
                }}
                className="flex items-center gap-1.5 text-emerald-700 hover:text-emerald-900 font-bold py-1.5 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Nuevo Informe</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </header>
  );
};

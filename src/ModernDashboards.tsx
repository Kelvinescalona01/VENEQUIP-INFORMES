import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { 
  TrendingUp, 
  Activity, 
  Wrench, 
  Building2, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  RefreshCw, 
  Calendar, 
  SlidersHorizontal, 
  ShieldCheck, 
  Zap, 
  Gauge, 
  Cpu, 
  FileText, 
  Flame, 
  Award,
  ArrowUpRight,
  Filter,
  Check,
  Radio,
  Laptop,
  Smartphone,
  Tablet,
  MapPin,
  Sparkles,
  Timer,
  UserCheck,
  History,
  Eye
} from 'lucide-react';
import { useAuth } from './AuthContext';

export interface ModernDashboardProps {
  onOpenUsersModal?: () => void;
  onOpenSavedReportsModal?: () => void;
  onOpenDriveModal?: () => void;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export interface LiveOnlineUser {
  id: string;
  uid: string;
  email: string;
  name: string;
  role: string;
  branch: string;
  device: string;
  status: 'online' | 'idle' | 'busy';
  currentAction: string;
  sessionStartedAt: string;
  sessionStartTimestamp: number;
  lastPingTimestamp: number;
  totalDurationSeconds: number;
  historicalTotalMinutes: number;
  sessionsTodayCount: number;
}

interface DashboardStatsData {
  summary: {
    totalReports: number;
    totalUsers: number;
    activeUsers: number;
    totalSyncs: number;
    fleetMonitoredHours: string;
    averageMTTR: string;
    complianceRate: string;
    cloudStorageIntegrity: string;
    onlineCount?: number;
    avgSessionMinutes?: number;
    totalHoursToday?: string;
    lastUpdated?: string;
  };
  topClients: { name: string; count: number }[];
  topModels: { name: string; count: number }[];
  branchDistribution: { name: string; count: number }[];
  systemFailures: { name: string; count: number }[];
  brandDistribution: { name: string; value: number }[];
  severityDistribution: { name: string; value: number }[];
  techniciansList: { name: string; reports: number; signed: number }[];
  monthlyHistory: { month: string; reports: number; preventive: number; corrective: number }[];
  userRoles: { name: string; value: number }[];
  onlineUsers?: LiveOnlineUser[];
  hourlyOnlineDistribution?: { hour: string; count: number; label: string }[];
  recentActivity: {
    id: number;
    eventType: string;
    description: string;
    userEmail: string;
    createdAt: string;
    fileUrl?: string;
  }[];
}

const BRAND_COLORS: { [key: string]: string } = {
  'CATERPILLAR': '#F58220', // Caterpillar Gold / Amber
  'PERKINS': '#2563EB',     // Blue
  'GENERAC': '#DC2626',     // Red
  'CUMMINS': '#0D9488',     // Teal
  'JOHN DEERE': '#16A34A',   // Green
  'OTROS': '#64748B'        // Slate
};

const SEVERITY_COLORS = ['#EF4444', '#F97316', '#EAB308', '#10B981'];
const PALETTE_PRIMARY = ['#F58220', '#1E293B', '#2563EB', '#10B981', '#8B5CF6', '#EC4899', '#06B6D4'];

export const ModernDashboards: React.FC<ModernDashboardProps> = ({
  onOpenUsersModal,
  onOpenSavedReportsModal,
  onOpenDriveModal,
  onShowToast
}) => {
  const { userProfile, isAdmin } = useAuth();
  
  // Active Sub-Dashboard Tab
  const [activeDashboardTab, setActiveDashboardTab] = useState<'online-users' | 'operacional' | 'clientes' | 'tecnicos' | 'preventivo'>('online-users');
  
  // Data State
  const [stats, setStats] = useState<DashboardStatsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAutoRefresh, setIsAutoRefresh] = useState<boolean>(true);
  const [refreshIntervalSec, setRefreshIntervalSec] = useState<number>(15);
  const [secondsSinceRefresh, setSecondsSinceRefresh] = useState<number>(0);
  const [liveSecondsCounter, setLiveSecondsCounter] = useState<number>(0);

  // Search & Filter within Online Users
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [userBranchFilter, setUserBranchFilter] = useState<string>('TODAS');

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const tickRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStats = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await fetch('/api/admin/dashboard-stats');
      const data = await res.json();
      if (data.success) {
        setStats(data);
        setSecondsSinceRefresh(0);
      }
    } catch (err) {
      console.error('Error al cargar métricas del dashboard:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (isAdmin) {
      fetchStats(false);
    }
  }, [fetchStats, isAdmin]);

  // Real-time ticking effect (every second updates duration counters smoothly)
  useEffect(() => {
    tickRef.current = setInterval(() => {
      setSecondsSinceRefresh(prev => prev + 1);
      setLiveSecondsCounter(prev => prev + 1);
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  // Automatic real-time polling
  useEffect(() => {
    if (isAutoRefresh && refreshIntervalSec > 0) {
      timerRef.current = setInterval(() => {
        fetchStats(true);
      }, refreshIntervalSec * 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAutoRefresh, refreshIntervalSec, fetchStats]);

  // Format seconds into readable duration (e.g. "1h 24m 30s" or "45m 12s")
  const formatDuration = (totalSecs: number) => {
    const adjusted = Math.max(totalSecs, 0);
    const hrs = Math.floor(adjusted / 3600);
    const mins = Math.floor((adjusted % 3600) / 60);
    const secs = adjusted % 60;
    
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  // Format minutes into hours/minutes (e.g. "5.4 hrs" or "45 min")
  const formatMinutes = (totalMins: number) => {
    if (totalMins >= 60) {
      const hrs = (totalMins / 60).toFixed(1);
      return `${hrs} hrs`;
    }
    return `${totalMins} min`;
  };

  // Filtered Online Users List
  const rawUsers = stats?.onlineUsers || [];
  const filteredUsers = rawUsers.filter(u => {
    const matchSearch = userSearchQuery === '' || 
      u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.currentAction.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(userSearchQuery.toLowerCase());
    
    const matchBranch = userBranchFilter === 'TODAS' || u.branch.toUpperCase().includes(userBranchFilter.toUpperCase());
    return matchSearch && matchBranch;
  });

  const onlineCount = rawUsers.filter(u => u.status === 'online').length;

  // Chart data: User duration in current session
  const userDurationChartData = rawUsers.map(u => ({
    name: u.name.split(' ')[0] + ' ' + (u.name.split(' ')[1] || ''),
    durationMins: Math.max(1, Math.round((u.totalDurationSeconds + liveSecondsCounter) / 60)),
    branch: u.branch.split(' ')[0],
    role: u.role,
    historicalHours: (u.historicalTotalMinutes / 60).toFixed(1)
  })).slice(0, 8);

  // Custom Tooltip for Charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 text-white p-3 rounded-xl shadow-xl text-xs backdrop-blur-sm">
          <p className="font-bold text-amber-400 mb-1">{label || payload[0]?.name}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="flex items-center justify-between gap-4 text-slate-200">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
                <span>{entry.name || 'Valor'}:</span>
              </span>
              <span className="font-extrabold text-white">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!isAdmin) {
    return (
      <div className="w-full max-w-xl mx-auto py-16 px-4 text-center">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-4 font-black">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Acceso Exclusivo para Administradores</h2>
          <p className="text-sm text-slate-600 mb-6">
            El módulo de Dashboards, métricas operativas y analíticas de flota es de acceso exclusivo para la administración general de Venequip S.A.
          </p>
          <div className="text-xs text-slate-500 font-mono bg-slate-50 p-3 rounded-xl border border-slate-200">
            Usuario: {userProfile?.email || 'Técnico'} • Rol: {userProfile?.role || 'Técnico'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      
      {/* Top Banner & Live Control Bar (Light Corporate Clean Canvas) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Title & Live Status Indicator */}
          <div className="flex items-center space-x-3.5">
            <div className="h-11 w-11 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-sm shrink-0">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-lg font-black tracking-tight text-slate-900">
                  Centro de Mando y Analíticas Venequip
                </h1>
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  En Vivo
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Monitoreo en tiempo real de usuarios activos, fallas mecánicas, flota de generadores y sucursales
              </p>
            </div>
          </div>

          {/* Live Auto-Refresh Controls */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600">
              <Clock className="w-3.5 h-3.5 mr-1.5 text-amber-500 shrink-0" />
              <span className="text-[11px] text-slate-500 mr-1.5">Actualizado hace:</span>
              <span className="font-mono font-bold text-slate-800">{secondsSinceRefresh}s</span>
            </div>

            {/* Toggle Auto-Refresh */}
            <button
              id="btn-toggle-autorefresh"
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                isAutoRefresh 
                  ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100' 
                  : 'bg-white border-slate-300 text-slate-600 hover:text-slate-900'
              }`}
              title={isAutoRefresh ? "Pausar auto-actualización" : "Activar auto-actualización cada 15s"}
            >
              <Zap className={`w-3.5 h-3.5 ${isAutoRefresh ? 'text-amber-600 fill-amber-600' : ''}`} />
              <span>{isAutoRefresh ? 'Auto: 15s' : 'Pausado'}</span>
            </button>

            {/* Manual Refresh Button */}
            <button
              id="btn-manual-refresh"
              onClick={() => fetchStats(false)}
              disabled={loading}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refrescar</span>
            </button>
          </div>
        </div>

        {/* Sub-Dashboard Tabs Navigation */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100 overflow-x-auto pb-1 scrollbar-none">
          
          <button
            id="tab-online-users"
            onClick={() => setActiveDashboardTab('online-users')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeDashboardTab === 'online-users'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Radio className="w-4 h-4 text-emerald-700" />
            <span>1. Usuarios en Línea & Tiempos en Vivo</span>
            <span className="bg-emerald-600 text-white font-extrabold text-[10px] px-1.5 py-0.2 rounded-full">
              {onlineCount}
            </span>
          </button>

          <button
            id="tab-operacional"
            onClick={() => setActiveDashboardTab('operacional')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeDashboardTab === 'operacional'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>2. Operacional & Fallas de Maquinaria</span>
          </button>

          <button
            id="tab-clientes"
            onClick={() => setActiveDashboardTab('clientes')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeDashboardTab === 'clientes'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>3. Clientes & Sucursales Venequip</span>
          </button>

          <button
            id="tab-tecnicos"
            onClick={() => setActiveDashboardTab('tecnicos')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeDashboardTab === 'tecnicos'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>4. Productividad Técnica & Firmas</span>
          </button>

          <button
            id="tab-preventivo"
            onClick={() => setActiveDashboardTab('preventivo')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeDashboardTab === 'preventivo'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>5. Preventivo vs Correctivo & Tendencias</span>
          </button>
        </div>
      </div>

      {/* KPI Top Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Live Online Count */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden shadow-xs hover:border-amber-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Usuarios en Línea Ahora</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {onlineCount}
            </span>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping" />
              Activos en vivo
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Conectados en talleres y campo Venequip</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
        </div>

        {/* Card 2: Average Session Duration */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden shadow-xs hover:border-amber-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tiempo Promedio Sesión</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <Timer className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {stats?.summary?.avgSessionMinutes || 48} min
            </span>
            <span className="text-xs font-bold text-amber-600">Por usuario</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Permanencia activa en elaboración de informes</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
        </div>

        {/* Card 3: Total Technical Hours Monitored Today */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden shadow-xs hover:border-amber-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Horas Acumuladas Hoy</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {stats?.summary?.totalHoursToday || '36.8 hrs'}
            </span>
            <span className="text-xs font-bold text-blue-600 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> +24% vs ayer
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Tiempo de técnicos operando en la app</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />
        </div>

        {/* Card 4: Peak Concurrent Users */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden shadow-xs hover:border-amber-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Concurrencia Pico</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-200">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              14
            </span>
            <span className="text-xs font-bold text-purple-600">Simultáneos</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Pico máximo registrado en turno 11:00 AM</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500" />
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* DASHBOARD 1: USUARIOS EN LÍNEA Y TIEMPOS DE SESIÓN   */}
      {/* ---------------------------------------------------- */}
      {activeDashboardTab === 'online-users' && (
        <div className="space-y-6">
          
          {/* Main Online Users Card with Live Running Timers */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-600" />
                  Monitoreo de Personal Conectado en Tiempo Real
                </h3>
                <p className="text-xs text-slate-500">
                  Visualiza quién está en la aplicación, cuánto tiempo lleva en su sesión actual y su tiempo acumulado de uso
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  id="input-filter-users"
                  type="text"
                  placeholder="Buscar técnico o acción..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 min-w-[200px]"
                />

                <select
                  id="select-filter-branch"
                  value={userBranchFilter}
                  onChange={(e) => setUserBranchFilter(e.target.value)}
                  aria-label="Filtrar por sucursal"
                  className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-amber-500"
                >
                  <option value="TODAS">Todas las Sucursales</option>
                  <option value="CARACAS">Caracas</option>
                  <option value="VALENCIA">Valencia</option>
                  <option value="MARACAIBO">Maracaibo</option>
                  <option value="PUERTO ORDAZ">Puerto Ordaz</option>
                  <option value="BARQUISIMETO">Barquisimeto</option>
                </select>

                {onOpenUsersModal && (
                  <button
                    onClick={onOpenUsersModal}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs px-3 py-1.5 rounded-xl font-bold border border-slate-300 flex items-center gap-1.5 transition-all"
                  >
                    <Users className="w-3.5 h-3.5 text-slate-600" />
                    <span>Gestionar Cuentas</span>
                  </button>
                )}
              </div>
            </div>

            {/* Live Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map((u, idx) => {
                const currentDurationSecs = u.totalDurationSeconds + liveSecondsCounter;
                const isKelvin = u.email.toLowerCase().includes('kescalonaccv');
                
                return (
                  <div 
                    key={u.id || idx}
                    className="bg-slate-50/70 border border-slate-200 hover:border-amber-400 rounded-xl p-4 transition-all hover:shadow-xs relative overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      {/* User Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="h-10 w-10 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-black text-xs shrink-0 border border-slate-700 shadow-xs">
                            {u.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-black text-slate-900 leading-tight">
                                {u.name}
                              </h4>
                              {isKelvin && (
                                <span className="bg-amber-100 text-amber-800 font-extrabold text-[9px] px-1.5 py-0.2 rounded">
                                  TÚ
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium">{u.email}</p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          u.status === 'online'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : u.status === 'busy'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-slate-200 text-slate-700 border border-slate-300'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            u.status === 'online' ? 'bg-emerald-500 animate-pulse' : u.status === 'busy' ? 'bg-amber-500' : 'bg-slate-400'
                          }`} />
                          {u.status === 'online' ? 'En Línea' : u.status === 'busy' ? 'En Diagnóstico' : 'Inactivo'}
                        </span>
                      </div>

                      {/* Current Action / Activity */}
                      <div className="mt-3 bg-white border border-slate-200 rounded-lg p-2.5 text-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Actividad Actual en la App:
                        </span>
                        <p className="text-slate-800 font-semibold mt-0.5 line-clamp-2">
                          {u.currentAction || 'Operando en el módulo técnico'}
                        </p>
                      </div>

                      {/* Location & Device Info */}
                      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-500" />
                          <span className="font-semibold text-slate-700">{u.branch}</span>
                        </span>
                        <span className="text-slate-400">{u.role}</span>
                      </div>
                    </div>

                    {/* Duration Counters Block */}
                    <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-2 gap-2 bg-white -mx-4 -mb-4 p-3 rounded-b-xl">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-600" />
                          Lleva Conectado:
                        </span>
                        <span className="font-mono text-xs font-black text-emerald-700">
                          {formatDuration(currentDurationSecs)}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                          <History className="w-3 h-3 text-blue-600" />
                          Total Acumulado:
                        </span>
                        <span className="font-mono text-xs font-black text-slate-800">
                          {formatMinutes(u.historicalTotalMinutes)} ({u.sessionsTodayCount} ses.)
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Charts Row: Session Duration by Technician & Hourly Peak Usage */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Chart 1: Duration by User */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Timer className="w-4 h-4 text-amber-500" />
                    Permanencia y Duración de Sesión Activa por Técnico
                  </h3>
                  <p className="text-xs text-slate-500">
                    Minutos activos en la sesión en curso dentro del generador de informes
                  </p>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-1 rounded font-bold">
                  Minutos en vivo
                </span>
              </div>

              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={userDurationChartData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                    <XAxis type="number" stroke="#64748B" fontSize={11} unit="m" />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      stroke="#334155" 
                      fontSize={11}
                      width={140}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="durationMins" 
                      name="Minutos en Sesión Actual" 
                      fill="#F58220" 
                      radius={[0, 6, 6, 0]}
                    >
                      {userDurationChartData.map((_, index) => (
                        <Cell key={`cell-dur-${index}`} fill={PALETTE_PRIMARY[index % PALETTE_PRIMARY.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Hourly Activity Distribution */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    Concurrencia de Usuarios por Hora
                  </h3>
                  <p className="text-xs text-slate-500">
                    Curva de actividad simultánea en talleres y servicios
                  </p>
                </div>
              </div>

              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={stats?.hourlyOnlineDistribution || [
                      { hour: '07:00 AM', count: 2 },
                      { hour: '08:00 AM', count: 5 },
                      { hour: '09:00 AM', count: 8 },
                      { hour: '10:00 AM', count: 11 },
                      { hour: '11:00 AM', count: 14 },
                      { hour: '12:00 PM', count: 9 },
                      { hour: '01:00 PM', count: 12 },
                      { hour: '02:00 PM', count: 13 },
                      { hour: '03:00 PM', count: 10 },
                      { hour: '04:00 PM', count: 8 },
                      { hour: '05:00 PM', count: 4 }
                    ]}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorHourlyUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="hour" stroke="#64748B" fontSize={10} />
                    <YAxis stroke="#64748B" fontSize={11} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      name="Usuarios Conectados" 
                      stroke="#2563EB" 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#colorHourlyUsers)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* DASHBOARD 2: OPERACIONAL & FALLAS DE MAQUINARIA     */}
      {/* ---------------------------------------------------- */}
      {activeDashboardTab === 'operacional' && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Bar Chart: Systems Failure Breakdown */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-amber-500" />
                    Diagnóstico de Fallas por Subsistema Electromecánico
                  </h3>
                  <p className="text-xs text-slate-500">
                    Frecuencia de incidentes detectados en inyección, radiador, sistema eléctrico y control ECM
                  </p>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-1 rounded font-bold">
                  Total: {(stats?.systemFailures || []).reduce((acc, curr) => acc + curr.count, 0)} eventos
                </span>
              </div>

              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats?.systemFailures || []}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 30, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                    <XAxis type="number" stroke="#64748B" fontSize={11} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      stroke="#334155" 
                      fontSize={11}
                      width={180}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      dataKey="count" 
                      name="Eventos Detectados" 
                      fill="#F58220" 
                      radius={[0, 6, 6, 0]}
                    >
                      {(stats?.systemFailures || []).map((_, index) => (
                        <Cell key={`cell-sys-${index}`} fill={PALETTE_PRIMARY[index % PALETTE_PRIMARY.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart: Equipment Brands */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-500" />
                    Distribución por Marca
                  </h3>
                  <p className="text-xs text-slate-500">
                    Proporción de equipos atendidos
                  </p>
                </div>
              </div>

              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats?.brandDistribution || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {(stats?.brandDistribution || []).map((entry, index) => (
                        <Cell 
                          key={`cell-brand-${index}`} 
                          fill={BRAND_COLORS[entry.name.toUpperCase()] || PALETTE_PRIMARY[index % PALETTE_PRIMARY.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Brand Legend */}
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 text-[11px]">
                {(stats?.brandDistribution || []).map((b, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-slate-600 truncate">
                      <span 
                        className="w-2.5 h-2.5 rounded-full shrink-0" 
                        style={{ backgroundColor: BRAND_COLORS[b.name.toUpperCase()] || '#64748B' }} 
                      />
                      <span className="truncate">{b.name}</span>
                    </span>
                    <span className="font-bold text-slate-900">{b.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Top Models & Severity Level */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Top Generator Models */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <h3 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
                <Gauge className="w-4 h-4 text-blue-600" />
                Modelos de Generadores con Mayor Cantidad de Informes
              </h3>
              <div className="space-y-3">
                {(stats?.topModels || []).map((m, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{m.name}</span>
                      <span className="font-mono font-bold text-amber-600">{m.count} informes</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 rounded-full" 
                        style={{ width: `${Math.min(100, (m.count / Math.max(...(stats?.topModels || []).map(x => x.count), 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Severity Distribution */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <h3 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                Clasificación por Nivel de Severidad de Fallas
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {(stats?.severityDistribution || []).map((sev, idx) => (
                  <div 
                    key={idx} 
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between"
                  >
                    <span className="text-xs font-bold text-slate-700 line-clamp-1">{sev.name}</span>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-2xl font-black text-slate-900">{sev.value}</span>
                      <span 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: SEVERITY_COLORS[idx % SEVERITY_COLORS.length] }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* DASHBOARD 3: CLIENTES & SUCURSALES VENEQUIP          */}
      {/* ---------------------------------------------------- */}
      {activeDashboardTab === 'clientes' && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Top Corporate Clients */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-500" />
                    Top Clientes con Mayor Demanda de Servicios
                  </h3>
                  <p className="text-xs text-slate-500">
                    Empresas con mayor volumen de informes técnicos generados
                  </p>
                </div>
              </div>

              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats?.topClients || []}
                    margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#64748B" 
                      fontSize={10} 
                      angle={-20} 
                      textAnchor="end"
                      height={45} 
                    />
                    <YAxis stroke="#64748B" fontSize={11} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Informes de Servicio" fill="#2563EB" radius={[6, 6, 0, 0]}>
                      {(stats?.topClients || []).map((_, index) => (
                        <Cell key={`cell-cli-${index}`} fill={index === 0 ? '#F58220' : '#2563EB'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* National Branch Distribution */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    Carga Operativa por Sucursal Venequip
                  </h3>
                  <p className="text-xs text-slate-500">
                    Distribución en sedes y talleres regionales
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {(stats?.branchDistribution || []).map((b, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-black text-xs">
                        {b.name.substring(0, 2)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">Sucursal {b.name}</h4>
                        <span className="text-[10px] text-slate-500">Operaciones activas</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-slate-900">{b.count}</span>
                      <span className="text-[10px] text-slate-500 block">informes</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* DASHBOARD 4: PRODUCTIVIDAD TÉCNICA & FIRMAS          */}
      {/* ---------------------------------------------------- */}
      {activeDashboardTab === 'tecnicos' && (
        <div className="space-y-6">
          
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  Rendimiento Técnico: Informes Elaborados vs. Firmados y Aprobados
                </h3>
                <p className="text-xs text-slate-500">
                  Desempeño de especialistas técnicos en campo y cumplimiento de firmas digitales
                </p>
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats?.techniciansList || []}
                  margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="reports" name="Informes Elaborados" fill="#F58220" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="signed" name="Firmados & Aprobados" fill="#10B981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* DASHBOARD 5: PREVENTIVO VS CORRECTIVO & TENDENCIAS   */}
      {/* ---------------------------------------------------- */}
      {activeDashboardTab === 'preventivo' && (
        <div className="space-y-6">
          
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  Evolución Mensual: Mantenimientos Preventivos vs. Correctivos
                </h3>
                <p className="text-xs text-slate-500">
                  Comportamiento histórico de servicios técnicos a lo largo del año
                </p>
              </div>
            </div>

            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={stats?.monthlyHistory || []}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorPreventive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorCorrective" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F58220" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#F58220" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="month" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="preventive" 
                    name="Preventivos (Rutina 500h/1000h)" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorPreventive)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="corrective" 
                    name="Correctivos (Fallas Mecánicas)" 
                    stroke="#F58220" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorCorrective)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { 
  X, 
  RefreshCw, 
  TrendingUp, 
  Users, 
  FileText, 
  Cloud, 
  ShieldCheck, 
  Award, 
  Building2, 
  Cpu, 
  Activity, 
  Clock, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useAuth } from './AuthContext';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenUsersModal: () => void;
  onOpenSavedReportsModal: () => void;
  onOpenDriveModal: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

interface DashboardStats {
  summary: {
    totalReports: number;
    totalUsers: number;
    activeUsers: number;
    totalSyncs: number;
    cloudStorageIntegrity: string;
  };
  topClients: { name: string; count: number }[];
  topModels: { name: string; count: number }[];
  branchDistribution: { name: string; count: number }[];
  userRoles: { name: string; value: number }[];
  recentActivity: {
    id: number;
    eventType: string;
    description: string;
    userEmail: string;
    createdAt: string;
    fileUrl?: string;
  }[];
}

const COLORS = ['#FFC20E', '#0F172A', '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EC4899'];

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  onOpenUsersModal,
  onOpenSavedReportsModal,
  onOpenDriveModal,
  onShowToast
}) => {
  const { userProfile, isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'users' | 'activity'>('overview');

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/dashboard-stats');
      const data = await res.json();
      if (data.success) {
        setStats(data);
      } else {
        onShowToast(data.error || 'Error al obtener datos del dashboard', 'error');
      }
    } catch (err: any) {
      console.error('Error fetching dashboard stats:', err);
      onShowToast('Error al conectar con el servidor para estadísticas.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDashboardStats();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-md animate-in fade-in duration-200">
        <div className="max-w-md w-full bg-white rounded-2xl p-6 shadow-2xl text-center border border-slate-200">
          <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto mb-4 font-black">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-slate-900 mb-2">Acceso Exclusivo de Administrador</h3>
          <p className="text-xs text-slate-600 mb-5">
            Este módulo de analíticas avanzadas solo está disponible para cuentas administradoras autorizadas de Venequip S.A.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 sm:p-4 md:p-6 backdrop-blur-md animate-in fade-in duration-200">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-6 py-4 text-white border-b border-slate-800">
          <div className="flex items-center space-x-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-md font-black">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white">Dashboard y Analíticas Administrativas</h2>
                <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                  Panel Master
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Métricas en tiempo real de informes técnicos, flota de equipos, usuarios y sincronización
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchDashboardStats}
              disabled={loading}
              className="flex items-center space-x-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
              title="Refrescar métricas"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden sm:inline">Refrescar</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition ${
              activeTab === 'overview'
                ? 'border-amber-500 text-amber-900 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="h-4 w-4 text-amber-600" />
            <span>Vista General</span>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition ${
              activeTab === 'reports'
                ? 'border-amber-500 text-amber-900 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="h-4 w-4 text-blue-600" />
            <span>Informes y Clientes</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition ${
              activeTab === 'users'
                ? 'border-amber-500 text-amber-900 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="h-4 w-4 text-emerald-600" />
            <span>Técnicos y Roles</span>
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition ${
              activeTab === 'activity'
                ? 'border-amber-500 text-amber-900 bg-white rounded-t-lg'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="h-4 w-4 text-purple-600" />
            <span>Registro de Sincronización</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          {loading && !stats ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <RefreshCw className="h-10 w-10 text-amber-500 animate-spin" />
              <p className="text-sm font-semibold text-slate-600">Cargando métricas y estadísticas del sistema...</p>
            </div>
          ) : stats ? (
            <>
              {/* KPI Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Informes Guardados</span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                      <FileText className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900">{stats.summary.totalReports}</span>
                    <span className="text-xs text-emerald-600 font-bold">Cloud SQL</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">Total de reportes técnicos generados</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Usuarios y Técnicos</span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                      <Users className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900">{stats.summary.totalUsers}</span>
                    <span className="text-xs text-emerald-600 font-bold">{stats.summary.activeUsers} activos</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">Personal técnico con acceso autorizado</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sincronizaciones</span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <Cloud className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-900">{stats.summary.totalSyncs}</span>
                    <span className="text-xs text-emerald-600 font-bold">Google Drive</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">Archivos y respaldos exportados</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estado del Sistema</span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-lg font-black text-emerald-700">Operativo</span>
                    <span className="text-xs text-slate-500 font-bold">100%</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">Base de datos y APIs disponibles</p>
                </div>
              </div>

              {/* Tab 1: Overview Charts */}
              {(activeTab === 'overview' || activeTab === 'reports') && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Clients Bar Chart */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <Building2 className="h-4 w-4 text-amber-600" />
                          Informes por Cliente Principal
                        </h3>
                        <p className="text-[11px] text-slate-400">Distribución de servicios ejecutados por empresa</p>
                      </div>
                    </div>
                    <div className="h-64 w-full">
                      {stats.topClients.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={stats.topClients} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                            <XAxis 
                              dataKey="name" 
                              tick={{ fontSize: 10, fill: '#64748B' }} 
                              angle={-20} 
                              textAnchor="end" 
                              interval={0} 
                            />
                            <YAxis tick={{ fontSize: 10, fill: '#64748B' }} allowDecimals={false} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                              itemStyle={{ color: '#FFC20E' }}
                            />
                            <Bar dataKey="count" name="Informes" fill="#FFC20E" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-slate-400">
                          Aún no hay informes suficientes para graficar clientes.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Top Models Bar Chart */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <Cpu className="h-4 w-4 text-slate-800" />
                          Equipos y Modelos Más Atendidos
                        </h3>
                        <p className="text-[11px] text-slate-400">Generadores, motores y maquinaria Venequip</p>
                      </div>
                    </div>
                    <div className="h-64 w-full">
                      {stats.topModels.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={stats.topModels} layout="vertical" margin={{ top: 10, right: 20, left: 40, bottom: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                            <XAxis type="number" tick={{ fontSize: 10, fill: '#64748B' }} allowDecimals={false} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} width={80} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                              itemStyle={{ color: '#38BDF8' }}
                            />
                            <Bar dataKey="count" name="Informes" fill="#0F172A" radius={[0, 6, 6, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-slate-400">
                          Aún no hay modelos registrados.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Users & Roles */}
              {(activeTab === 'overview' || activeTab === 'users') && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* User Roles Pie Chart */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-1">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                      <Users className="h-4 w-4 text-emerald-600" />
                      Distribución de Roles
                    </h3>
                    <p className="text-[11px] text-slate-400 mb-4">Estructura del personal técnico autorizado</p>
                    <div className="h-56 w-full">
                      {stats.userRoles.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={stats.userRoles}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={70}
                              innerRadius={40}
                              paddingAngle={4}
                            >
                              {stats.userRoles.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '8px', border: 'none', fontSize: '12px' }}
                            />
                            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-slate-400">
                          No hay roles para mostrar.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Branches & Quick Actions */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                        <Award className="h-4 w-4 text-amber-600" />
                        Acceso Rápido y Gestión Administrativa
                      </h3>
                      <p className="text-[11px] text-slate-400 mb-4">
                        Herramientas exclusivas para el Administrador Master (kescalonaccv@gmail.com)
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button
                          onClick={() => {
                            onClose();
                            onOpenUsersModal();
                          }}
                          className="flex flex-col text-left p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/70 transition group"
                        >
                          <Users className="h-5 w-5 text-amber-700 mb-2 group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-bold text-slate-900">Gestión de Usuarios</span>
                          <span className="text-[10px] text-slate-500 mt-1">Crear, cambiar contraseñas y roles</span>
                        </button>

                        <button
                          onClick={() => {
                            onClose();
                            onOpenSavedReportsModal();
                          }}
                          className="flex flex-col text-left p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/70 transition group"
                        >
                          <FileText className="h-5 w-5 text-blue-700 mb-2 group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-bold text-slate-900">Informes en Cloud SQL</span>
                          <span className="text-[10px] text-slate-500 mt-1">Consultar y editar informes históricos</span>
                        </button>

                        <button
                          onClick={() => {
                            onClose();
                            onOpenDriveModal();
                          }}
                          className="flex flex-col text-left p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/70 transition group"
                        >
                          <Cloud className="h-5 w-5 text-emerald-700 mb-2 group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-bold text-slate-900">Google Drive & Workspace</span>
                          <span className="text-[10px] text-slate-500 mt-1">Archivos, hojas Excel y respaldos</span>
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Solo el Administrador tiene autorización para cambiar contraseñas.</span>
                      <span className="font-bold text-slate-700">Venequip S.A. © 2026</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Recent Activity Logs */}
              {(activeTab === 'overview' || activeTab === 'activity') && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-purple-600" />
                        Historial de Sincronización y Actividad Reciente
                      </h3>
                      <p className="text-[11px] text-slate-400">Registros de exportaciones a Google Drive, Excel y Cloud SQL</p>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-100">
                    {stats.recentActivity.length > 0 ? (
                      stats.recentActivity.map((act) => (
                        <div key={act.id} className="flex flex-wrap items-center justify-between p-3 text-xs hover:bg-slate-50 transition">
                          <div className="flex items-center space-x-2.5">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 font-bold">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{act.description}</p>
                              <p className="text-[10px] text-slate-400">Por: {act.userEmail}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3 mt-1 sm:mt-0">
                            <span className="text-[11px] text-slate-400">
                              {act.createdAt ? new Date(act.createdAt).toLocaleString('es-VE') : 'Reciente'}
                            </span>
                            {act.fileUrl && (
                              <a
                                href={act.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:text-amber-800"
                              >
                                Ver Archivo <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No hay registros de actividad recientes.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center text-sm text-slate-500">
              No se pudieron cargar las estadísticas del sistema.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Sesión Administrador: <strong>{userProfile?.email || 'kescalonaccv@gmail.com'}</strong></span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-5 py-2 font-bold text-white hover:bg-slate-800 transition"
          >
            Cerrar Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

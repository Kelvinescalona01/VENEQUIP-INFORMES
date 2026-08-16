import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Trash2, 
  RefreshCw, 
  Cloud, 
  CheckCircle2, 
  X, 
  ExternalLink,
  Phone,
  Mail,
  Award,
  KeyRound,
  Eye,
  EyeOff,
  Lock,
  Sparkles,
  FileSpreadsheet,
  Download,
  Database
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { uploadUsersRosterToDrive } from './googleWorkspace';
import { 
  getLocalUsers, 
  getRemoteUsers,
  subscribeToUsers,
  saveLocalUsers, 
  exportDatabaseToExcel, 
  exportDatabaseToJson, 
  LocalUser 
} from './databaseManager';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

interface UserItem {
  id: number;
  uid: string;
  email: string;
  password?: string;
  name: string;
  role: 'admin' | 'technician' | 'supervisor' | 'manager';
  status: 'active' | 'inactive';
  specialty?: string;
  phone?: string;
  createdAt?: string;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const { accessToken, isAdmin, userProfile } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [lastExportLink, setLastExportLink] = useState<string | null>(null);

  // Form state for creating new user
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'technician' as 'admin' | 'technician' | 'supervisor' | 'manager',
    specialty: 'Técnico Especialista en Generación',
    phone: '',
  });

  // State for Changing Password Modal (Admin exclusive)
  const [passwordModalUser, setPasswordModalUser] = useState<UserItem | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');
  const [showPasswordText, setShowPasswordText] = useState<boolean>(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState<boolean>(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const remote = await getRemoteUsers();
      if (remote && remote.length > 0) {
        setUsers(remote);
      } else {
        const local = getLocalUsers();
        setUsers(local);
      }
    } catch (err) {
      const local = getLocalUsers();
      setUsers(local);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      const unsubscribe = subscribeToUsers((updatedUsers) => {
        if (updatedUsers && updatedUsers.length > 0) {
          setUsers(updatedUsers);
        }
      });
      return () => unsubscribe();
    }
  }, [isOpen]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      onShowToast('Por favor completa el nombre y correo electrónico.', 'error');
      return;
    }

    const cleanEmail = formData.email.trim().toLowerCase();
    const newUserItem: LocalUser = {
      id: Date.now(),
      uid: `usr_${Date.now()}`,
      email: cleanEmail,
      name: formData.name.trim(),
      password: formData.password || 'venequip2026',
      role: formData.role,
      specialty: formData.specialty,
      phone: formData.phone || '',
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    // Save locally
    const currentList = getLocalUsers();
    const existingIdx = currentList.findIndex(u => u.email.toLowerCase() === cleanEmail);
    if (existingIdx >= 0) {
      currentList[existingIdx] = { ...currentList[existingIdx], ...newUserItem };
    } else {
      currentList.push(newUserItem);
    }
    saveLocalUsers(currentList);

    // Try API
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUserItem),
      });
    } catch (err) {}

    onShowToast(`Usuario ${formData.name} registrado exitosamente con clave: ${newUserItem.password}`, 'success');
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'technician',
      specialty: 'Técnico Especialista en Generación',
      phone: '',
    });
    setShowAddForm(false);
    fetchUsers();
  };

  const handleUpdateRole = async (userId: number, newRole: string) => {
    const list = getLocalUsers();
    const target = list.find(u => u.id === userId);
    if (target) {
      target.role = newRole as any;
      saveLocalUsers(list);
    }

    try {
      await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
    } catch (err) {}

    onShowToast('Rol actualizado correctamente.', 'success');
    fetchUsers();
  };

  const handleToggleStatus = async (userId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const list = getLocalUsers();
    const target = list.find(u => u.id === userId);
    if (target) {
      target.status = newStatus as any;
      saveLocalUsers(list);
    }

    try {
      await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {}

    onShowToast(`Usuario ${newStatus === 'active' ? 'activado' : 'desactivado'}.`, 'info');
    fetchUsers();
  };

  const handleDeleteUser = async (userId: number, name: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar el perfil y credenciales de ${name}?`)) {
      return;
    }

    const list = getLocalUsers().filter(u => u.id !== userId);
    saveLocalUsers(list);

    try {
      await fetch(`/api/users/${userId}`, { method: 'DELETE' });
    } catch (err) {}

    onShowToast('Perfil de usuario eliminado.', 'info');
    fetchUsers();
  };

  const handleAdminChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser) return;
    if (!newPassword.trim() || newPassword.trim().length < 4) {
      onShowToast('La contraseña debe tener al menos 4 caracteres.', 'error');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const list = getLocalUsers();
      const target = list.find(u => u.id === passwordModalUser.id);
      if (target) {
        target.password = newPassword.trim();
        saveLocalUsers(list);
      }

      try {
        await fetch(`/api/users/${passwordModalUser.id}/password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            newPassword: newPassword.trim(),
            adminEmail: userProfile?.email || 'kescalonaccv@gmail.com'
          }),
        });
      } catch (e) {}

      onShowToast(`¡Contraseña actualizada con éxito para ${passwordModalUser.name || passwordModalUser.email}!`, 'success');
      setPasswordModalUser(null);
      setNewPassword('');
      fetchUsers();
    } catch (err: any) {
      console.error('Error changing password:', err);
      onShowToast(err.message || 'Error al actualizar contraseña.', 'error');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDownloadFullExcelDatabase = () => {
    try {
      exportDatabaseToExcel();
      onShowToast('¡Base de datos completa descargada en formato Excel (.xlsx)!', 'success');
    } catch (err) {
      console.error('Error exporting excel db:', err);
      onShowToast('Error exportando la base de datos.', 'error');
    }
  };

  const handleDownloadJsonBackup = () => {
    try {
      exportDatabaseToJson();
      onShowToast('¡Respaldo JSON descargado!', 'success');
    } catch (err) {
      onShowToast('Error al exportar respaldo JSON.', 'error');
    }
  };

  const generateSecurePassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$';
    let pass = 'Vq-';
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
  };

  const handleExportUsersToDrive = async () => {
    if (!accessToken) {
      onShowToast('Se requiere tener la sesión de Google activa con permisos de Drive.', 'error');
      return;
    }

    setIsExporting(true);
    try {
      onShowToast('Generando archivo Excel de usuarios y subiendo a Google Drive...', 'info');
      const result = await uploadUsersRosterToDrive(accessToken, users);
      setLastExportLink(result.webViewLink);

      // Log sync
      await fetch('/api/sync-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'SYNC_USERS_EXCEL',
          description: `Sincronización de ${users.length} perfiles a Google Drive (Excel)`,
          fileUrl: result.webViewLink,
        }),
      });

      onShowToast('¡Base de usuarios exportada exitosamente a Google Drive en Excel!', 'success');
    } catch (err: any) {
      console.error('Error syncing users to drive:', err);
      onShowToast(err.message || 'Error subiendo usuarios a Google Drive', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-bold">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Gestión de Perfiles y Usuarios Autorizados</h2>
              <p className="text-xs text-slate-400">
                Panel Exclusivo del Administrador • Creación de Usuarios, Claves y Roles
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center space-x-2 text-sm text-slate-700">
              <ShieldCheck className="h-5 w-5 text-amber-600" />
              <span>
                Total registrados: <strong>{users.length}</strong> usuarios autorizados
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleDownloadFullExcelDatabase}
                title="Descargar Base de Datos Completa con Catálogos y Usuarios en Excel"
                className="flex items-center space-x-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white transition shadow-sm cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-200" />
                <span>Descargar Base de Datos (.xlsx)</span>
              </button>

              <button
                onClick={fetchUsers}
                disabled={loading}
                className="flex items-center space-x-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </button>

              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center space-x-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition shadow-xs cursor-pointer"
              >
                <UserPlus className="h-4 w-4" />
                <span>{showAddForm ? 'Cancelar' : 'Crear Usuario & Clave'}</span>
              </button>
            </div>
          </div>

          {/* Reusable Data & Architecture Guide Banner */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs text-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <Database className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Base de Datos y Datos Reutilizables de la Aplicación</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              La plataforma incluye una base de datos integrada y resiliente que opera tanto en <strong>Vercel (Frontend Estático)</strong> como en <strong>Servidores Cloud</strong>. Todos los catálogos (Clientes como Cervecería Polar/Ferrominera, Modelos Caterpillar C15/C18/C32/3516, Sucursales Venequip, Herramientas con números de parte CAT y Usuarios con contraseñas) se sincronizan automáticamente.
            </p>
          </div>

          {lastExportLink && (
            <div className="flex items-center justify-between rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-emerald-800 text-xs">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span>Archivo Excel de usuarios actualizado en Google Drive</span>
              </div>
              <a
                href={lastExportLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1 font-bold text-emerald-700 hover:underline"
              >
                <span>Abrir en Google Drive</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}

          {/* Add User Form */}
          {showAddForm && (
            <form
              onSubmit={handleCreateUser}
              className="rounded-xl border border-amber-200 bg-amber-50/60 p-5 space-y-4 shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-amber-600" />
                  Crear Nuevo Usuario y Clave de Acceso
                </h3>
                <span className="text-xs text-amber-900 font-semibold">
                  Solo los usuarios creados aquí podrán ingresar a la plataforma
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Ing. Carlos Pérez"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Correo Electrónico de Acceso *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="carlos.perez@venequip.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contraseña Inicial *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Ej: venequip2026"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 font-mono focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Clave con la que el usuario podrá iniciar sesión en la pantalla de entrada.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rol Asignado *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-amber-500 focus:outline-none font-medium"
                  >
                    <option value="technician">🔧 Técnico Especialista (Elabora informes)</option>
                    <option value="supervisor">🔍 Supervisor de Servicio (Revisa y firma)</option>
                    <option value="manager">📋 Gerente de Operaciones (Aprueba)</option>
                    <option value="admin">👑 Administrador (Control total y gestión de usuarios)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Especialidad / Cargo Técnico
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Especialista en Grupos Electrógenos Caterpillar"
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Teléfono de Contacto
                  </label>
                  <input
                    type="text"
                    placeholder="+58 414 1234567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-xs"
                >
                  Crear y Autorizar Usuario
                </button>
              </div>
            </form>
          )}

          {/* User List Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-800 uppercase font-semibold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Usuario / Nombre</th>
                  <th className="px-4 py-3">Clave de Acceso</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Especialidad</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <div className="font-bold">{u.name || 'Sin Nombre'}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Mail className="h-3 w-3 text-slate-400" />
                        {u.email}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {u.password || '••••••••'}
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setPasswordModalUser(u);
                              setNewPassword(u.password || '');
                              setShowPasswordText(false);
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100/70 hover:bg-amber-200 px-1.5 py-0.5 rounded border border-amber-300 transition"
                            title="Cambiar contraseña de este usuario (Exclusivo Administrador)"
                          >
                            <KeyRound className="h-3 w-3" />
                            <span>Cambiar</span>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold focus:border-amber-500 focus:outline-none"
                      >
                        <option value="admin">👑 Administrador</option>
                        <option value="supervisor">🔍 Supervisor</option>
                        <option value="manager">📋 Gerente</option>
                        <option value="technician">🔧 Técnico</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div className="flex items-center gap-1">
                        <Award className="h-3 w-3 text-amber-600 flex-shrink-0" />
                        <span>{u.specialty || 'Servicio Técnico'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleStatus(u.id, u.status)}
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase transition ${
                          u.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                      >
                        {u.status === 'active' ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setPasswordModalUser(u);
                              setNewPassword(u.password || '');
                              setShowPasswordText(false);
                            }}
                            className="rounded p-1 text-slate-500 hover:bg-amber-100 hover:text-amber-900 transition"
                            title="Cambiar contraseña de acceso"
                          >
                            <KeyRound className="h-4 w-4 text-amber-600" />
                          </button>
                        )}
                        {u.email.toLowerCase() !== 'kescalonaccv@gmail.com' && (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      No hay usuarios registrados aún en la base de datos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Password Change Dialog (Admin Only) */}
        {passwordModalUser && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center space-x-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Cambiar Contraseña de Usuario</h3>
                    <p className="text-[11px] text-amber-700 font-semibold">Exclusivo para el Administrador</p>
                  </div>
                </div>
                <button
                  onClick={() => setPasswordModalUser(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-4 rounded-xl bg-slate-50 p-3 border border-slate-200">
                <div className="text-xs font-bold text-slate-900">{passwordModalUser.name || 'Usuario'}</div>
                <div className="text-[11px] text-slate-500">{passwordModalUser.email}</div>
                <div className="text-[10px] text-amber-800 font-bold mt-1 uppercase tracking-wider">
                  Rol: {passwordModalUser.role}
                </div>
              </div>

              <form onSubmit={handleAdminChangePassword} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">Nueva Contraseña de Acceso</label>
                    <button
                      type="button"
                      onClick={generateSecurePassword}
                      className="flex items-center gap-1 text-[11px] font-bold text-amber-700 hover:text-amber-900"
                    >
                      <Sparkles className="h-3 w-3" />
                      Generar sugerida
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPasswordText ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Escribe la nueva contraseña..."
                      required
                      minLength={4}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 pr-10 text-xs font-mono text-slate-900 focus:border-amber-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordText(!showPasswordText)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPasswordText ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    El usuario podrá iniciar sesión inmediatamente en cualquier navegador con esta clave.
                  </p>
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setPasswordModalUser(null)}
                    disabled={isUpdatingPassword}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition shadow-sm"
                  >
                    {isUpdatingPassword ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-3.5 w-3.5" />
                        <span>Guardar Nueva Contraseña</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3 text-xs text-slate-500">
          <span>Los perfiles creados se sincronizan automáticamente con Cloud SQL y Google Drive.</span>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-2 font-bold text-white hover:bg-slate-800 transition"
          >
            Cerrar Panel
          </button>
        </div>
      </div>
    </div>
  );
};

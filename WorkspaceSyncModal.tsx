import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  FileSpreadsheet, 
  FileText, 
  Mail, 
  CheckCircle2, 
  ExternalLink, 
  RefreshCw, 
  X, 
  Send, 
  FolderCheck,
  History,
  AlertCircle,
  FileDown,
  Database,
  Link,
  Smartphone,
  Laptop,
  ArrowDownToLine,
  ArrowUpToLine,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { InformeTecnico } from './types';
import { 
  ensureVenequipDriveFolder, 
  uploadExcelReportToDrive, 
  exportToGoogleDocs, 
  listVenequipDriveFiles, 
  sendReportEmailViaGmail,
  syncFullDatabaseToLinkedGoogleSpreadsheet,
  importFullDatabaseFromLinkedGoogleSpreadsheet,
  DriveFileInfo,
  DriveFolderInfo
} from './googleWorkspace';
import {
  getLinkedSpreadsheetId,
  setLinkedSpreadsheetId,
  DEFAULT_LINKED_SPREADSHEET_ID,
  DEFAULT_LINKED_SPREADSHEET_URL,
  exportDatabaseToExcel
} from './databaseManager';

interface WorkspaceSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: InformeTecnico;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const WorkspaceSyncModal: React.FC<WorkspaceSyncModalProps> = ({
  isOpen,
  onClose,
  report,
  onShowToast,
}) => {
  const { user, accessToken, signIn } = useAuth();
  const [activeTab, setActiveTab] = useState<'linked_sheet' | 'drive' | 'docs' | 'gmail' | 'files' | 'history'>('linked_sheet');
  
  // State for Linked Database Sheet
  const [linkedSheetId, setLinkedSheetIdState] = useState<string>(getLinkedSpreadsheetId());
  const [isSyncingLinked, setIsSyncingLinked] = useState(false);
  const [isImportingLinked, setIsImportingLinked] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<{ timestamp: string; url: string } | null>(null);

  // State for Drive
  const [isUploadingExcel, setIsUploadingExcel] = useState(false);
  const [lastExcelLink, setLastExcelLink] = useState<string | null>(null);
  const [folderInfo, setFolderInfo] = useState<DriveFolderInfo | null>(null);

  // State for Docs
  const [isExportingDocs, setIsExportingDocs] = useState(false);
  const [lastDocsLink, setLastDocsLink] = useState<string | null>(null);

  // State for Gmail
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailCc, setEmailCc] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailNote, setEmailNote] = useState('');
  const [emailSentId, setEmailSentId] = useState<string | null>(null);

  // State for Files list
  const [driveFiles, setDriveFiles] = useState<DriveFileInfo[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  // State for Logs
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    if (report && report.encabezado_venequip) {
      const enc = report.encabezado_venequip;
      setEmailSubject(
        `Informe Técnico Venequip - N° ${enc.numero_servicio || 'S/N'} - ${enc.cliente || 'Cliente'} (${enc.modelo || 'Equipo'})`
      );
    }
  }, [report]);

  const loadFolderAndFiles = async () => {
    if (!accessToken) return;
    setLoadingFiles(true);
    try {
      const folder = await ensureVenequipDriveFolder(accessToken);
      setFolderInfo(folder);
      const files = await listVenequipDriveFiles(accessToken, folder.id);
      setDriveFiles(files);
    } catch (err) {
      console.error('Error loading drive folder/files:', err);
    } finally {
      setLoadingFiles(false);
    }
  };

  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/sync-logs');
      const data = await res.json();
      if (data.success) {
        setSyncLogs(data.logs);
      }
    } catch (err) {
      console.error('Error loading logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (isOpen && accessToken) {
      loadFolderAndFiles();
      loadLogs();
    }
  }, [isOpen, accessToken, activeTab]);

  const handleSyncToLinkedSheet = async () => {
    if (!accessToken) {
      onShowToast('Por favor inicia sesión con Google para sincronizar con Google Drive.', 'error');
      return;
    }

    setIsSyncingLinked(true);
    try {
      onShowToast('Sincronizando todas las hojas de la Base de Datos con Google Drive / Sheets...', 'info');
      const res = await syncFullDatabaseToLinkedGoogleSpreadsheet(accessToken, linkedSheetId);
      setLastSyncResult({ timestamp: res.timestamp, url: res.webViewLink });

      await fetch('/api/sync-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'SYNC_FULL_DATABASE_DRIVE',
          description: `Sincronización en tiempo real de Base de Datos Maestro Excel en Google Drive (${linkedSheetId})`,
          userEmail: user?.email,
          fileUrl: res.webViewLink,
        }),
      });

      onShowToast('¡Base de Datos actualizada y sincronizada en tiempo real con Google Drive!', 'success');
      loadLogs();
    } catch (err: any) {
      console.error('Error in handleSyncToLinkedSheet:', err);
      onShowToast(err.message || 'Error sincronizando con Google Drive', 'error');
    } finally {
      setIsSyncingLinked(false);
    }
  };

  const handleImportFromLinkedSheet = async () => {
    if (!accessToken) {
      onShowToast('Por favor inicia sesión con Google para importar datos.', 'error');
      return;
    }

    setIsImportingLinked(true);
    try {
      onShowToast('Leyendo e importando datos desde el archivo de Google Drive / Sheets...', 'info');
      const res = await importFullDatabaseFromLinkedGoogleSpreadsheet(accessToken, linkedSheetId);
      onShowToast(res.message, 'success');
      loadLogs();
    } catch (err: any) {
      console.error('Error in handleImportFromLinkedSheet:', err);
      onShowToast(err.message || 'Error importando desde Google Drive', 'error');
    } finally {
      setIsImportingLinked(false);
    }
  };

  const handleSaveSheetId = (newId: string) => {
    setLinkedSheetIdState(newId);
    setLinkedSpreadsheetId(newId);
    onShowToast('Enlace de Base de Datos actualizado.', 'success');
  };

  const handleUploadExcel = async () => {
    if (!accessToken) {
      onShowToast('Por favor inicia sesión con Google para acceder a Google Drive.', 'error');
      return;
    }

    setIsUploadingExcel(true);
    try {
      onShowToast('Generando libro Excel y subiendo a Google Drive...', 'info');
      const res = await uploadExcelReportToDrive(accessToken, report);
      setLastExcelLink(res.webViewLink);

      // Save report and sync log in Cloud SQL
      await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportData: report,
          createdByUid: user?.uid,
          driveFileId: res.fileId,
          driveFileUrl: res.webViewLink,
        }),
      });

      await fetch('/api/sync-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'EXPORT_EXCEL_DRIVE',
          description: `Subida de informe ${report.encabezado_venequip?.numero_servicio || ''} a Google Drive (Excel)`,
          userEmail: user?.email,
          fileUrl: res.webViewLink,
        }),
      });

      onShowToast('¡Informe subido a Google Drive exitosamente como archivo Excel (.xlsx)!', 'success');
      loadFolderAndFiles();
    } catch (err: any) {
      console.error('Error uploading excel to drive:', err);
      onShowToast(err.message || 'Error al subir archivo a Google Drive', 'error');
    } finally {
      setIsUploadingExcel(false);
    }
  };

  const handleExportDocs = async () => {
    if (!accessToken) {
      onShowToast('Por favor inicia sesión con Google para acceder a Google Docs.', 'error');
      return;
    }

    setIsExportingDocs(true);
    try {
      onShowToast('Creando documento en Google Docs...', 'info');
      const res = await exportToGoogleDocs(accessToken, report);
      setLastDocsLink(res.webViewLink);

      await fetch('/api/sync-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'EXPORT_GOOGLE_DOCS',
          description: `Exportación de informe ${report.encabezado_venequip?.numero_servicio || ''} a Google Docs`,
          userEmail: user?.email,
          fileUrl: res.webViewLink,
        }),
      });

      onShowToast('¡Documento creado en Google Docs con éxito!', 'success');
      loadFolderAndFiles();
    } catch (err: any) {
      console.error('Error exporting to Google Docs:', err);
      onShowToast(err.message || 'Error exportando a Google Docs', 'error');
    } finally {
      setIsExportingDocs(false);
    }
  };

  const handleSendGmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) {
      onShowToast('Por favor inicia sesión con Google para enviar correos.', 'error');
      return;
    }
    if (!emailTo.trim()) {
      onShowToast('Por favor ingresa al menos un destinatario.', 'error');
      return;
    }

    setIsSendingEmail(true);
    try {
      onShowToast('Enviando informe por Gmail...', 'info');
      const res = await sendReportEmailViaGmail(accessToken, {
        to: emailTo,
        cc: emailCc,
        subject: emailSubject,
        report,
        customNote: emailNote,
        senderEmail: user?.email || undefined,
      });

      setEmailSentId(res.messageId);

      await fetch('/api/sync-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'EMAIL_GMAIL_SENT',
          description: `Envío de informe ${report.encabezado_venequip?.numero_servicio || ''} a ${emailTo}`,
          userEmail: user?.email,
        }),
      });

      onShowToast(`¡Informe enviado exitosamente a ${emailTo} vía Gmail!`, 'success');
    } catch (err: any) {
      console.error('Error sending email:', err);
      onShowToast(err.message || 'Error enviando correo por Gmail', 'error');
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 sm:p-4 md:p-6 backdrop-blur-md">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-6 py-4 text-white">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-bold shadow-md">
              <Cloud className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Google Workspace & Base de Datos en Drive</h2>
              <p className="text-xs text-slate-400">
                Google Sheets • Google Drive • Sincronización Multi-Dispositivo en Tiempo Real
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Auth status banner if not logged in */}
        {!user && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-amber-900 font-medium">
              <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <span>Inicia sesión con Google para sincronizar en tiempo real con tu archivo en Drive.</span>
            </div>
            <button
              onClick={signIn}
              className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition cursor-pointer"
            >
              Iniciar Sesión con Google
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex flex-wrap border-b border-slate-200 bg-slate-50 px-4 sm:px-6 pt-2 gap-1">
          <button
            onClick={() => setActiveTab('linked_sheet')}
            className={`flex items-center space-x-2 border-b-2 px-3 sm:px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
              activeTab === 'linked_sheet'
                ? 'border-emerald-600 text-emerald-800 bg-white rounded-t-lg shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="h-4 w-4 text-emerald-600" />
            <span>🔗 Base de Datos Enlazada</span>
          </button>

          <button
            onClick={() => setActiveTab('drive')}
            className={`flex items-center space-x-2 border-b-2 px-3 sm:px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
              activeTab === 'drive'
                ? 'border-amber-500 text-amber-700 bg-white rounded-t-lg shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Informes Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`flex items-center space-x-2 border-b-2 px-3 sm:px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
              activeTab === 'docs'
                ? 'border-amber-500 text-amber-700 bg-white rounded-t-lg shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="h-4 w-4 text-blue-600" />
            <span>Google Docs</span>
          </button>

          <button
            onClick={() => setActiveTab('gmail')}
            className={`flex items-center space-x-2 border-b-2 px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
              activeTab === 'gmail'
                ? 'border-amber-500 text-amber-700 bg-white rounded-t-lg shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="h-4 w-4 text-red-500" />
            <span>Enviar por Gmail</span>
          </button>

          <button
            onClick={() => setActiveTab('files')}
            className={`flex items-center space-x-2 border-b-2 px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
              activeTab === 'files'
                ? 'border-amber-500 text-amber-700 bg-white rounded-t-lg shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderCheck className="h-4 w-4 text-amber-600" />
            <span>Carpeta Drive</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center space-x-2 border-b-2 px-4 py-2.5 text-xs font-bold transition cursor-pointer ${
              activeTab === 'history'
                ? 'border-amber-500 text-amber-700 bg-white rounded-t-lg shadow-sm'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="h-4 w-4 text-slate-500" />
            <span>Historial</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB: LINKED GOOGLE SPREADSHEET DATABASE */}
          {activeTab === 'linked_sheet' && (
            <div className="space-y-6">
              {/* Linked Card */}
              <div className="rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-50/70 via-white to-slate-50 p-5 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md flex-shrink-0">
                      <Database className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-slate-900">
                          Base de Datos Oficial Enlazada con Google Drive
                        </h3>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          🟢 CONECTADO
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Archivo Maestro Excel (.xlsx) de 8 hojas con sincronización en vivo para informes, usuarios, KPIs y sesiones.
                      </p>
                    </div>
                  </div>

                  <a
                    href={`https://docs.google.com/spreadsheets/d/${linkedSheetId}/edit?usp=drive_link`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center space-x-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    <span>Abrir en Google Sheets</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>

                {/* File ID input / config */}
                <div className="mt-5 rounded-xl bg-white border border-slate-200 p-3.5 text-xs">
                  <label className="font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Link className="h-3.5 w-3.5 text-emerald-600" />
                    <span>ID del Archivo de Google Drive / Google Sheets:</span>
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={linkedSheetId}
                      onChange={(e) => setLinkedSheetIdState(e.target.value)}
                      placeholder="e.g. 1hL6O4d7v8ZFcDnI6pwdSAG8-u5rFcznt"
                      className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      onClick={() => handleSaveSheetId(linkedSheetId)}
                      className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition cursor-pointer"
                    >
                      Guardar Enlace
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1.5">
                    Enlace configurado: <a href={`https://docs.google.com/spreadsheets/d/${linkedSheetId}/edit?usp=drive_link`} target="_blank" rel="noreferrer" className="text-emerald-700 underline font-mono">https://docs.google.com/spreadsheets/d/{linkedSheetId}/edit</a>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    onClick={handleSyncToLinkedSheet}
                    disabled={isSyncingLinked || !user}
                    className="flex items-center space-x-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-500 disabled:opacity-50 transition cursor-pointer"
                  >
                    <ArrowUpToLine className={`h-4 w-4 ${isSyncingLinked ? 'animate-bounce' : ''}`} />
                    <span>{isSyncingLinked ? 'Sincronizando Todo...' : 'Sincronizar y Subir Base de Datos a Drive'}</span>
                  </button>

                  <button
                    onClick={handleImportFromLinkedSheet}
                    disabled={isImportingLinked || !user}
                    className="flex items-center space-x-2 rounded-xl border border-emerald-600 bg-emerald-50 text-emerald-800 px-4 py-3 text-xs font-bold hover:bg-emerald-100 disabled:opacity-50 transition cursor-pointer"
                  >
                    <ArrowDownToLine className={`h-4 w-4 ${isImportingLinked ? 'animate-bounce' : ''}`} />
                    <span>{isImportingLinked ? 'Descargando...' : 'Importar Datos desde Google Drive'}</span>
                  </button>

                  <button
                    onClick={() => exportDatabaseToExcel()}
                    className="flex items-center space-x-1.5 rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <FileDown className="h-4 w-4 text-emerald-600" />
                    <span>Descargar Copia Local (.xlsx)</span>
                  </button>
                </div>

                {/* Success Indicator */}
                {lastSyncResult && (
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-emerald-100 border border-emerald-300 p-3 text-xs text-emerald-900">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                      <span>Sincronizado con éxito en la nube a las {lastSyncResult.timestamp}</span>
                    </div>
                    <a
                      href={lastSyncResult.url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-emerald-800 underline flex items-center gap-1"
                    >
                      <span>Ver en Google Sheets</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Multi-Device Architecture explanation */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-amber-500" />
                  <span>Acceso Multi-Dispositivo (Laptops, Tablets y Smartphones)</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center gap-2 font-bold text-slate-800 mb-1">
                      <Laptop className="h-4 w-4 text-blue-600" />
                      <span>Computadoras & Laptops</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      Edición completa de informes, emisión de diagnósticos y gestión de catálogo de repuestos y personal técnico.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center gap-2 font-bold text-slate-800 mb-1">
                      <Smartphone className="h-4 w-4 text-emerald-600" />
                      <span>Celulares & Teléfonos Móviles</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      Inicio de sesión inmediato en campo, captura de fotos, notas técnicas y consulta en vivo de datos sincronizados.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center gap-2 font-bold text-slate-800 mb-1">
                      <Cloud className="h-4 w-4 text-amber-600" />
                      <span>Google Drive en la Nube</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      El archivo maestro (.xlsx) sirve como base centralizada accesible desde cualquier navegador sin perder información.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: GOOGLE DRIVE & EXCEL */}
          {activeTab === 'drive' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-white p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md">
                      <FileSpreadsheet className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Subir a Google Drive como Archivo Excel (.xlsx)
                      </h3>
                      <p className="text-xs text-slate-600">
                        Almacena todos los datos técnicos del informe en hojas de cálculo estructuradas para reutilización y auditoría.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <span className="font-bold text-slate-800 block mb-1">Hoja 1: Datos Generales</span>
                    <span className="text-slate-500">Cliente, Serial, Horas de motor, Sucursal, Fecha y N° Servicio.</span>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <span className="font-bold text-slate-800 block mb-1">Hoja 2: Diagnóstico</span>
                    <span className="text-slate-500">Solicitud, Actividades, Fallas, Causas y Conclusiones.</span>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <span className="font-bold text-slate-800 block mb-1">Hoja 3: Herramientas y Firmas</span>
                    <span className="text-slate-500">Repuestos utilizados, técnicos y validación oficial.</span>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleUploadExcel}
                    disabled={isUploadingExcel || !user}
                    className="flex items-center space-x-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-500 disabled:opacity-50 transition cursor-pointer"
                  >
                    <Cloud className={`h-4 w-4 ${isUploadingExcel ? 'animate-bounce' : ''}`} />
                    <span>{isUploadingExcel ? 'Subiendo archivo Excel...' : 'Subir Informe a Google Drive'}</span>
                  </button>

                  {folderInfo && (
                    <a
                      href={folderInfo.webViewLink}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center space-x-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                    >
                      <FolderCheck className="h-4 w-4 text-amber-600" />
                      <span>Abrir Carpeta Venequip en Drive</span>
                      <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                    </a>
                  )}
                </div>

                {lastExcelLink && (
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-emerald-100/70 border border-emerald-300 p-3 text-xs text-emerald-900">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                      <span>¡Archivo subido exitosamente a tu Google Drive!</span>
                    </div>
                    <a
                      href={lastExcelLink}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-emerald-800 underline hover:text-emerald-950 flex items-center gap-1"
                    >
                      <span>Abrir archivo en Google Sheets</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: GOOGLE DOCS */}
          {activeTab === 'docs' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/60 to-white p-6">
                <div className="flex items-center space-x-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Exportar como Documento de Google Docs
                    </h3>
                    <p className="text-xs text-slate-600">
                      Crea un documento en vivo en tu Google Drive con toda la redacción técnica estructurada y numerada.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleExportDocs}
                    disabled={isExportingDocs || !user}
                    className="flex items-center space-x-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-blue-500 disabled:opacity-50 transition cursor-pointer"
                  >
                    <FileText className={`h-4 w-4 ${isExportingDocs ? 'animate-bounce' : ''}`} />
                    <span>{isExportingDocs ? 'Generando Google Doc...' : 'Crear Documento en Google Docs'}</span>
                  </button>

                  {lastDocsLink && (
                    <a
                      href={lastDocsLink}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center space-x-1.5 rounded-xl border border-blue-300 bg-white px-4 py-2.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 transition"
                    >
                      <span>Abrir en Google Docs</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>

                {lastDocsLink && (
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-blue-100/70 border border-blue-300 p-3 text-xs text-blue-900">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-blue-700" />
                      <span>¡Documento de Google Docs creado exitosamente!</span>
                    </div>
                    <a
                      href={lastDocsLink}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-blue-800 underline hover:text-blue-950 flex items-center gap-1"
                    >
                      <span>Ver Documento</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: GMAIL */}
          {activeTab === 'gmail' && (
            <div className="space-y-6">
              <form onSubmit={handleSendGmail} className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
                <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500 text-white shadow-md">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Enviar Informe por Correo Electrónico (Gmail)</h3>
                    <p className="text-xs text-slate-500">
                      Envía un correo corporativo formal a clientes o supervisores con la plantilla oficial de Venequip.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Destinatario Principal (Para:) *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="cliente@empresa.com"
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Con Copia (CC:):
                    </label>
                    <input
                      type="text"
                      placeholder="supervisor@venequip.com, gerencia@venequip.com"
                      value={emailCc}
                      onChange={(e) => setEmailCc(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Asunto del Correo:</label>
                  <input
                    type="text"
                    required
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nota o Mensaje Personalizado del Especialista:
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Estimado cliente, adjuntamos los detalles de la evaluación técnica realizada..."
                    value={emailNote}
                    onChange={(e) => setEmailNote(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="submit"
                    disabled={isSendingEmail || !user}
                    className="flex items-center space-x-2 rounded-xl bg-red-600 px-6 py-2.5 text-xs font-bold text-white shadow hover:bg-red-500 disabled:opacity-50 transition cursor-pointer"
                  >
                    <Send className={`h-4 w-4 ${isSendingEmail ? 'animate-spin' : ''}`} />
                    <span>{isSendingEmail ? 'Enviando...' : 'Enviar Informe por Gmail'}</span>
                  </button>

                  {emailSentId && (
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Mensaje entregado exitosamente.</span>
                    </span>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* TAB: FILES IN DRIVE FOLDER */}
          {activeTab === 'files' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Archivos en Carpeta Oficial de Google Drive
                  </h3>
                  <p className="text-xs text-slate-500">
                    Documentos y libros de cálculo alojados en la nube de Venequip.
                  </p>
                </div>
                <button
                  onClick={loadFolderAndFiles}
                  disabled={loadingFiles}
                  className="flex items-center space-x-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <RefreshCw className={`h-3 w-3 ${loadingFiles ? 'animate-spin' : ''}`} />
                  <span>Actualizar</span>
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">Nombre del Archivo</th>
                      <th className="px-4 py-2.5 font-semibold">Tipo</th>
                      <th className="px-4 py-2.5 font-semibold">Última Modificación</th>
                      <th className="px-4 py-2.5 font-semibold text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {driveFiles.map((file) => (
                      <tr key={file.id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 font-semibold text-slate-900 flex items-center gap-2">
                          {file.mimeType.includes('spreadsheet') ? (
                            <FileSpreadsheet className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                          ) : file.mimeType.includes('document') ? (
                            <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          ) : (
                            <FileDown className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          )}
                          <span className="truncate max-w-xs">{file.name}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-[11px]">
                          {file.mimeType.includes('spreadsheet')
                            ? 'Excel / Google Sheets'
                            : file.mimeType.includes('document')
                            ? 'Google Docs'
                            : file.mimeType.split('.').pop()}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-[11px]">
                          {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-1 text-xs font-bold text-amber-600 hover:text-amber-700"
                          >
                            <span>Abrir</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </td>
                      </tr>
                    ))}
                    {driveFiles.length === 0 && !loadingFiles && (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                          Aún no se han subido archivos a la carpeta de Google Drive.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: HISTORY & LOGS */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Historial de Sincronización y Actividad Cloud SQL
                  </h3>
                  <p className="text-xs text-slate-500">
                    Registro de eventos de exportación a Drive, creación de Docs y envíos por Gmail.
                  </p>
                </div>
                <button
                  onClick={loadLogs}
                  disabled={loadingLogs}
                  className="flex items-center space-x-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <RefreshCw className={`h-3 w-3 ${loadingLogs ? 'animate-spin' : ''}`} />
                  <span>Recargar</span>
                </button>
              </div>

              <div className="space-y-2">
                {syncLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between rounded-xl border border-slate-200 bg-white p-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-800">{log.description}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Por: {log.userEmail} • Tipo: {log.eventType} •{' '}
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}
                      </div>
                    </div>
                    {log.fileUrl && (
                      <a
                        href={log.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center space-x-1 text-amber-600 font-bold hover:underline"
                      >
                        <span>Ver Archivo</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                ))}
                {syncLogs.length === 0 && !loadingLogs && (
                  <div className="rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
                    No hay registros de actividad aún.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3 text-xs text-slate-500">
          <span>Integración directa con Google Drive, Sheets, Docs y Gmail.</span>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-2 font-bold text-white hover:bg-slate-800 transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

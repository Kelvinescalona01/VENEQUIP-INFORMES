import React, { useState, useEffect, useRef } from 'react';
import { InformeTecnico } from './types';
import { DEFAULT_REPORT, SAMPLE_REPORT } from './defaultReport';
import { normalizeReport } from './reportUtils';
import { Header } from './Header';
import { ReportEditor } from './ReportEditor';
import { ReportPreview } from './ReportPreview';
import { AIAnalyzerModal } from './AIAnalyzerModal';
import { SignatureCanvasModal } from './SignatureCanvasModal';
import { ExportModal } from './ExportModal';
import { WorkspaceSyncModal } from './WorkspaceSyncModal';
import { UserManagementModal } from './UserManagementModal';
import { SavedReportsModal } from './SavedReportsModal';
import { AdminDashboardModal } from './AdminDashboardModal';
import { ModernDashboards } from './ModernDashboards';
import { LoginScreen } from './LoginScreen';
import { exportDocumentToPDF } from './pdfExporter';
import { uploadExcelReportToDrive } from './googleWorkspace';
import { 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  Download, 
  Cloud, 
  FolderClock, 
  Users, 
  FileSpreadsheet, 
  Check,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { analyzeReportUniversal, polishSectionUniversal } from './geminiService';

export default function App() {
  const { user, userProfile, isAuthenticated, isAdmin, accessToken, loading } = useAuth();

  const [report, setReport] = useState<InformeTecnico>(() => {
    const saved = localStorage.getItem('venequip_report_draft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.encabezado_venequip?.numero_servicio === 'S6318' && parsed?.encabezado_venequip?.cliente === 'MEGALABS') {
          return normalizeReport(DEFAULT_REPORT);
        }
        return normalizeReport(parsed);
      } catch (e) {
        console.error('Error cargando borrador guardado:', e);
      }
    }
    return normalizeReport(DEFAULT_REPORT);
  });

  const [activeView, setActiveView] = useState<'editor' | 'preview' | 'dashboard'>('editor');
  const [isSaved, setIsSaved] = useState(true);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  
  // Auto-drive upload state indicator
  const [driveSyncStatus, setDriveSyncStatus] = useState<'idle' | 'saving' | 'synced' | 'offline'>('idle');

  // Modals
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const [isSavedReportsModalOpen, setIsSavedReportsModalOpen] = useState(false);
  const [isDashboardModalOpen, setIsDashboardModalOpen] = useState(false);

  const [signatureRole, setSignatureRole] = useState<'elaborado_por' | 'revisado_por' | 'aprobado_por' | null>(null);
  const [isPolishingSection, setIsPolishingSection] = useState<string | null>(null);

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Automated background save to Cloud SQL and Google Drive (Excel)
  const syncReportBackground = async (currentReport: InformeTecnico) => {
    // 1. Save to Cloud SQL
    try {
      await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportData: currentReport,
          createdByUid: user?.uid,
        }),
      });
    } catch (err) {
      console.warn('Auto-save to Cloud SQL:', err);
    }

    // 2. Automated upload to Google Drive if access token is available
    if (accessToken) {
      setDriveSyncStatus('saving');
      try {
        const driveResult = await uploadExcelReportToDrive(accessToken, currentReport);
        setDriveSyncStatus('synced');

        // Log to database
        await fetch('/api/sync-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'AUTO_SYNC_EXCEL',
            description: `Auto-guardado automático de informe ${currentReport.encabezado_venequip?.numero_servicio || ''} en Google Drive (Excel)`,
            userEmail: user?.email,
            fileUrl: driveResult.webViewLink,
          }),
        });
      } catch (driveErr) {
        console.warn('Auto-save to Google Drive:', driveErr);
        setDriveSyncStatus('offline');
      }
    }
  };

  // Change handler with debounced auto-sync
  const handleReportChange = (updated: InformeTecnico) => {
    const normalized = normalizeReport(updated);
    setReport(normalized);
    setIsSaved(false);

    // Debounced automatic background sync (2.5 seconds after user finishes typing)
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(() => {
      localStorage.setItem('venequip_report_draft', JSON.stringify(normalized));
      setIsSaved(true);
      syncReportBackground(normalized);
    }, 2500);
  };

  const handleSaveDraft = async () => {
    localStorage.setItem('venequip_report_draft', JSON.stringify(report));
    setIsSaved(true);
    showToast('Borrador guardado exitosamente.');
    await syncReportBackground(report);
  };

  const handleResetDefault = () => {
    if (window.confirm('¿Deseas cargar el informe de ejemplo (Caterpillar 350)?')) {
      const normalized = normalizeReport(SAMPLE_REPORT);
      setReport(normalized);
      localStorage.setItem('venequip_report_draft', JSON.stringify(normalized));
      setIsSaved(true);
      showToast('Informe de ejemplo cargado.');
      syncReportBackground(normalized);
    }
  };

  const handleNewReport = () => {
    if (window.confirm('¿Deseas crear un nuevo informe técnico en blanco?')) {
      const blankReport = normalizeReport(DEFAULT_REPORT);
      setReport(blankReport);
      localStorage.setItem('venequip_report_draft', JSON.stringify(blankReport));
      setIsSaved(true);
      showToast('Nuevo informe en blanco creado.');
      syncReportBackground(blankReport);
    }
  };

  // AI Analysis Handler
  const handleAnalyzeWithAI = async (
    files: { data: string; mimeType: string; name: string }[],
    rawNotes: string,
    instructions: string
  ) => {
    setIsAIAnalyzing(true);
    try {
      const normalized = await analyzeReportUniversal(files, rawNotes, instructions, report);
      setReport(normalized);
      localStorage.setItem('venequip_report_draft', JSON.stringify(normalized));
      setIsSaved(true);
      showToast('¡Informe procesado y redactado al estándar Venequip con IA!');
      syncReportBackground(normalized);
    } catch (err: any) {
      console.error('Error procesando informe con IA:', err);
      showToast(err.message || 'Error al procesar el informe con IA.', 'error');
      throw err;
    } finally {
      setIsAIAnalyzing(false);
    }
  };

  // Polish Single Section Handler
  const handlePolishSection = async (sectionName: string, currentText: string, callback: (newText: string) => void) => {
    setIsPolishingSection(sectionName);
    try {
      const polished = await polishSectionUniversal(sectionName, currentText, report.encabezado_venequip);
      if (polished) {
        callback(polished);
        showToast(`Sección "${sectionName}" perfeccionada con éxito.`);
      }
    } catch (err: any) {
      showToast(err.message || 'Error al perfeccionar sección con IA.', 'error');
    } finally {
      setIsPolishingSection(null);
    }
  };

  // Save Signature
  const handleSaveSignatureRole = (signatureDataUrl: string) => {
    if (!signatureRole) return;
    const updated = {
      ...report,
      bloque_firmas: {
        ...report.bloque_firmas,
        [signatureRole]: {
          ...(report.bloque_firmas?.[signatureRole] || {}),
          firma_image: signatureDataUrl,
        },
      },
    };
    handleReportChange(updated);
    setSignatureRole(null);
    showToast('Firma digitalizada guardada correctamente.');
  };

  // Show loading spinner during initial authentication check
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent mb-4"></div>
        <p className="text-sm font-semibold text-slate-300">Cargando Sistema Venequip...</p>
      </div>
    );
  }

  // Enforce Login-First Requirement: If not authenticated, render LoginScreen
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 selection:bg-amber-400 selection:text-black font-sans">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center space-x-2 px-4 py-3 rounded-xl shadow-2xl transition-all animate-bounce ${
            toastMsg.type === 'success'
              ? 'bg-emerald-600 text-white'
              : toastMsg.type === 'error'
              ? 'bg-rose-600 text-white'
              : 'bg-slate-800 text-white'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-200" />
          )}
          <span className="text-xs sm:text-sm font-bold">{toastMsg.text}</span>
        </div>
      )}

      {/* Main Corporate Header */}
      <Header
        onOpenAIModal={() => setIsAIModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenDriveModal={() => setIsDriveModalOpen(true)}
        onOpenUsersModal={() => setIsUsersModalOpen(true)}
        onOpenSavedReportsModal={() => setIsSavedReportsModalOpen(true)}
        onOpenDashboardModal={() => setIsDashboardModalOpen(true)}
        onNewReport={handleNewReport}
        onResetDefault={handleResetDefault}
        onSaveDraft={handleSaveDraft}
        isSaved={isSaved}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      {/* Auto-Drive Sync Floating Status Bar */}
      {accessToken && (
        <div className="bg-slate-900 text-slate-300 text-[11px] px-4 py-1.5 border-b border-slate-800 flex items-center justify-between no-print">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-slate-200">Google Drive:</span>
              <span className="text-slate-400">
                Carpeta "VENEQUIP - Informes Técnicos y Registros" activa (Archivos Excel automáticos).
              </span>
            </div>
            <div className="flex items-center gap-2">
              {driveSyncStatus === 'saving' && (
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
                  Auto-guardando en Drive...
                </span>
              )}
              {driveSyncStatus === 'synced' && (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-400" />
                  Sincronizado en Drive (.xlsx)
                </span>
              )}
              {driveSyncStatus === 'idle' && (
                <span className="text-slate-400">Listo para auto-guardar en Drive</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-6">
        
        {activeView === 'editor' ? (
          <ReportEditor
            report={report}
            onChange={handleReportChange}
            onOpenSignatureCanvas={(role) => setSignatureRole(role)}
            onPolishSection={handlePolishSection}
            isPolishingSection={isPolishingSection}
          />
        ) : activeView === 'preview' ? (
          <ReportPreview
            report={report}
            onOpenExportModal={() => setIsExportModalOpen(true)}
          />
        ) : (
          <ModernDashboards
            onOpenUsersModal={() => setIsUsersModalOpen(true)}
            onOpenSavedReportsModal={() => setIsSavedReportsModalOpen(true)}
            onOpenDriveModal={() => setIsDriveModalOpen(true)}
            onShowToast={showToast}
          />
        )}

      </main>

      {/* Admin Analytics Dashboard Modal */}
      <AdminDashboardModal
        isOpen={isDashboardModalOpen}
        onClose={() => setIsDashboardModalOpen(false)}
        onOpenUsersModal={() => setIsUsersModalOpen(true)}
        onOpenSavedReportsModal={() => setIsSavedReportsModalOpen(true)}
        onOpenDriveModal={() => setIsDriveModalOpen(true)}
        onShowToast={showToast}
      />

      {/* Google Workspace & Drive Sync Modal */}
      <WorkspaceSyncModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        report={report}
        onShowToast={showToast}
      />

      {/* Admin User Management Modal */}
      <UserManagementModal
        isOpen={isUsersModalOpen}
        onClose={() => setIsUsersModalOpen(false)}
        onShowToast={showToast}
      />

      {/* Saved Reports from Cloud SQL Modal */}
      <SavedReportsModal
        isOpen={isSavedReportsModalOpen}
        onClose={() => setIsSavedReportsModalOpen(false)}
        onLoadReport={(loadedReport) => {
          setReport(normalizeReport(loadedReport));
          setIsSaved(true);
        }}
        onShowToast={showToast}
      />

      {/* AI Processing Modal */}
      <AIAnalyzerModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onAnalyze={handleAnalyzeWithAI}
        isLoading={isAIAnalyzing}
      />

      {/* Signature Canvas Modal */}
      <SignatureCanvasModal
        isOpen={signatureRole !== null}
        roleTitle={
          signatureRole === 'elaborado_por'
            ? 'Elaborado por (Técnico Electricista)'
            : signatureRole === 'revisado_por'
            ? 'Revisado y Corregido por (Ingeniero de Servicio)'
            : 'Aprobado por (Coordinador de Servicio)'
        }
        onClose={() => setSignatureRole(null)}
        onSaveSignature={handleSaveSignatureRole}
      />

      {/* Multi-Format Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        report={report}
        onShowToast={showToast}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 text-slate-600 py-6 text-center text-xs no-print mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-2">
          <span className="font-semibold">Consorcio de Cogestión Venequip, S.A. • Sistema de Informes Técnicos</span>
          <span className="text-slate-500 font-medium">Google Drive • Google Sheets • Google Docs • Gmail • Cloud SQL</span>
        </div>
      </footer>

    </div>
  );
}

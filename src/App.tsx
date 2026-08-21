import React, { useState, useEffect, useRef } from 'react';
import { InformeTecnico, OnlineUserPresence, EquipmentFleetRecord } from './types';
import { DEFAULT_REPORT, SAMPLE_REPORT } from './defaultReport';
import { normalizeReport } from './reportUtils';
import { Header } from './Header';
import { ReportEditor } from './ReportEditor';
import { ReportPreview } from './ReportPreview';
import { PredictiveMaintenanceView } from './PredictiveMaintenanceView';
import { AIAnalyzerModal } from './AIAnalyzerModal';
import { SignatureCanvasModal } from './SignatureCanvasModal';
import { ExportModal } from './ExportModal';
import { WorkspaceSyncModal } from './WorkspaceSyncModal';
import { UserManagementModal } from './UserManagementModal';
import { SavedReportsModal } from './SavedReportsModal';
import { AdminDashboardModal } from './AdminDashboardModal';
import { ModernDashboards } from './ModernDashboards';
import { LoginScreen } from './LoginScreen';
import { CatDtcDecoderModal } from './CatDtcDecoderModal';
import { CatSosFluidAnalyzerModal } from './CatSosFluidAnalyzerModal';
import { CatGeneratorCalculatorModal } from './CatGeneratorCalculatorModal';
import { CatVoiceDictationModal } from './CatVoiceDictationModal';
import { CatTemplatesModal, CatReportTemplate } from './CatTemplatesModal';
import { exportDocumentToPDF } from './pdfExporter';
import { uploadExcelReportToDrive } from './googleWorkspace';
import { 
  saveStoredReport, 
  seedAllDataToFirebase, 
  subscribeToReports, 
  subscribeToUsers,
  getStoredReports,
  getRemoteUsers
} from './databaseManager';
import { 
  startPresenceHeartbeat, 
  subscribeToOnlinePresence, 
  saveAppStateToFirestore, 
  subscribeToFleetState, 
  saveFleetToFirestore, 
  getCachedOnlineUsers 
} from './presenceManager';
import { buildFleetFromReports } from './catMaintenanceEngine';
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
  BarChart3,
  Wrench
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { useFirebaseConnection } from './FirebaseConnectionContext';
import { analyzeReportUniversal, polishSectionUniversal } from './geminiService';
import { WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';

export default function App() {
  const { user, userProfile, isAuthenticated, isAdmin, accessToken, loading } = useAuth();
  const { status: firebaseStatus, isOnline, pendingSyncCount, reconnectNow } = useFirebaseConnection();

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

  const [activeView, setActiveView] = useState<'editor' | 'preview' | 'fleet' | 'dashboard'>('editor');
  const [isSaved, setIsSaved] = useState(true);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  
  // Real-time Online Users Presence
  const [onlineUsers, setOnlineUsers] = useState<OnlineUserPresence[]>(() => getCachedOnlineUsers());

  // Equipment Fleet for Caterpillar Predictive Maintenance
  const [fleet, setFleet] = useState<EquipmentFleetRecord[]>(() => {
    const cached = localStorage.getItem('venequip_equipment_fleet_cache');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {}
    }
    return [];
  });

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

  // Caterpillar Intelligence Tool Modals
  const [isDtcModalOpen, setIsDtcModalOpen] = useState(false);
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);
  const [isGenCalcModalOpen, setIsGenCalcModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);

  const [signatureRole, setSignatureRole] = useState<'elaborado_por' | 'revisado_por' | 'aprobado_por' | null>(null);
  const [isPolishingSection, setIsPolishingSection] = useState<string | null>(null);

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Synchronize and seed Firebase on application startup
  useEffect(() => {
    const initFirebaseData = async () => {
      try {
        await seedAllDataToFirebase();
        await getRemoteUsers();
        const initialReports = await getStoredReports();
        
        // Build fleet from initial reports if available
        if (initialReports && initialReports.length > 0) {
          const generatedFleet = buildFleetFromReports(initialReports);
          setFleet(generatedFleet);
        }
      } catch (err) {
        console.log('Initial sync notice:', err);
      }
    };
    initFirebaseData();

    // Listen to real-time updates for reports and users from Cloud Firestore
    const unsubReports = subscribeToReports((updatedReports) => {
      if (updatedReports && updatedReports.length > 0) {
        const updatedFleet = buildFleetFromReports(updatedReports);
        setFleet(updatedFleet);
      }
    });

    const unsubUsers = subscribeToUsers((updatedUsers) => {
      console.log('Real-time users updated:', updatedUsers.length);
    });

    // Real-time Online Users Presence Listener
    const unsubPresence = subscribeToOnlinePresence((users) => {
      setOnlineUsers(users);
    });

    // Real-time Fleet State Listener
    const unsubFleet = subscribeToFleetState((fleetRecords) => {
      if (fleetRecords && fleetRecords.length > 0) {
        setFleet(fleetRecords);
      }
    });

    return () => {
      unsubReports();
      unsubUsers();
      unsubPresence();
      unsubFleet();
    };
  }, []);

  // Real-time Online User Presence Heartbeat when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const cleanupHeartbeat = startPresenceHeartbeat(
      {
        email: user.email || '',
        name: userProfile?.name || user.displayName || user.email?.split('@')[0] || 'Técnico Venequip',
        role: userProfile?.role || (isAdmin ? 'admin' : 'technician'),
        uid: user.uid
      },
      () => activeView,
      () => report.encabezado_venequip?.numero_servicio || ''
    );

    return () => {
      cleanupHeartbeat();
    };
  }, [isAuthenticated, user, userProfile, isAdmin, activeView, report.encabezado_venequip?.numero_servicio]);

  // Optimized background save to Cloud Firestore and backend without blocking typing
  const syncReportBackground = async (currentReport: InformeTecnico, syncDrive: boolean = false) => {
    // 1. Save to Cloud Firestore & local resilience engine
    try {
      await saveStoredReport(currentReport);
    } catch (fsErr) {
      // Background non-blocking
    }

    // 2. Save to Express / Local API asynchronously
    try {
      fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportData: currentReport,
          createdByUid: user?.uid,
        }),
      }).catch(() => {});
    } catch (err) {}

    // 3. Drive sync only when explicitly requested (e.g. manual save) to keep editor 100% smooth
    if (syncDrive && accessToken) {
      setDriveSyncStatus('saving');
      try {
        const driveResult = await uploadExcelReportToDrive(accessToken, currentReport);
        setDriveSyncStatus('synced');

        fetch('/api/sync-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'AUTO_SYNC_EXCEL',
            description: `Auto-guardado de informe ${currentReport.encabezado_venequip?.numero_servicio || ''} en Google Drive (Excel)`,
            userEmail: user?.email,
            fileUrl: driveResult.webViewLink,
          }),
        }).catch(() => {});
      } catch (driveErr) {
        setDriveSyncStatus('offline');
      }
    }
  };

  // Change handler with instant local caching and lightweight debounced background sync
  const handleReportChange = (updated: InformeTecnico) => {
    const normalized = normalizeReport(updated);
    setReport(normalized);
    setIsSaved(false);

    // Save draft locally immediately (0ms latency)
    try {
      localStorage.setItem('venequip_report_draft', JSON.stringify(normalized));
    } catch (e) {}

    // Debounced remote background sync (3.5s of typing inactivity)
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(() => {
      setIsSaved(true);
      syncReportBackground(normalized, false);
    }, 3500);
  };

  const handleSaveDraft = async () => {
    localStorage.setItem('venequip_report_draft', JSON.stringify(report));
    setIsSaved(true);
    showToast('Borrador guardado exitosamente.');
    await syncReportBackground(report, true);
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

  // Quick-create or update report from predictive maintenance fleet selection
  const handleSelectEquipmentToReport = (eq: EquipmentFleetRecord) => {
    const nextLevel = eq.nextRecommendedMaintenance.level;
    const targetHours = eq.nextRecommendedMaintenance.targetHorometro;
    const recommendedKits = eq.nextRecommendedMaintenance.recommendedKit;
    const fluidSamples = eq.nextRecommendedMaintenance.fluidSamples;

    const newActividad = `MANTENIMIENTO PREVENTIVO PROGRAMADO ${nextLevel} (HORÓMETRO META: ${targetHours} HORAS)`;
    const newSol = `Se solicita a Consorcio Venequip S.A. la ejecución del servicio de mantenimiento preventivo ${nextLevel} para el equipo ${eq.modelo || 'Caterpillar'} (Serial: ${eq.serial_equipo || 'N/A'}) perteneciente al cliente ${eq.cliente || 'N/A'} con horómetro actual registrado de ${eq.lastHorometro} horas acumuladas.`;
    const newRec = `1. Ejecutar el protocolo estándar de mantenimiento preventivo ${nextLevel} a las ${targetHours} horas.\n2. Sustituir los kits de filtros recomendados por el fabricante: ${recommendedKits?.join(', ') || 'Filtros originales Cat'}.\n3. Tomar muestras de fluidos SOS (${fluidSamples?.join(', ') || 'Aceite de motor, refrigerante'}).\n4. Próxima inspección programada a las ${targetHours + 250} horas.`;

    const updated = {
      ...report,
      encabezado_venequip: {
        ...report.encabezado_venequip,
        cliente: eq.cliente || report.encabezado_venequip.cliente,
        modelo: eq.modelo || report.encabezado_venequip.modelo,
        serial_equipo: eq.serial_equipo || report.encabezado_venequip.serial_equipo,
        horas_motor: `${eq.lastHorometro} Hrs`,
        ubicacion: eq.localizacion || report.encabezado_venequip.ubicacion,
        actividad: newActividad
      },
      secciones_informe: {
        ...report.secciones_informe,
        "1_solicitud_cliente": newSol,
        "6_conclusiones_recomendaciones": newRec
      }
    };

    handleReportChange(updated);
    setActiveView('editor');
    showToast(`Plantilla de Mantenimiento Preventivo ${nextLevel} cargada para equipo ${eq.serial_equipo || eq.modelo}`);
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
        onlineUsers={onlineUsers}
      />

      {/* Offline Mode Persistent Resilience Banner */}
      {(firebaseStatus === 'disconnected' || !isOnline) && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold border-b border-amber-600 shadow-md no-print flex items-center justify-between">
          <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <WifiOff className="w-4 h-4 text-slate-950 shrink-0" />
              <span>
                <strong>Modo Offline Activo:</strong> Se perdió la conexión con Firebase Firestore. Puedes seguir redactando y editando normalmente; tus cambios se guardan en tu equipo y se sincronizarán solos con la nube al reconectar.
              </span>
              {pendingSyncCount > 0 && (
                <span className="bg-slate-900 text-amber-400 px-2 py-0.5 rounded-full text-[10px] font-black shrink-0">
                  {pendingSyncCount} {pendingSyncCount === 1 ? 'pendiente' : 'pendientes'}
                </span>
              )}
            </div>
            <button
              onClick={() => reconnectNow()}
              className="bg-slate-950 hover:bg-slate-900 text-white text-[11px] px-3 py-1 rounded-lg font-black shrink-0 flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 text-amber-400" />
              <span>Reintentar Conexión</span>
            </button>
          </div>
        </div>
      )}

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
            onOpenDtcModal={() => setIsDtcModalOpen(true)}
            onOpenSosModal={() => setIsSosModalOpen(true)}
            onOpenGenCalcModal={() => setIsGenCalcModalOpen(true)}
            onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
            onOpenTemplatesModal={() => setIsTemplatesModalOpen(true)}
          />
        ) : activeView === 'preview' ? (
          <ReportPreview
            report={report}
            onOpenExportModal={() => setIsExportModalOpen(true)}
          />
        ) : activeView === 'fleet' ? (
          <PredictiveMaintenanceView
            fleet={fleet}
            onSelectEquipmentToReport={handleSelectEquipmentToReport}
            onRefreshFleet={async () => {
              const freshReports = await getStoredReports();
              if (freshReports && freshReports.length > 0) {
                const generated = buildFleetFromReports(freshReports);
                setFleet(generated);
                saveFleetToFirestore(generated);
              }
            }}
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
        currentReport={report}
        onInsertTechnicalText={(sectionKey, text) => {
          setReport(prev => {
            const currentSectionText = (prev.secciones_informe as any)?.[sectionKey] || '';
            const updatedSections = {
              ...prev.secciones_informe,
              [sectionKey]: `${currentSectionText}${text}`
            };
            const updated = {
              ...prev,
              secciones_informe: updatedSections
            };
            handleReportChange(updated);
            return updated;
          });
          showToast('Cálculo electromecánico insertado en el informe');
        }}
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

      {/* Caterpillar DTC Diagnostic Trouble Code Decoder Modal */}
      <CatDtcDecoderModal
        isOpen={isDtcModalOpen}
        onClose={() => setIsDtcModalOpen(false)}
        onInsertDtcText={(diagnosticText, suggestedTools) => {
          setReport(prev => {
            const currentSectionText = prev.secciones_informe["4_fallas_detectadas"] || '';
            const updatedSection4 = currentSectionText 
              ? `${currentSectionText}\n\n[DIAGNÓSTICO CATERPILLAR ELECTRONIC TECHNICIAN (CAT ET)]:\n${diagnosticText}`
              : `[DIAGNÓSTICO CATERPILLAR ELECTRONIC TECHNICIAN (CAT ET)]:\n${diagnosticText}`;
            
            // Add suggested tools if not already present
            const existingTools = [...prev.secciones_informe.herramientas_utilizadas];
            suggestedTools.forEach(newT => {
              const alreadyExists = existingTools.some(t => t.numero_parte === newT.numero_parte);
              if (!alreadyExists) {
                existingTools.push(newT);
              }
            });

            const updated: InformeTecnico = {
              ...prev,
              secciones_informe: {
                ...prev.secciones_informe,
                "4_fallas_detectadas": updatedSection4,
                herramientas_utilizadas: existingTools
              }
            };
            handleReportChange(updated);
            return updated;
          });
          showToast('Código de Falla CAT decodificado e insertado en Sección 4');
        }}
      />

      {/* Caterpillar S.O.S. Fluid Analysis Modal */}
      <CatSosFluidAnalyzerModal
        isOpen={isSosModalOpen}
        onClose={() => setIsSosModalOpen(false)}
        onInsertReport={(sosText) => {
          setReport(prev => {
            const currentSec6 = prev.secciones_informe["6_conclusiones_recomendaciones"] || '';
            const updatedSec6 = currentSec6
              ? `${currentSec6}\n\n[RESULTADOS DE LABORATORIO S.O.S. CATERPILLAR]:\n${sosText}`
              : `[RESULTADOS DE LABORATORIO S.O.S. CATERPILLAR]:\n${sosText}`;

            const updated: InformeTecnico = {
              ...prev,
              secciones_informe: {
                ...prev.secciones_informe,
                "6_conclusiones_recomendaciones": updatedSec6
              }
            };
            handleReportChange(updated);
            return updated;
          });
          showToast('Evaluación S.O.S. de fluidos insertada en Conclusiones y Recomendaciones');
        }}
      />

      {/* Caterpillar Generator Electrical & Load Bank Calculator Modal */}
      <CatGeneratorCalculatorModal
        isOpen={isGenCalcModalOpen}
        onClose={() => setIsGenCalcModalOpen(false)}
        onInsertCalculations={(calcText) => {
          setReport(prev => {
            const currentSec3 = prev.secciones_informe["3_actividades_efectuadas"] || '';
            const updatedSec3 = currentSec3
              ? `${currentSec3}\n\n[REGISTRO DE MEDICIONES ELÉCTRICAS Y CARGA CAT]:\n${calcText}`
              : `[REGISTRO DE MEDICIONES ELÉCTRICAS Y CARGA CAT]:\n${calcText}`;

            const updated: InformeTecnico = {
              ...prev,
              secciones_informe: {
                ...prev.secciones_informe,
                "3_actividades_efectuadas": updatedSec3
              }
            };
            handleReportChange(updated);
            return updated;
          });
          showToast('Mediciones y cálculos del generador insertados en Sección 3');
        }}
      />

      {/* Caterpillar Technical Hands-Free Voice Dictation Modal */}
      <CatVoiceDictationModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onInsertText={(targetSection, textToInsert) => {
          setReport(prev => {
            const currentSecText = (prev.secciones_informe as any)[targetSection] || '';
            const updatedSecText = currentSecText
              ? `${currentSecText}\n${textToInsert}`
              : textToInsert;

            const updated: InformeTecnico = {
              ...prev,
              secciones_informe: {
                ...prev.secciones_informe,
                [targetSection]: updatedSecText
              }
            };
            handleReportChange(updated);
            return updated;
          });
          showToast('Dictado por voz incorporado con normalización técnica Caterpillar');
        }}
      />

      {/* Caterpillar Standard Report Templates Modal */}
      <CatTemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        onApplyTemplate={(template) => {
          setReport(prev => {
            const merged: InformeTecnico = {
              ...prev,
              encabezado_venequip: {
                ...prev.encabezado_venequip,
                ...(template.data.encabezado_venequip || {}),
                // Preserve current user details or location if already filled
                cliente: prev.encabezado_venequip.cliente || template.data.encabezado_venequip?.cliente || '',
                localizacion: prev.encabezado_venequip.localizacion || template.data.encabezado_venequip?.localizacion || '',
                serial_equipo: prev.encabezado_venequip.serial_equipo || template.data.encabezado_venequip?.serial_equipo || '',
                serial_motor: prev.encabezado_venequip.serial_motor || template.data.encabezado_venequip?.serial_motor || '',
                horas_motor: prev.encabezado_venequip.horas_motor || template.data.encabezado_venequip?.horas_motor || '250',
                fecha: new Date().toISOString().split('T')[0]
              },
              secciones_informe: {
                ...prev.secciones_informe,
                ...(template.data.secciones_informe || {})
              }
            };
            handleReportChange(merged);
            return merged;
          });
          showToast(`Plantilla oficial "${template.title}" aplicada con éxito`);
        }}
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

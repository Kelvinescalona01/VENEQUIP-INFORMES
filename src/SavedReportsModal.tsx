import React, { useState, useEffect } from 'react';
import { 
  FolderClock, 
  ExternalLink, 
  Trash2, 
  Download, 
  RefreshCw, 
  X, 
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  Building2,
  Cpu,
  Cloud
} from 'lucide-react';
import { InformeTecnico } from './types';
import { getStoredReports, deleteStoredReport, subscribeToReports } from './databaseManager';

interface SavedReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadReport: (report: InformeTecnico) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SavedReportsModal: React.FC<SavedReportsModalProps> = ({
  isOpen,
  onClose,
  onLoadReport,
  onShowToast,
}) => {
  const [reports, setReports] = useState<InformeTecnico[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const stored = await getStoredReports();
      setReports(stored);
    } catch (err) {
      console.error('Error fetching saved reports:', err);
      onShowToast('Error al cargar informes guardados.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchReports();
      const unsubscribe = subscribeToReports((liveReports) => {
        if (liveReports && liveReports.length > 0) {
          setReports(liveReports);
        }
      });
      return () => unsubscribe();
    }
  }, [isOpen]);

  const handleSelectReport = (report: InformeTecnico) => {
    try {
      onLoadReport(report);
      onShowToast(`Informe N° ${report.encabezado_venequip?.numero_servicio || 'S/N'} cargado en el editor.`, 'success');
      onClose();
    } catch (err) {
      console.error('Error loading report data:', err);
      onShowToast('Error cargando los datos del informe.', 'error');
    }
  };

  const handleDeleteReport = async (numServicio: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar el informe ${numServicio}?`)) {
      return;
    }
    try {
      await deleteStoredReport(numServicio);
      onShowToast('Informe eliminado de la base de datos.', 'info');
      fetchReports();
    } catch (err) {
      console.error('Error deleting report:', err);
      onShowToast('Error al eliminar el informe.', 'error');
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
              <FolderClock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Informes Técnicos Guardados</h2>
              <p className="text-xs text-slate-400">
                Google Cloud Firestore & Google Drive • Sincronización en Tiempo Real
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
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-600">
              Selecciona cualquier informe para cargarlo en el editor, reutilizar sus datos o continuar editándolo.
            </p>
            <button
              onClick={fetchReports}
              disabled={loading}
              className="flex items-center space-x-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map((r, i) => {
              const enc = r.encabezado_venequip || {} as any;
              const numServ = enc.numero_servicio || `REP-${i + 1}`;
              return (
                <div
                  key={numServ + i}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-4 hover:border-amber-400 hover:shadow-md transition"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="rounded bg-amber-500/20 text-amber-900 font-bold px-2 py-0.5 text-[11px]">
                          N° {numServ}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm mt-1">
                          {enc.cliente || 'Cliente no especificado'}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                        <Cloud className="w-3.5 h-3.5" />
                        <span>Online</span>
                      </div>
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Cpu className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          {enc.modelo_equipo || 'Equipo'} • Serial: {enc.serial_equipo || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <span>Sucursal: {enc.sucursal || 'Central'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          Fecha: {enc.fecha || '-'} • Horas: {enc.horas_motor || '0'} hrs
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
                    <button
                      onClick={() => handleDeleteReport(numServ)}
                      className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                      title="Eliminar registro"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => handleSelectReport(r)}
                      className="flex items-center space-x-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Cargar en Editor</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {reports.length === 0 && !loading && (
              <div className="col-span-2 rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-400 text-xs">
                No hay informes guardados aún en la base de datos en línea Firestore.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3 text-xs text-slate-500">
          <span>Base de datos en línea Cloud Firestore y Google Drive activa.</span>
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

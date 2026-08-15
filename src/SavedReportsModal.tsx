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
  Cpu
} from 'lucide-react';
import { InformeTecnico } from './types';

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
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      if (data.success) {
        setReports(data.reports);
      }
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
    }
  }, [isOpen]);

  const handleSelectReport = (reportRow: any) => {
    try {
      const parsedData = typeof reportRow.reportData === 'string' 
        ? JSON.parse(reportRow.reportData) 
        : reportRow.reportData;

      onLoadReport(parsedData);
      onShowToast(`Informe N° ${reportRow.numeroServicio || 'S/N'} cargado en el editor.`, 'success');
      onClose();
    } catch (err) {
      console.error('Error parsing report data:', err);
      onShowToast('Error cargando los datos del informe.', 'error');
    }
  };

  const handleDeleteReport = async (id: number, numServicio: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar el informe ${numServicio}?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/reports/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onShowToast('Informe eliminado de la base de datos.', 'info');
        fetchReports();
      }
    } catch (err) {
      console.error('Error deleting report:', err);
      onShowToast('Error eliminando informe.', 'error');
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
                Cloud SQL & Google Drive • Reutilización de Datos de Inspección
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
              className="flex items-center space-x-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map((r) => (
              <div
                key={r.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-4 hover:border-amber-400 hover:shadow-md transition"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="rounded bg-amber-500/20 text-amber-900 font-bold px-2 py-0.5 text-[11px]">
                        N° {r.numeroServicio || 'S/N'}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-1">
                        {r.cliente || 'Cliente no especificado'}
                      </h4>
                    </div>
                    {r.driveFileUrl && (
                      <a
                        href={r.driveFileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 hover:text-emerald-700 p-1"
                        title="Ver en Google Drive"
                      >
                        <FileSpreadsheet className="h-5 w-5" />
                      </a>
                    )}
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Cpu className="h-3.5 w-3.5 text-slate-400" />
                      <span>
                        {r.modelo || 'Equipo'} • Serial: {r.serialEquipo || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-slate-400" />
                      <span>Sucursal: {r.sucursal || 'Central'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>
                        Fecha: {r.fecha || '-'} • Guardado:{' '}
                        {r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : ''}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
                  <button
                    onClick={() => handleDeleteReport(r.id, r.numeroServicio)}
                    className="p-1 text-slate-400 hover:text-red-600 transition"
                    title="Eliminar registro"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => handleSelectReport(r)}
                    className="flex items-center space-x-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Cargar en Editor</span>
                  </button>
                </div>
              </div>
            ))}

            {reports.length === 0 && !loading && (
              <div className="col-span-2 rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-400 text-xs">
                No hay informes guardados aún en la base de datos Cloud SQL.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3 text-xs text-slate-500">
          <span>Base de datos relacional de informes Venequip activa.</span>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-2 font-bold text-white hover:bg-slate-800 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

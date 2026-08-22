import React from 'react';
import { InformeTecnico } from './types';
import { normalizeReport } from './reportUtils';
import { 
  exportToPDF, 
  exportToWord, 
  exportToJSON, 
  exportToHTML, 
  exportToText,
  exportToExcel 
} from './documentExporters';
import { 
  X, 
  FileText, 
  FileType, 
  Code, 
  Globe, 
  FileCode2, 
  CheckCircle2, 
  Download,
  Building2,
  FileSpreadsheet
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: InformeTecnico;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  report: rawReport,
  onShowToast
}) => {
  if (!isOpen) return null;

  const report = normalizeReport(rawReport);
  const numServicio = report?.encabezado_venequip?.numero_servicio || '6305';
  const baseFilename = `Informe_Servicio_Venequip_${numServicio}`;

  const handleExport = async (format: 'pdf' | 'word' | 'excel' | 'json' | 'html' | 'txt') => {
    try {
      if (format === 'pdf') {
        onShowToast('Generando PDF oficial Venequip...', 'info');
        await exportToPDF('venequip-official-document', `${baseFilename}.pdf`);
        onShowToast('Documento PDF generado y descargado.');
      } else if (format === 'word') {
        onShowToast('Generando documento Word (.docx) con fotos y firmas embebidas...', 'info');
        await exportToWord(report, `${baseFilename}.docx`);
        onShowToast('Documento editable Microsoft Word (.docx) generado exitosamente.');
      } else if (format === 'excel') {
        onShowToast('Generando hoja de cálculo Microsoft Excel (.xlsx)...', 'info');
        exportToExcel(report, `${baseFilename}.xlsx`);
        onShowToast('Hoja de cálculo Excel (.xlsx) generada y descargada.');
      } else if (format === 'json') {
        exportToJSON(report, `${baseFilename}.json`);
        onShowToast('Archivo de datos JSON descargado.');
      } else if (format === 'html') {
        exportToHTML(report, `${baseFilename}.html`);
        onShowToast('Página web autónoma HTML generada.');
      } else if (format === 'txt') {
        exportToText(report, `${baseFilename}.txt`);
        onShowToast('Reporte en formato de texto técnico descargado.');
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      onShowToast(`Error al exportar en formato ${format.toUpperCase()}: ${err.message}`, 'error');
    }
  };

  return (
    <div id="modal-export-backdrop" className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#18181B] border-2 border-[#FFC20E] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl space-y-0 text-slate-100">
        
        {/* Header */}
        <div className="bg-[#121212] p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-[#FFC20E] text-black p-2 rounded-lg font-black border border-[#FFCD00] shadow">
              <Download className="w-5 h-5 text-black" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white uppercase tracking-wide">
                Exportar Informe N° {numServicio}
              </h3>
              <p className="text-xs text-zinc-400">Selecciona el formato de archivo deseado para descarga</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formats Grid */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 gap-3">
            
            {/* 1. PDF */}
            <button
              id="btn-export-format-pdf"
              onClick={() => handleExport('pdf')}
              className="group p-4 bg-[#242427] hover:bg-[#2A2A2E] border border-zinc-700 hover:border-[#FFC20E] rounded-xl flex items-center justify-between transition-all text-left shadow-sm"
            >
              <div className="flex items-center space-x-3.5">
                <div className="bg-rose-500/20 text-rose-400 p-2.5 rounded-lg border border-rose-500/30 group-hover:scale-105 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-sm text-white flex items-center gap-2">
                    Documento PDF (.pdf)
                    <span className="bg-[#FFC20E] text-black text-[10px] font-extrabold px-2 py-0.5 rounded">Oficial</span>
                  </div>
                  <p className="text-xs text-zinc-400">Formato corporativo oficial de alta resolución listo para imprimir o enviar al cliente</p>
                </div>
              </div>
              <Download className="w-5 h-5 text-zinc-500 group-hover:text-[#FFC20E] transition-colors" />
            </button>

            {/* 2. Word */}
            <button
              id="btn-export-format-word"
              onClick={() => handleExport('word')}
              className="group p-4 bg-[#242427] hover:bg-[#2A2A2E] border border-zinc-700 hover:border-[#FFC20E] rounded-xl flex items-center justify-between transition-all text-left shadow-sm"
            >
              <div className="flex items-center space-x-3.5">
                <div className="bg-blue-500/20 text-blue-400 p-2.5 rounded-lg border border-blue-500/30 group-hover:scale-105 transition-transform">
                  <FileType className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-sm text-white flex items-center gap-2">
                    Microsoft Word (.doc / .docx)
                    <span className="bg-blue-500/30 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded">Editable</span>
                  </div>
                  <p className="text-xs text-zinc-400">Documento editable con tablas, logos y firmas para MS Word, Google Docs o LibreOffice</p>
                </div>
              </div>
              <Download className="w-5 h-5 text-zinc-500 group-hover:text-[#FFC20E] transition-colors" />
            </button>

            {/* 3. Excel */}
            <button
              id="btn-export-format-excel"
              onClick={() => handleExport('excel')}
              className="group p-4 bg-[#242427] hover:bg-[#2A2A2E] border border-zinc-700 hover:border-emerald-400 rounded-xl flex items-center justify-between transition-all text-left shadow-sm"
            >
              <div className="flex items-center space-x-3.5">
                <div className="bg-emerald-500/20 text-emerald-400 p-2.5 rounded-lg border border-emerald-500/30 group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-sm text-white flex items-center gap-2">
                    Microsoft Excel (.xlsx)
                    <span className="bg-emerald-500/30 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded font-mono">Tablas & Datos</span>
                  </div>
                  <p className="text-xs text-zinc-400">Libro de cálculo multi-hoja compatible con Excel, Google Sheets y Drive</p>
                </div>
              </div>
              <Download className="w-5 h-5 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
            </button>

            {/* 4. HTML */}
            <button
              id="btn-export-format-html"
              onClick={() => handleExport('html')}
              className="group p-4 bg-[#242427] hover:bg-[#2A2A2E] border border-zinc-700 hover:border-[#FFC20E] rounded-xl flex items-center justify-between transition-all text-left shadow-sm"
            >
              <div className="flex items-center space-x-3.5">
                <div className="bg-emerald-500/20 text-emerald-400 p-2.5 rounded-lg border border-emerald-500/30 group-hover:scale-105 transition-transform">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-sm text-white flex items-center gap-2">
                    Página Web Autónoma (.html)
                  </div>
                  <p className="text-xs text-zinc-400">Archivo HTML completo con hojas de estilo autónomas para visualizar en navegador</p>
                </div>
              </div>
              <Download className="w-5 h-5 text-zinc-500 group-hover:text-[#FFC20E] transition-colors" />
            </button>

            {/* 5. TXT */}
            <button
              id="btn-export-format-txt"
              onClick={() => handleExport('txt')}
              className="group p-4 bg-[#242427] hover:bg-[#2A2A2E] border border-zinc-700 hover:border-[#FFC20E] rounded-xl flex items-center justify-between transition-all text-left shadow-sm"
            >
              <div className="flex items-center space-x-3.5">
                <div className="bg-purple-500/20 text-purple-400 p-2.5 rounded-lg border border-purple-500/30 group-hover:scale-105 transition-transform">
                  <FileCode2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-bold text-sm text-white flex items-center gap-2">
                    Texto Técnico / Markdown (.txt)
                  </div>
                  <p className="text-xs text-zinc-400">Reporte estructurado en texto plano ideal para terminales, notas y registros de auditoría</p>
                </div>
              </div>
              <Download className="w-5 h-5 text-zinc-500 group-hover:text-[#FFC20E] transition-colors" />
            </button>

          </div>

          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-[#FFC20E]" />
              Consorcio de Cogestión Venequip, S.A.
            </span>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white px-3 py-1 font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

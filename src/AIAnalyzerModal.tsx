import React, { useState, useRef } from 'react';
import { Sparkles, Upload, FileText, AlertCircle, X, Loader2, Image as ImageIcon, Camera } from 'lucide-react';

interface AIAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (files: { data: string; mimeType: string; name: string }[], rawNotes: string, instructions: string) => Promise<void>;
  isLoading: boolean;
}

export const AIAnalyzerModal: React.FC<AIAnalyzerModalProps> = ({
  isOpen,
  onClose,
  onAnalyze,
  isLoading
}) => {
  const [rawNotes, setRawNotes] = useState('');
  const [userInstructions, setUserInstructions] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<{ data: string; mimeType: string; name: string }[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processFiles = (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    files.forEach((file: File) => {
      // Validate supported mime types or extensions
      const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|bmp|heic|heif)$/i.test(file.name);
      const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);

      if (!isImage && !isPdf) {
        setErrorMsg(`El archivo ${file.name} no es una imagen o PDF compatible.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const resultStr = event.target.result as string;
          setAttachedFiles((prev) => [
            ...prev,
            {
              name: file.name,
              mimeType: file.type || (isPdf ? 'application/pdf' : 'image/jpeg'),
              data: resultStr
            }
          ]);
        }
      };
      reader.onerror = () => {
        setErrorMsg(`Error al leer el archivo ${file.name}`);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (attachedFiles.length === 0 && !rawNotes.trim()) {
      setErrorMsg('Por favor adjunta al menos una constancia/foto o escribe notas de campo para procesar.');
      return;
    }
    setErrorMsg(null);
    try {
      await onAnalyze(attachedFiles, rawNotes, userInstructions);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error procesando los insumos con IA Gemini. Verifica tu conexión a internet.');
    }
  };

  return (
    <div 
      id="modal-ai-analyzer-backdrop" 
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-0 my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-slate-950 px-4 py-3.5 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-400/20 text-amber-300 p-2 rounded-lg border border-amber-400/30 shrink-0">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Motor de Ingesta & OCR IA</span>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-mono font-medium">Gemini 3.7</span>
              </h3>
              <p className="text-xs text-slate-400 hidden sm:block">Extrae metadatos, OCR de constancias y reescribe al estándar técnico Venequip</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
          
          {errorMsg && (
            <div className="bg-rose-950/60 border border-rose-700/60 p-3 rounded-lg text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="flex-1">{errorMsg}</span>
            </div>
          )}

          {/* Drag & Drop File Upload Area */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              1. Cargar Archivos Insumo (Constancias físicas, fotos de placa/mediciones, PDF)
            </label>
            
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 sm:p-6 text-center transition-all cursor-pointer relative group ${
                isDragging 
                  ? 'border-amber-400 bg-amber-400/10 scale-[0.99]' 
                  : 'border-slate-700 hover:border-amber-400/60 bg-slate-950/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
                disabled={isLoading}
                className="hidden"
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="bg-slate-800 p-3 rounded-full text-amber-400 group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="text-xs sm:text-sm text-slate-200 font-medium">
                  Toca para seleccionar o arrastra fotos y constancias de servicio
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Compatible con JPG, PNG, WEBP, PDF en móvil y escritorio</span>
              </div>
            </div>

            {/* File List */}
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {attachedFiles.map((file, idx) => (
                  <div key={idx} className="bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded-md flex items-center gap-2">
                    <ImageIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate max-w-[140px] sm:max-w-[200px] font-mono">{file.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(idx);
                      }}
                      disabled={isLoading}
                      className="text-slate-400 hover:text-rose-400 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Raw Text / Notes */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              2. Notas de Campo preliminares / Texto escueto (Opcional)
            </label>
            <textarea
              rows={3}
              placeholder="Ejemplo: Se atendió generador Generac en Las Mercedes. Voltaje medido 220V, aterramiento 17.6 ohm. Se reprogramó módulo Evolution..."
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value)}
              disabled={isLoading}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs sm:text-sm rounded-xl p-3 focus:border-amber-400 focus:outline-none leading-relaxed"
            />
          </div>

          {/* Special Instructions */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              3. Indicaciones o Correcciones Adicionales (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ejemplo: Asegurar incluir recomendación de revisión mensual de presión de gas."
              value={userInstructions}
              onChange={(e) => setUserInstructions(e.target.value)}
              disabled={isLoading}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs sm:text-sm rounded-xl p-2.5 sm:p-3 focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="text-xs text-slate-400 hover:text-white px-3 sm:px-4 py-2 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm px-4 sm:px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg transition-all border border-amber-300 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Procesando con Gemini IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>Generar Informe con IA</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};


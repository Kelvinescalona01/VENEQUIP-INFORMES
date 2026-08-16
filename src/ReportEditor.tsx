import React, { useState } from 'react';
import { InformeTecnico, Herramienta, RegistroFotografico } from './types';
import { normalizeReport } from './reportUtils';
import { convertUrlToBase64DataUrl } from './imageUtils';
import { getSampleInspectionPhoto1, getSampleInspectionPhoto2 } from './sampleImages';
import { getDefaultSignatureDataUrl } from './logoUtils';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  PenTool, 
  Wrench, 
  UserCheck, 
  FileCheck2, 
  Building, 
  Upload,
  RefreshCw,
  Eraser,
  Link as LinkIcon,
  Zap,
  CheckCircle2,
  Sliders
} from 'lucide-react';
import { 
  calculateNextCATMaintenance, 
  CAT_MAINTENANCE_CONFIGS, 
  detectMaintenanceLevelFromText 
} from './catMaintenanceEngine';

interface ReportEditorProps {
  report: InformeTecnico;
  onChange: (updated: InformeTecnico) => void;
  onOpenSignatureCanvas: (role: 'elaborado_por' | 'revisado_por' | 'aprobado_por') => void;
  onPolishSection: (sectionName: string, currentText: string, callback: (newText: string) => void) => void;
  isPolishingSection?: string | null;
}

export const ReportEditor: React.FC<ReportEditorProps> = ({
  report: rawReport,
  onChange,
  onOpenSignatureCanvas,
  onPolishSection,
  isPolishingSection
}) => {
  const report = normalizeReport(rawReport);
  const [activeTab, setActiveTab] = useState<'encabezado' | 'secciones' | 'herramientas' | 'fotografico' | 'firmas'>('encabezado');

  // Helpers for clear functions
  const handleClearHeader = () => {
    onChange({
      ...report,
      encabezado_venequip: {
        empresa: 'CONSORCIO DE COGESTIÓN VENEQUIP',
        rif: 'J404644865',
        sucursal: '',
        fecha: '',
        numero_servicio: '',
        actividad: '',
        cliente: '',
        localizacion: '',
        fabricante: '',
        modelo: '',
        serial_equipo: '',
        serial_motor: '',
        horas_motor: '',
        horas_panel: ''
      }
    });
  };

  const handleClearAllSections = () => {
    onChange({
      ...report,
      secciones_informe: {
        ...report.secciones_informe,
        "1_solicitud_cliente": "",
        "2_condiciones_fallas": "",
        "3_actividades_efectuadas": "",
        "4_fallas_detectadas": "",
        "5_causas_fallas": "",
        "6_conclusiones_recomendaciones": ""
      }
    });
  };

  const handleClearSingleSection = (field: keyof typeof report.secciones_informe) => {
    onChange({
      ...report,
      secciones_informe: {
        ...report.secciones_informe,
        [field]: ""
      }
    });
  };

  const handleClearHerramientas = () => {
    handleSectionChange('herramientas_utilizadas', []);
  };

  const handleClearPhotos = () => {
    handleSectionChange('7_registro_fotografico', []);
  };

  const handleClearAllFirmas = () => {
    onChange({
      ...report,
      bloque_firmas: {
        elaborado_por: { nombre: '', cargo: '', firma_image: '' },
        revisado_por: { nombre: '', cargo: '', firma_image: '' },
        aprobado_por: { nombre: '', cargo: '', firma_image: '' }
      }
    });
  };

  const handleClearSingleFirma = (role: 'elaborado_por' | 'revisado_por' | 'aprobado_por') => {
    onChange({
      ...report,
      bloque_firmas: {
        ...report.bloque_firmas,
        [role]: { nombre: '', cargo: '', firma_image: '' }
      }
    });
  };

  // Helpers for header updates
  const handleHeaderChange = (field: keyof typeof report.encabezado_venequip, value: string) => {
    onChange({
      ...report,
      encabezado_venequip: {
        ...report.encabezado_venequip,
        [field]: value
      }
    });
  };

  // Helpers for sections update
  const handleSectionChange = (field: keyof typeof report.secciones_informe, value: any) => {
    onChange({
      ...report,
      secciones_informe: {
        ...report.secciones_informe,
        [field]: value
      }
    });
  };

  // Helpers for Herramientas
  const handleAddHerramienta = () => {
    const newTool: Herramienta = {
      nombre: 'Nueva Herramienta',
      numero_parte: '-----------------------------------',
      cantidad: 1
    };
    handleSectionChange('herramientas_utilizadas', [
      ...report.secciones_informe.herramientas_utilizadas,
      newTool
    ]);
  };

  const handleUpdateHerramienta = (index: number, field: keyof Herramienta, value: any) => {
    const updated = [...report.secciones_informe.herramientas_utilizadas];
    updated[index] = { ...updated[index], [field]: value };
    handleSectionChange('herramientas_utilizadas', updated);
  };

  const handleRemoveHerramienta = (index: number) => {
    const updated = report.secciones_informe.herramientas_utilizadas.filter((_, i) => i !== index);
    handleSectionChange('herramientas_utilizadas', updated);
  };

  // Helpers for Photos
  const [isProcessingPhotoUrl, setIsProcessingPhotoUrl] = useState<number | null>(null);

  const handleAddPhoto = () => {
    const nextNum = report.secciones_informe["7_registro_fotografico"].length + 1;
    const initialImg = nextNum % 2 === 1 ? getSampleInspectionPhoto1() : getSampleInspectionPhoto2();
    const newPhoto: RegistroFotografico = {
      imagen_id: `Imagen ${nextNum}`,
      descripcion: 'Descripción de la evidencia fotográfica',
      url_o_base64: initialImg,
      imagenes: [initialImg]
    };
    handleSectionChange('7_registro_fotografico', [
      ...report.secciones_informe["7_registro_fotografico"],
      newPhoto
    ]);
  };

  const handleUpdatePhoto = (index: number, field: keyof RegistroFotografico, value: any) => {
    const updated = [...report.secciones_informe["7_registro_fotografico"]];
    updated[index] = { ...updated[index], [field]: value };
    handleSectionChange('7_registro_fotografico', updated);
  };

  const handleAddImageToBlock = (index: number, newImageUrl: string) => {
    if (!newImageUrl || !newImageUrl.trim()) return;
    const updated = [...report.secciones_informe["7_registro_fotografico"]];
    const current = updated[index];
    const currentImgs = current.imagenes && current.imagenes.length > 0 
      ? [...current.imagenes] 
      : (current.url_o_base64 ? [current.url_o_base64] : []);
    
    currentImgs.push(newImageUrl);
    updated[index] = {
      ...current,
      url_o_base64: currentImgs[0] || '',
      imagenes: currentImgs
    };
    handleSectionChange('7_registro_fotografico', updated);
  };

  const handleRemoveImageFromBlock = (blockIndex: number, imgIndex: number) => {
    const updated = [...report.secciones_informe["7_registro_fotografico"]];
    const current = updated[blockIndex];
    const currentImgs = current.imagenes && current.imagenes.length > 0 
      ? [...current.imagenes] 
      : (current.url_o_base64 ? [current.url_o_base64] : []);
    
    const filtered = currentImgs.filter((_, i) => i !== imgIndex);
    updated[blockIndex] = {
      ...current,
      url_o_base64: filtered[0] || '',
      imagenes: filtered
    };
    handleSectionChange('7_registro_fotografico', updated);
  };

  const handleProcessPhotoUrl = async (index: number, url: string) => {
    if (!url || !url.trim()) return;
    if (url.startsWith('data:image/')) return;
    setIsProcessingPhotoUrl(index);
    try {
      const base64 = await convertUrlToBase64DataUrl(url, `Imagen ${index + 1}`);
      if (base64) {
        handleAddImageToBlock(index, base64);
      }
    } catch (err) {
      console.warn('Error processing photo url:', err);
    } finally {
      setIsProcessingPhotoUrl(null);
    }
  };

  const handleRemovePhoto = (index: number) => {
    const updated = report.secciones_informe["7_registro_fotografico"].filter((_, i) => i !== index);
    handleSectionChange('7_registro_fotografico', updated);
  };

  const handlePhotoFileUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList: File[] = Array.from(files);
    let loadedCount = 0;
    const newBase64s: string[] = [];

    fileList.forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newBase64s.push(event.target.result as string);
        }
        loadedCount++;
        if (loadedCount === fileList.length) {
          const updated = [...report.secciones_informe["7_registro_fotografico"]];
          const current = updated[index];
          const currentImgs = current.imagenes && current.imagenes.length > 0 
            ? [...current.imagenes] 
            : (current.url_o_base64 ? [current.url_o_base64] : []);
          
          const combined = [...currentImgs, ...newBase64s];
          updated[index] = {
            ...current,
            url_o_base64: combined[0] || '',
            imagenes: combined
          };
          handleSectionChange('7_registro_fotografico', updated);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input value so same files can be re-selected if needed
    e.target.value = '';
  };

  // Helpers for Signatures
  const handleSignatureMetaChange = (
    role: 'elaborado_por' | 'revisado_por' | 'aprobado_por',
    field: 'nombre' | 'cargo',
    value: string
  ) => {
    onChange({
      ...report,
      bloque_firmas: {
        ...report.bloque_firmas,
        [role]: {
          ...report.bloque_firmas[role],
          [field]: value
        }
      }
    });
  };

  const handleSignatureFileUpload = (
    role: 'elaborado_por' | 'revisado_por' | 'aprobado_por',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onChange({
            ...report,
            bloque_firmas: {
              ...report.bloque_firmas,
              [role]: {
                ...report.bloque_firmas[role],
                firma_image: event.target.result as string
              }
            }
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSetDefaultSignature = (role: 'elaborado_por' | 'revisado_por' | 'aprobado_por') => {
    const name = report.bloque_firmas[role]?.nombre || (role === 'elaborado_por' ? 'Técnico Especialista' : role === 'revisado_por' ? 'Supervisor de Servicio' : 'Gerente de Sucursal');
    const sigUrl = getDefaultSignatureDataUrl(name);
    onChange({
      ...report,
      bloque_firmas: {
        ...report.bloque_firmas,
        [role]: {
          ...report.bloque_firmas[role],
          firma_image: sigUrl
        }
      }
    });
  };

  return (
    <div id="report-editor-container" className="space-y-6">
      
      {/* Clean Tab Controls */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-2">
        <button
          id="tab-encabezado"
          onClick={() => setActiveTab('encabezado')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
            activeTab === 'encabezado'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>1. Encabezado & Orden</span>
        </button>

        <button
          id="tab-secciones"
          onClick={() => setActiveTab('secciones')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
            activeTab === 'secciones'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>2. Redacción Técnica (7 Secciones)</span>
        </button>

        <button
          id="tab-herramientas"
          onClick={() => setActiveTab('herramientas')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
            activeTab === 'herramientas'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>3. Herramientas ({report.secciones_informe.herramientas_utilizadas.length})</span>
        </button>

        <button
          id="tab-fotografico"
          onClick={() => setActiveTab('fotografico')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
            activeTab === 'fotografico'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>4. Registro Fotográfico ({report.secciones_informe["7_registro_fotografico"].length})</span>
        </button>

        <button
          id="tab-firmas"
          onClick={() => setActiveTab('firmas')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
            activeTab === 'firmas'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>5. Bloque de Firmas</span>
        </button>
      </div>

      {/* TAB 1: ENCABEZADO */}
      {activeTab === 'encabezado' && (
        <div id="section-editor-encabezado" className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wide">
                <Building className="w-5 h-5 text-amber-500" />
                Datos del Encabezado Corporativo Venequip
              </h2>
              <p className="text-xs text-slate-500 font-medium">Identificación de servicio, cliente y especificaciones electromecánicas del equipo</p>
            </div>
            <button
              id="btn-clear-header"
              onClick={handleClearHeader}
              className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border border-rose-200 font-bold"
              title="Limpiar todos los campos del encabezado"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>Limpiar Encabezado</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Empresa</label>
              <input
                id="input-header-empresa"
                type="text"
                value={report.encabezado_venequip.empresa}
                onChange={(e) => handleHeaderChange('empresa', e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg p-2.5 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Sucursal Venequip</label>
              <input
                id="input-header-sucursal"
                type="text"
                value={report.encabezado_venequip.sucursal}
                onChange={(e) => handleHeaderChange('sucursal', e.target.value)}
                placeholder="ej. LOS RUICES"
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg p-2.5 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha</label>
              <input
                id="input-header-fecha"
                type="text"
                value={report.encabezado_venequip.fecha}
                onChange={(e) => handleHeaderChange('fecha', e.target.value)}
                placeholder="DD/MM/AAAA"
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg p-2.5 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">N° de Servicio</label>
              <input
                id="input-header-numero-servicio"
                type="text"
                value={report.encabezado_venequip.numero_servicio}
                onChange={(e) => handleHeaderChange('numero_servicio', e.target.value)}
                placeholder="ej. 6305"
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-bold text-sm rounded-lg p-2.5 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Actividad</label>
              <input
                id="input-header-actividad"
                type="text"
                value={report.encabezado_venequip.actividad}
                onChange={(e) => handleHeaderChange('actividad', e.target.value)}
                placeholder="ej. ENTREGA TÉCNICA"
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg p-2.5 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cliente</label>
              <input
                id="input-header-cliente"
                type="text"
                value={report.encabezado_venequip.cliente}
                onChange={(e) => handleHeaderChange('cliente', e.target.value)}
                placeholder="ej. INVERCIONES FLORENCIA"
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg p-2.5 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Localización del Equipo</label>
              <input
                id="input-header-localizacion"
                type="text"
                value={report.encabezado_venequip.localizacion}
                onChange={(e) => handleHeaderChange('localizacion', e.target.value)}
                placeholder="ej. LAS MERCEDES"
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg p-2.5 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Fabricante</label>
              <input
                id="input-header-fabricante"
                type="text"
                value={report.encabezado_venequip.fabricante}
                onChange={(e) => handleHeaderChange('fabricante', e.target.value)}
                placeholder="ej. GENERAC / CATERPILLAR"
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg p-2.5 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Modelo</label>
              <input
                id="input-header-modelo"
                type="text"
                value={report.encabezado_venequip.modelo}
                onChange={(e) => handleHeaderChange('modelo', e.target.value)}
                placeholder="ej. RG08045JNAXD"
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg p-2.5 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Serial del Equipo</label>
              <input
                id="input-header-serial-equipo"
                type="text"
                value={report.encabezado_venequip.serial_equipo}
                onChange={(e) => handleHeaderChange('serial_equipo', e.target.value)}
                placeholder="ej. 3018154862"
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg p-2.5 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Serial del Motor</label>
              <input
                id="input-header-serial-motor"
                type="text"
                value={report.encabezado_venequip.serial_motor}
                onChange={(e) => handleHeaderChange('serial_motor', e.target.value)}
                placeholder="ej. 3018202876"
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg p-2.5 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Horas del Motor</label>
              <input
                id="input-header-horas-motor"
                type="text"
                value={report.encabezado_venequip.horas_motor}
                onChange={(e) => handleHeaderChange('horas_motor', e.target.value)}
                placeholder="ej. 0.6 hrs"
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg p-2.5 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Horas del Panel (Si aplica)</label>
              <input
                id="input-header-horas-panel"
                type="text"
                value={report.encabezado_venequip.horas_panel}
                onChange={(e) => handleHeaderChange('horas_panel', e.target.value)}
                placeholder="ej. 0.6 hrs"
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg p-2.5 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>

          </div>

          {/* Caterpillar Predictive Maintenance Intelligent Assistant */}
          {(() => {
            const rawHrs = parseFloat(String(report.encabezado_venequip.horas_motor || '0').replace(/[^0-9.]/g, '')) || 0;
            if (rawHrs <= 0) return null;
            const pred = calculateNextCATMaintenance(rawHrs);
            const config = CAT_MAINTENANCE_CONFIGS[pred.level];

            return (
              <div className="mt-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-400/40 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amber-500 text-slate-950 rounded-lg font-black">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 block">
                        Diagnóstico Predictivo Caterpillar Venequip
                      </span>
                      <h4 className="text-xs font-black text-slate-900">
                        Próximo Servicio Sugerido: <span className="text-amber-700">{config?.title || pred.level}</span>
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">
                      Horómetro Meta: <strong className="text-slate-900">{pred.targetHorometro.toLocaleString('es-VE')} hrs</strong>
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      pred.urgency === 'vencido' 
                        ? 'bg-rose-100 text-rose-800' 
                        : pred.urgency === 'proximo' 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {pred.urgency === 'vencido' ? '¡Vencido!' : pred.urgency === 'proximo' ? '¡Próximo!' : 'Al Día'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {pred.description} (Margen: <strong>{pred.hoursRemaining} hrs</strong> • Proyección estimada: <strong>{pred.suggestedDateProjection}</strong>)
                </p>

                <div className="pt-2 border-t border-amber-200/60 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-600">
                    <strong className="text-slate-800">Kits recomendados:</strong> {config?.recommendedParts.slice(0, 2).join(', ')}...
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const newActividad = `MANTENIMIENTO PREVENTIVO PROGRAMADO ${pred.level} (${config?.hoursInterval || 250} HORAS)`;
                      const newSol = `Se solicita a Consorcio Venequip S.A. la ejecución del servicio de mantenimiento preventivo ${pred.level} para el equipo ${report.encabezado_venequip.modelo || 'Caterpillar'} (Serial: ${report.encabezado_venequip.serial_equipo || 'N/A'}) con horómetro de ${rawHrs} horas acumuladas.`;
                      const newRec = `1. Ejecutar el protocolo estándar de mantenimiento preventivo ${pred.level} a las ${pred.targetHorometro} horas.\n2. Sustituir los kits de filtros recomendados por el fabricante: ${config?.recommendedParts.join(', ')}.\n3. Tomar muestras de fluidos SOS (${config?.fluidSamples.join(', ')}).\n4. Próxima inspección programada a las ${pred.targetHorometro + 250} horas.`;
                      
                      onChange({
                        ...report,
                        encabezado_venequip: {
                          ...report.encabezado_venequip,
                          actividad: newActividad
                        },
                        secciones_informe: {
                          ...report.secciones_informe,
                          "1_solicitud_cliente": report.secciones_informe["1_solicitud_cliente"] || newSol,
                          "6_conclusiones_recomendaciones": report.secciones_informe["6_conclusiones_recomendaciones"] 
                            ? `${report.secciones_informe["6_conclusiones_recomendaciones"]}\n\n[PLAN PREVENTIVO CAT ${pred.level}]:\n${newRec}`
                            : newRec
                        }
                      });
                    }}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Aplicar Plan {pred.level} al Informe</span>
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB 2: SECCIONES OFICIALES VENEQUIP */}
      {activeTab === 'secciones' && (
        <div id="section-editor-7secciones" className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-amber-500" />
                Las 7 Secciones Reglamentarias de Venequip
              </h2>
              <p className="text-xs text-slate-500 font-medium">Puedes editar cualquier texto directamente o usar la IA para refinar la redacción electromecánica.</p>
            </div>
            <button
              id="btn-clear-all-sections"
              onClick={handleClearAllSections}
              className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border border-rose-200 font-bold"
              title="Limpiar el texto de todas las secciones redactadas"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>Limpiar Todas las Secciones</span>
            </button>
          </div>

          {/* Section 1 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-900">1. Solicitud del Cliente</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleClearSingleSection('1_solicitud_cliente')}
                  className="text-xs bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 px-2.5 py-1 rounded flex items-center gap-1 transition-colors border border-slate-200"
                  title="Vaciar esta sección"
                >
                  <Eraser className="w-3 h-3" />
                  <span>Limpiar</span>
                </button>
                <button
                  onClick={() => onPolishSection("1. Solicitud del Cliente", report.secciones_informe["1_solicitud_cliente"], (newText) => handleSectionChange('1_solicitud_cliente', newText))}
                  disabled={isPolishingSection === "1. Solicitud del Cliente"}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors border border-slate-300 font-bold"
                >
                  {isPolishingSection === "1. Solicitud del Cliente" ? <RefreshCw className="w-3 h-3 animate-spin text-amber-500" /> : <Sparkles className="w-3 h-3 text-amber-500" />}
                  <span>Optimizar Redacción</span>
                </button>
              </div>
            </div>
            <textarea
              id="textarea-section-1"
              rows={3}
              value={report.secciones_informe["1_solicitud_cliente"]}
              onChange={(e) => handleSectionChange('1_solicitud_cliente', e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg p-3 focus:border-amber-500 focus:bg-white focus:outline-none leading-relaxed"
            />
          </div>

          {/* Section 2 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-900">2. Condiciones o Fallas Encontradas</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleClearSingleSection('2_condiciones_fallas')}
                  className="text-xs bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 px-2.5 py-1 rounded flex items-center gap-1 transition-colors border border-slate-200"
                  title="Vaciar esta sección"
                >
                  <Eraser className="w-3 h-3" />
                  <span>Limpiar</span>
                </button>
                <button
                  onClick={() => onPolishSection("2. Condiciones o Fallas Encontradas", report.secciones_informe["2_condiciones_fallas"], (newText) => handleSectionChange('2_condiciones_fallas', newText))}
                  disabled={isPolishingSection === "2. Condiciones o Fallas Encontradas"}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors border border-slate-300 font-bold"
                >
                  {isPolishingSection === "2. Condiciones o Fallas Encontradas" ? <RefreshCw className="w-3 h-3 animate-spin text-amber-500" /> : <Sparkles className="w-3 h-3 text-amber-500" />}
                  <span>Optimizar Redacción</span>
                </button>
              </div>
            </div>
            <textarea
              id="textarea-section-2"
              rows={4}
              value={report.secciones_informe["2_condiciones_fallas"]}
              onChange={(e) => handleSectionChange('2_condiciones_fallas', e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg p-3 focus:border-amber-500 focus:bg-white focus:outline-none leading-relaxed"
            />
          </div>

          {/* Section 3 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-900">3. Pruebas y/o Actividades Efectuadas</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleClearSingleSection('3_actividades_efectuadas')}
                  className="text-xs bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 px-2.5 py-1 rounded flex items-center gap-1 transition-colors border border-slate-200"
                  title="Vaciar esta sección"
                >
                  <Eraser className="w-3 h-3" />
                  <span>Limpiar</span>
                </button>
                <button
                  onClick={() => onPolishSection("3. Pruebas y/o Actividades Efectuadas", report.secciones_informe["3_actividades_efectuadas"], (newText) => handleSectionChange('3_actividades_efectuadas', newText))}
                  disabled={isPolishingSection === "3. Pruebas y/o Actividades Efectuadas"}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors border border-slate-300 font-bold"
                >
                  {isPolishingSection === "3. Pruebas y/o Actividades Efectuadas" ? <RefreshCw className="w-3 h-3 animate-spin text-amber-500" /> : <Sparkles className="w-3 h-3 text-amber-500" />}
                  <span>Optimizar Redacción</span>
                </button>
              </div>
            </div>
            <textarea
              id="textarea-section-3"
              rows={8}
              value={report.secciones_informe["3_actividades_efectuadas"]}
              onChange={(e) => handleSectionChange('3_actividades_efectuadas', e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg p-3 focus:border-amber-500 focus:bg-white focus:outline-none leading-relaxed font-sans"
            />
          </div>

          {/* Section 4 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-900">4. Falla(s)</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleClearSingleSection('4_fallas_detectadas')}
                  className="text-xs bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 px-2.5 py-1 rounded flex items-center gap-1 transition-colors border border-slate-200"
                  title="Vaciar esta sección"
                >
                  <Eraser className="w-3 h-3" />
                  <span>Limpiar</span>
                </button>
                <button
                  onClick={() => onPolishSection("4. Falla(s)", report.secciones_informe["4_fallas_detectadas"], (newText) => handleSectionChange('4_fallas_detectadas', newText))}
                  disabled={isPolishingSection === "4. Falla(s)"}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors border border-slate-300 font-bold"
                >
                  {isPolishingSection === "4. Falla(s)" ? <RefreshCw className="w-3 h-3 animate-spin text-amber-500" /> : <Sparkles className="w-3 h-3 text-amber-500" />}
                  <span>Optimizar Redacción</span>
                </button>
              </div>
            </div>
            <textarea
              id="textarea-section-4"
              rows={3}
              value={report.secciones_informe["4_fallas_detectadas"]}
              onChange={(e) => handleSectionChange('4_fallas_detectadas', e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg p-3 focus:border-amber-500 focus:bg-white focus:outline-none leading-relaxed"
            />
          </div>

          {/* Section 5 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-900">5. Causa(s) de la Falla(s)</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleClearSingleSection('5_causas_fallas')}
                  className="text-xs bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 px-2.5 py-1 rounded flex items-center gap-1 transition-colors border border-slate-200"
                  title="Vaciar esta sección"
                >
                  <Eraser className="w-3 h-3" />
                  <span>Limpiar</span>
                </button>
                <button
                  onClick={() => onPolishSection("5. Causa(s) de la Falla(s)", report.secciones_informe["5_causas_fallas"], (newText) => handleSectionChange('5_causas_fallas', newText))}
                  disabled={isPolishingSection === "5. Causa(s) de la Falla(s)"}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors border border-slate-300 font-bold"
                >
                  {isPolishingSection === "5. Causa(s) de la Falla(s)" ? <RefreshCw className="w-3 h-3 animate-spin text-amber-500" /> : <Sparkles className="w-3 h-3 text-amber-500" />}
                  <span>Optimizar Redacción</span>
                </button>
              </div>
            </div>
            <textarea
              id="textarea-section-5"
              rows={3}
              value={report.secciones_informe["5_causas_fallas"]}
              onChange={(e) => handleSectionChange('5_causas_fallas', e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg p-3 focus:border-amber-500 focus:bg-white focus:outline-none leading-relaxed"
            />
          </div>

          {/* Section 6 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-sm font-bold text-slate-900">6. Conclusiones y/o Recomendaciones</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleClearSingleSection('6_conclusiones_recomendaciones')}
                  className="text-xs bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 px-2.5 py-1 rounded flex items-center gap-1 transition-colors border border-slate-200"
                  title="Vaciar esta sección"
                >
                  <Eraser className="w-3 h-3" />
                  <span>Limpiar</span>
                </button>
                <button
                  onClick={() => onPolishSection("6. Conclusiones y/o Recomendaciones", report.secciones_informe["6_conclusiones_recomendaciones"], (newText) => handleSectionChange('6_conclusiones_recomendaciones', newText))}
                  disabled={isPolishingSection === "6. Conclusiones y/o Recomendaciones"}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors border border-slate-300 font-bold"
                >
                  {isPolishingSection === "6. Conclusiones y/o Recomendaciones" ? <RefreshCw className="w-3 h-3 animate-spin text-amber-500" /> : <Sparkles className="w-3 h-3 text-amber-500" />}
                  <span>Optimizar Redacción</span>
                </button>
              </div>
            </div>
            <textarea
              id="textarea-section-6"
              rows={4}
              value={report.secciones_informe["6_conclusiones_recomendaciones"]}
              onChange={(e) => handleSectionChange('6_conclusiones_recomendaciones', e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg p-3 focus:border-amber-500 focus:bg-white focus:outline-none leading-relaxed"
            />
          </div>

        </div>
      )}

      {/* TAB 3: HERRAMIENTAS NECESARIAS */}
      {activeTab === 'herramientas' && (
        <div id="section-editor-herramientas" className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-500" />
                Tabla de Herramientas Necesarias / Empleadas
              </h2>
              <p className="text-xs text-slate-500 font-medium">Equipos de medición, pinzas, multímetros y herramientas de servicio de campo</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                id="btn-clear-herramientas"
                onClick={handleClearHerramientas}
                className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors border border-rose-200 font-bold"
                title="Vaciar tabla de herramientas"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>Vaciar Tabla</span>
              </button>
              <button
                id="btn-add-tool"
                onClick={handleAddHerramienta}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Herramienta</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 text-xs uppercase tracking-wider font-bold border-b border-slate-200">
                  <th className="p-3 rounded-tl-lg">Nombre de la Herramienta</th>
                  <th className="p-3">Número de Parte</th>
                  <th className="p-3 w-28 text-center">Cantidad</th>
                  <th className="p-3 w-16 text-center rounded-tr-lg">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {report.secciones_informe.herramientas_utilizadas.map((tool, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="p-2.5">
                      <input
                        type="text"
                        value={tool.nombre}
                        onChange={(e) => handleUpdateHerramienta(idx, 'nombre', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded p-2 text-sm focus:border-amber-500 focus:bg-white focus:outline-none"
                      />
                    </td>
                    <td className="p-2.5">
                      <input
                        type="text"
                        value={tool.numero_parte}
                        onChange={(e) => handleUpdateHerramienta(idx, 'numero_parte', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 text-slate-800 font-mono rounded p-2 text-sm focus:border-amber-500 focus:bg-white focus:outline-none"
                      />
                    </td>
                    <td className="p-2.5">
                      <input
                        type="number"
                        min={1}
                        value={tool.cantidad}
                        onChange={(e) => handleUpdateHerramienta(idx, 'cantidad', parseInt(e.target.value) || 1)}
                        className="w-full bg-slate-50 border border-slate-300 text-center text-slate-900 rounded p-2 text-sm focus:border-amber-500 focus:bg-white focus:outline-none"
                      />
                    </td>
                    <td className="p-2.5 text-center">
                      <button
                        onClick={() => handleRemoveHerramienta(idx)}
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                        title="Eliminar herramienta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: REGISTRO FOTOGRÁFICO */}
      {activeTab === 'fotografico' && (
        <div id="section-editor-fotografico" className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-amber-500" />
                Sección 7. Registro Fotográfico y Anexos
              </h2>
              <p className="text-xs text-slate-500 font-medium">Capturas de mediciones, placas de motor, tablero de control y conexiones</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                id="btn-clear-photos"
                onClick={handleClearPhotos}
                className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors border border-rose-200 font-bold"
                title="Vaciar todo el registro fotográfico"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>Vaciar Registro</span>
              </button>
              <button
                id="btn-add-photo"
                onClick={handleAddPhoto}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Imagen</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {report.secciones_informe["7_registro_fotografico"].map((photo, idx) => {
              const blockImages = photo.imagenes && photo.imagenes.length > 0
                ? photo.imagenes
                : (photo.url_o_base64 && photo.url_o_base64.trim() ? [photo.url_o_base64] : []);

              return (
                <div key={idx} className="bg-slate-50 border border-slate-300 rounded-2xl p-4 space-y-4 relative group">
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={photo.imagen_id}
                        onChange={(e) => handleUpdatePhoto(idx, 'imagen_id', e.target.value)}
                        className="bg-white text-slate-900 font-bold text-xs px-2.5 py-1 rounded border border-slate-300 focus:outline-none"
                      />
                      <span className="text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                        {blockImages.length} {blockImages.length === 1 ? 'foto' : 'fotos'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemovePhoto(idx)}
                      className="p-1.5 text-rose-500 hover:bg-rose-100 rounded transition-colors"
                      title="Eliminar este bloque completo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Multi-Image Gallery Grid */}
                  <div className="space-y-2">
                    {blockImages.length > 0 ? (
                      <div className={`grid gap-2 ${
                        blockImages.length === 1 
                          ? 'grid-cols-1' 
                          : blockImages.length === 2 
                            ? 'grid-cols-2' 
                            : 'grid-cols-2 sm:grid-cols-3'
                      }`}>
                        {blockImages.map((imgSrc, imgIdx) => (
                          <div 
                            key={imgIdx} 
                            className="aspect-video bg-slate-900/5 rounded-lg overflow-hidden relative border border-slate-300 group/img flex items-center justify-center shadow-2xs"
                          >
                            <img 
                              src={imgSrc} 
                              alt={`${photo.descripcion || 'Evidencia'} (${imgIdx + 1})`} 
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleRemoveImageFromBlock(idx, imgIdx)}
                                className="bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded-full shadow transition-all active:scale-90"
                                title="Eliminar solo esta foto del bloque"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.2 rounded">
                              #{imgIdx + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="aspect-video bg-white rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-4 text-center">
                        <ImageIcon className="w-8 h-8 text-slate-300 mb-1" />
                        <span className="text-xs text-slate-400 font-medium">Sin fotos en este bloque</span>
                        <span className="text-[10px] text-slate-400">Sube una o varias imágenes a continuación</span>
                      </div>
                    )}
                  </div>

                  {/* Multi-Image Upload Actions */}
                  <div className="space-y-2 pt-1 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-semibold text-slate-600 uppercase">
                        Agregar fotos al bloque (Subir varias o enlace)
                      </label>
                      <span className="text-[10px] text-emerald-700 font-bold">
                        Permite selección múltiple
                      </span>
                    </div>
                    
                    <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                      <input
                        type="text"
                        placeholder="Pegar enlace web o Drive..."
                        id={`input-photo-url-${idx}`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = (e.target as HTMLInputElement).value;
                            if (val) {
                              handleProcessPhotoUrl(idx, val);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }
                        }}
                        className="flex-1 min-w-[140px] bg-white border border-slate-300 text-slate-800 text-xs rounded p-2 focus:border-amber-500 focus:outline-none"
                      />

                      <button
                        type="button"
                        onClick={() => {
                          const inputEl = document.getElementById(`input-photo-url-${idx}`) as HTMLInputElement;
                          if (inputEl && inputEl.value) {
                            handleProcessPhotoUrl(idx, inputEl.value);
                            inputEl.value = '';
                          }
                        }}
                        disabled={isProcessingPhotoUrl === idx}
                        className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs px-2.5 py-2 rounded flex items-center gap-1 shadow-xs transition-colors shrink-0"
                        title="Agregar enlace a este bloque"
                      >
                        {isProcessingPhotoUrl === idx ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <LinkIcon className="w-3.5 h-3.5" />}
                        <span>+ Link</span>
                      </button>

                      <label className="bg-slate-900 hover:bg-slate-800 text-white text-xs px-3 py-2 rounded-lg cursor-pointer flex items-center gap-1.5 font-bold transition-colors shrink-0 shadow-xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Subir Fotos</span>
                        <input 
                          type="file" 
                          multiple 
                          accept="image/*" 
                          onChange={(e) => handlePhotoFileUpload(idx, e)} 
                          className="hidden" 
                        />
                      </label>
                    </div>
                  </div>

                  {/* Caption / Description for this Block */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                      Descripción Técnica del Bloque Fotográfico
                    </label>
                    <textarea
                      rows={2}
                      value={photo.descripcion}
                      onChange={(e) => handleUpdatePhoto(idx, 'descripcion', e.target.value)}
                      placeholder="Indique las condiciones observadas en este registro fotográfico..."
                      className="w-full bg-white border border-slate-300 text-slate-800 text-xs rounded p-2 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: BLOQUE DE FIRMAS */}
      {activeTab === 'firmas' && (
        <div id="section-editor-firmas" className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-500" />
                Mapeo de Identidades y Bloques de Firma Digital
              </h2>
              <p className="text-xs text-slate-500 font-medium">Responsables técnicos del servicio. Cada firma puede dibujarse en pantalla o adjuntarse en archivo.</p>
            </div>
            <button
              id="btn-clear-all-firmas"
              onClick={handleClearAllFirmas}
              className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors border border-rose-200 font-bold"
              title="Limpiar todas las firmas y datos de responsables"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>Limpiar Firmas</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Elaborado por */}
            <div className="bg-slate-50 border border-slate-300 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="bg-slate-200 text-slate-900 font-bold text-xs uppercase px-2.5 py-1 rounded border border-slate-300 text-center flex-1">
                  Elaborado Por
                </div>
                <button
                  onClick={() => handleClearSingleFirma('elaborado_por')}
                  className="ml-2 p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                  title="Borrar firma y datos"
                >
                  <Eraser className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Técnico</label>
                <input
                  id="input-firma-elaborado-nombre"
                  type="text"
                  value={report.bloque_firmas.elaborado_por.nombre}
                  onChange={(e) => handleSignatureMetaChange('elaborado_por', 'nombre', e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded p-2 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cargo</label>
                <input
                  id="input-firma-elaborado-cargo"
                  type="text"
                  value={report.bloque_firmas.elaborado_por.cargo}
                  onChange={(e) => handleSignatureMetaChange('elaborado_por', 'cargo', e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-800 text-xs rounded p-2 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">Firma Registrada</label>
                <div className="h-24 bg-white rounded-lg p-2 flex items-center justify-center border border-slate-300 overflow-hidden">
                  {report.bloque_firmas.elaborado_por.firma_image && report.bloque_firmas.elaborado_por.firma_image.trim() ? (
                    <img 
                      src={report.bloque_firmas.elaborado_por.firma_image} 
                      alt="Firma Elaborado" 
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">Sin firma</span>
                  )}
                </div>

                <div className="space-y-1.5 pt-1">
                  <button
                    id="btn-draw-signature-elaborado"
                    onClick={() => onOpenSignatureCanvas('elaborado_por')}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Dibujar en Pantalla</span>
                  </button>

                  <div className="grid grid-cols-2 gap-1.5">
                    <label className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold py-1.5 px-2 rounded-lg cursor-pointer flex items-center justify-center gap-1 border border-slate-300 transition-colors">
                      <Upload className="w-3 h-3" />
                      <span>Subir Imagen</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleSignatureFileUpload('elaborado_por', e)} 
                        className="hidden" 
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => handleSetDefaultSignature('elaborado_por')}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 border border-slate-300 transition-colors"
                      title="Generar firma oficial estilizada"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Firma Auto</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Revisado y Corregido por */}
            <div className="bg-slate-50 border border-slate-300 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="bg-slate-200 text-slate-900 font-bold text-xs uppercase px-2.5 py-1 rounded border border-slate-300 text-center flex-1">
                  Revisado y Corregido Por
                </div>
                <button
                  onClick={() => handleClearSingleFirma('revisado_por')}
                  className="ml-2 p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                  title="Borrar firma y datos"
                >
                  <Eraser className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Ingeniero</label>
                <input
                  id="input-firma-revisado-nombre"
                  type="text"
                  value={report.bloque_firmas.revisado_por.nombre}
                  onChange={(e) => handleSignatureMetaChange('revisado_por', 'nombre', e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded p-2 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cargo</label>
                <input
                  id="input-firma-revisado-cargo"
                  type="text"
                  value={report.bloque_firmas.revisado_por.cargo}
                  onChange={(e) => handleSignatureMetaChange('revisado_por', 'cargo', e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-800 text-xs rounded p-2 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">Firma Registrada</label>
                <div className="h-24 bg-white rounded-lg p-2 flex items-center justify-center border border-slate-300 overflow-hidden">
                  {report.bloque_firmas.revisado_por.firma_image && report.bloque_firmas.revisado_por.firma_image.trim() ? (
                    <img 
                      src={report.bloque_firmas.revisado_por.firma_image} 
                      alt="Firma Revisado" 
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">Sin firma</span>
                  )}
                </div>

                <div className="space-y-1.5 pt-1">
                  <button
                    id="btn-draw-signature-revisado"
                    onClick={() => onOpenSignatureCanvas('revisado_por')}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Dibujar en Pantalla</span>
                  </button>

                  <div className="grid grid-cols-2 gap-1.5">
                    <label className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold py-1.5 px-2 rounded-lg cursor-pointer flex items-center justify-center gap-1 border border-slate-300 transition-colors">
                      <Upload className="w-3 h-3" />
                      <span>Subir Imagen</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleSignatureFileUpload('revisado_por', e)} 
                        className="hidden" 
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => handleSetDefaultSignature('revisado_por')}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 border border-slate-300 transition-colors"
                      title="Generar firma oficial estilizada"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Firma Auto</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Aprobado por */}
            <div className="bg-slate-50 border border-slate-300 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="bg-slate-200 text-slate-900 font-bold text-xs uppercase px-2.5 py-1 rounded border border-slate-300 text-center flex-1">
                  Aprobado Por
                </div>
                <button
                  onClick={() => handleClearSingleFirma('aprobado_por')}
                  className="ml-2 p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                  title="Borrar firma y datos"
                >
                  <Eraser className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Coordinador</label>
                <input
                  id="input-firma-aprobado-nombre"
                  type="text"
                  value={report.bloque_firmas.aprobado_por.nombre}
                  onChange={(e) => handleSignatureMetaChange('aprobado_por', 'nombre', e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded p-2 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cargo</label>
                <input
                  id="input-firma-aprobado-cargo"
                  type="text"
                  value={report.bloque_firmas.aprobado_por.cargo}
                  onChange={(e) => handleSignatureMetaChange('aprobado_por', 'cargo', e.target.value)}
                  className="w-full bg-white border border-slate-300 text-slate-800 text-xs rounded p-2 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">Firma Registrada</label>
                <div className="h-24 bg-white rounded-lg p-2 flex items-center justify-center border border-slate-300 overflow-hidden">
                  {report.bloque_firmas.aprobado_por.firma_image && report.bloque_firmas.aprobado_por.firma_image.trim() ? (
                    <img 
                      src={report.bloque_firmas.aprobado_por.firma_image} 
                      alt="Firma Aprobado" 
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-slate-400">Sin firma</span>
                  )}
                </div>

                <div className="space-y-1.5 pt-1">
                  <button
                    id="btn-draw-signature-aprobado"
                    onClick={() => onOpenSignatureCanvas('aprobado_por')}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Dibujar en Pantalla</span>
                  </button>

                  <div className="grid grid-cols-2 gap-1.5">
                    <label className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold py-1.5 px-2 rounded-lg cursor-pointer flex items-center justify-center gap-1 border border-slate-300 transition-colors">
                      <Upload className="w-3 h-3" />
                      <span>Subir Imagen</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleSignatureFileUpload('aprobado_por', e)} 
                        className="hidden" 
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => handleSetDefaultSignature('aprobado_por')}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 border border-slate-300 transition-colors"
                      title="Generar firma oficial estilizada"
                    >
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Firma Auto</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

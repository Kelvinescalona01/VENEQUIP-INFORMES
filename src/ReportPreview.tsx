import React, { useRef, useState, useEffect } from 'react';
import { InformeTecnico } from './types';
import { normalizeReport } from './reportUtils';
import { 
  Printer, 
  Download, 
  Eye, 
  FileCode, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw,
  Sparkles,
  Layers,
  FileCheck
} from 'lucide-react';
import { getVenequipLogoDataUrl, getDefaultSignatureDataUrl } from './logoUtils';

interface ReportPreviewProps {
  report: InformeTecnico;
  onOpenExportModal: () => void;
}

export const ReportPreview: React.FC<ReportPreviewProps> = ({
  report,
  onOpenExportModal,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dynamic Responsive Zoom / Scaling State
  const [scale, setScale] = useState<number>(1);
  const [fitMode, setFitMode] = useState<'fit' | 'actual' | 'custom'>('fit');

  // Auto-calculate scale on screen resize to fit any device (Mobile, Tablet, Desktop)
  useEffect(() => {
    const handleResize = () => {
      if (fitMode === 'fit' && containerRef.current) {
        const containerWidth = containerRef.current.clientWidth - 32; // padding margin
        const docWidth = 850; // standard A4 sheet render width
        if (containerWidth < docWidth) {
          const calculatedScale = Math.max(0.35, Math.min(1, containerWidth / docWidth));
          setScale(Number(calculatedScale.toFixed(2)));
        } else {
          setScale(1);
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fitMode]);

  const handleNativePrint = () => {
    window.print();
  };

  const handleFitToScreen = () => {
    setFitMode('fit');
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth - 32;
      const docWidth = 850;
      const calculatedScale = Math.max(0.35, Math.min(1, containerWidth / docWidth));
      setScale(Number(calculatedScale.toFixed(2)));
    }
  };

  const handleActualSize = () => {
    setFitMode('actual');
    setScale(1);
  };

  const handleZoomIn = () => {
    setFitMode('custom');
    setScale((prev) => Math.min(1.8, Number((prev + 0.1).toFixed(2))));
  };

  const handleZoomOut = () => {
    setFitMode('custom');
    setScale((prev) => Math.max(0.4, Number((prev - 0.1).toFixed(2))));
  };

  const safeReport = normalizeReport(report);
  const { encabezado_venequip: enc, secciones_informe: sec, bloque_firmas: fir } = safeReport;

  return (
    <div className="space-y-4 sm:space-y-6" ref={containerRef}>
      
      {/* Interactive Responsive Toolbar with Multi-Device Controls */}
      <div className="bg-white border border-slate-200 p-3 sm:p-4 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4 shadow-sm no-print">
        
        {/* Title & Document Badge */}
        <div className="flex items-center justify-between md:justify-start gap-2">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
                Vista Previa Oficial del Documento
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Diseño de Impresión Corporativo A4 • Venequip Multimarca
              </p>
            </div>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <FileCheck className="w-3.5 h-3.5" />
            <span>Listo para Impresión</span>
          </span>
        </div>

        {/* Multiplatform Zoom & Scale Controls + Action Buttons */}
        <div className="flex flex-wrap items-center justify-between md:justify-end gap-2">
          
          {/* Zoom controls widget */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700">
            <button
              onClick={handleZoomOut}
              title="Reducir zoom"
              aria-label="Reducir zoom"
              className="p-1.5 hover:bg-white rounded-lg transition text-slate-600 hover:text-slate-900 active:scale-95"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-[11px] font-bold min-w-[45px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              title="Aumentar zoom"
              aria-label="Aumentar zoom"
              className="p-1.5 hover:bg-white rounded-lg transition text-slate-600 hover:text-slate-900 active:scale-95"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-slate-300 mx-1" />
            <button
              onClick={handleFitToScreen}
              title="Ajustar al ancho de pantalla"
              className={`px-2 py-1 text-[11px] font-bold rounded-lg transition ${
                fitMode === 'fit' ? 'bg-white shadow-xs text-amber-600' : 'hover:bg-white text-slate-600'
              }`}
            >
              Ajustar
            </button>
            <button
              onClick={handleActualSize}
              title="Tamaño 100% Real"
              className={`px-2 py-1 text-[11px] font-bold rounded-lg transition ${
                fitMode === 'actual' ? 'bg-white shadow-xs text-amber-600' : 'hover:bg-white text-slate-600'
              }`}
            >
              100%
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              id="btn-preview-print"
              onClick={handleNativePrint}
              title="Imprimir documento oficial"
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs px-3 sm:px-4 py-2 rounded-xl flex items-center gap-1.5 font-extrabold transition-all min-h-[38px]"
            >
              <Printer className="w-4 h-4 text-amber-500" />
              <span>Imprimir</span>
            </button>

            <button
              id="btn-preview-export"
              onClick={onOpenExportModal}
              title="Exportar documento en múltiples formatos"
              className="bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-xs px-3.5 sm:px-4 py-2 rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 min-h-[38px]"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Exportar</span>
            </button>
          </div>

        </div>
      </div>

      {/* DOCUMENT PREVIEW CONTAINER WITH SCALE TRANSFORMATION */}
      <div className="flex justify-center overflow-x-auto pb-12 pt-2 transition-all">
        <div 
          className="transition-transform duration-200 origin-top"
          style={{
            transform: `scale(${scale})`,
            marginBottom: scale < 1 ? `-${(1 - scale) * 1150}px` : '0px'
          }}
        >
          <div
            id="venequip-official-document"
            ref={printRef}
            className="w-[850px] min-h-[1100px] bg-white text-black p-8 sm:p-10 shadow-2xl font-sans text-xs leading-normal space-y-6 border border-slate-300 relative print:shadow-none print:w-full print:p-0 print:border-none print:transform-none select-text"
            style={{ color: '#000000', backgroundColor: '#ffffff' }}
          >

            {/* VENEQUIP OFFICIAL HEADER BOX */}
            <div className="border-2 border-black">
              
              {/* Logo & Title Row */}
              <div className="grid grid-cols-12 border-b-2 border-black">
                <div className="col-span-4 p-3 border-r-2 border-black flex flex-col justify-center items-center text-center bg-white">
                  <img 
                    src={getVenequipLogoDataUrl()} 
                    alt="Consorcio de Cogestión Venequip" 
                    className="w-full max-w-[210px] h-auto object-contain block" 
                  />
                </div>
                <div className="col-span-8 p-4 flex items-center justify-center font-black text-2xl tracking-wider uppercase bg-white text-black">
                  Informe de Servicio
                </div>
              </div>

              {/* Header Metadata Fields Grid */}
              <div className="divide-y divide-black text-xs font-bold text-black">
                
                {/* Row 1: Sucursal & Fecha */}
                <div className="grid grid-cols-12 divide-x divide-black">
                  <div className="col-span-6 p-2 flex items-center justify-between">
                    <span className="text-slate-700">Sucursal:</span>
                    <span className="font-extrabold uppercase text-center w-full">{enc.sucursal || 'LOS RUICES'}</span>
                  </div>
                  <div className="col-span-6 p-2 flex items-center justify-between">
                    <span className="text-slate-700">Fecha:</span>
                    <span className="font-extrabold text-center w-full">{enc.fecha || '04/08/2026'}</span>
                  </div>
                </div>

                {/* Row 2: Actividad & N° Servicio / Cliente */}
                <div className="grid grid-cols-12 divide-x divide-black">
                  <div className="col-span-6 p-2 flex items-center">
                    <span className="whitespace-nowrap mr-2 text-slate-700">Actividad:</span>
                    <span className="font-extrabold uppercase text-center flex-1">{enc.actividad || 'DIAGNÓSTICO Y EVALUACIÓN TÉCNICA'}</span>
                  </div>
                  <div className="col-span-6 flex flex-col divide-y divide-black">
                    <div className="p-1.5 px-2 flex items-center justify-between">
                      <span className="text-slate-700">N° Servicio:</span>
                      <span className="font-extrabold font-mono text-amber-600">{enc.numero_servicio || 'N/A'}</span>
                    </div>
                    <div className="p-1.5 px-2 flex items-center justify-between">
                      <span className="text-slate-700">Cliente:</span>
                      <span className="font-extrabold uppercase">{enc.cliente || 'CLIENTE CORPORATIVO'}</span>
                    </div>
                  </div>
                </div>

                {/* Row 3: Localización & Fabricante */}
                <div className="grid grid-cols-12 divide-x divide-black">
                  <div className="col-span-6 p-2 flex items-center justify-between">
                    <span className="whitespace-nowrap mr-2 text-slate-700">Localización del Equipo:</span>
                    <span className="font-extrabold uppercase text-center flex-1">{enc.localizacion || 'SALA DE GENERADORES'}</span>
                  </div>
                  <div className="col-span-6 p-2 flex items-center justify-between">
                    <span className="text-slate-700">Fabricante:</span>
                    <span className="font-extrabold uppercase">{enc.fabricante || 'CATERPILLAR'}</span>
                  </div>
                </div>

                {/* Row 4: Modelo & Serial de Equipo */}
                <div className="grid grid-cols-12 divide-x divide-black">
                  <div className="col-span-6 p-2 flex items-center justify-between">
                    <span className="text-slate-700">Modelo:</span>
                    <span className="font-extrabold uppercase text-center w-full">{enc.modelo || 'CAT C15'}</span>
                  </div>
                  <div className="col-span-6 p-2 flex items-center justify-between">
                    <span className="whitespace-nowrap mr-2 text-slate-700">Serial de Equipo:</span>
                    <span className="font-extrabold font-mono uppercase">{enc.serial_equipo || 'SN-CAT-001'}</span>
                  </div>
                </div>

                {/* Row 5: Serial Motor & Horas Motor & Horas Panel */}
                <div className="grid grid-cols-12 divide-x divide-black">
                  <div className="col-span-5 p-2 flex items-center">
                    <span className="whitespace-nowrap mr-1.5 text-slate-700">Serial del Motor :</span>
                    <span className="font-extrabold font-mono uppercase">{enc.serial_motor || 'CAT-ENG-001'}</span>
                  </div>
                  <div className="col-span-4 p-2 flex items-center justify-between">
                    <span className="whitespace-nowrap mr-1 text-slate-700">Horas del Motor:</span>
                    <span className="font-extrabold">{enc.horas_motor || '0'} hrs</span>
                  </div>
                  <div className="col-span-3 p-2 flex flex-col justify-center">
                    <div className="flex items-center justify-between">
                      <span className="whitespace-nowrap text-slate-700">Horas del Panel :</span>
                      <span className="font-extrabold">{enc.horas_panel && enc.horas_panel !== '(Si aplica)' ? `${enc.horas_panel} hrs` : ''}</span>
                    </div>
                    <span className="text-[9px] font-normal text-slate-500 italic">(Si aplica)</span>
                  </div>
                </div>

              </div>
            </div>

            {/* SECTION 1: SOLICITUD DEL CLIENTE */}
            <div className="space-y-0">
              <div className="border border-black bg-white inline-block px-3 py-1 font-bold text-xs uppercase">
                1. Solicitud del Cliente
              </div>
              <div className="border border-black p-4 text-xs leading-relaxed min-h-[70px] whitespace-pre-line text-justify font-normal">
                {sec["1_solicitud_cliente"] || 'Inspección y diagnóstico de operatividad general del equipo.'}
              </div>
            </div>

            {/* SECTION 2: CONDICIONES O FALLAS ENCONTRADAS */}
            <div className="space-y-0">
              <div className="border border-black bg-white inline-block px-3 py-1 font-bold text-xs uppercase">
                2. Condiciones o fallas encontradas
              </div>
              <div className="border border-black p-4 text-xs leading-relaxed min-h-[80px] whitespace-pre-line text-justify font-normal">
                {sec["2_condiciones_fallas"] || 'Condiciones de operación revisadas durante la intervención.'}
              </div>
            </div>

            {/* SECTION 3: PRUEBAS Y/O ACTIVIDADES EFECTUADAS */}
            <div className="space-y-0">
              <div className="border border-black bg-white inline-block px-3 py-1 font-bold text-xs uppercase">
                3. Pruebas y/o actividades efectuadas
              </div>
              <div className="border border-black p-4 text-xs leading-relaxed min-h-[140px] whitespace-pre-line text-justify font-normal space-y-4">
                <div>{sec["3_actividades_efectuadas"] || 'Evaluación de parámetros operativos y pruebas dinámicas de carga.'}</div>

                {/* HERRAMIENTAS NECESARIAS SUB-TABLE */}
                <div className="border border-black mt-4">
                  <div className="text-center font-bold text-xs uppercase bg-white py-1.5 border-b border-black tracking-wider">
                    HERRAMIENTAS NECESARIAS
                  </div>
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-black text-left font-bold bg-white">
                        <th className="p-2 border-r border-black w-1/2">Nombre de la Herramienta</th>
                        <th className="p-2 border-r border-black w-1/3">Número de Parte</th>
                        <th className="p-2 text-center w-1/6">Cantidad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black">
                      {sec.herramientas_utilizadas && sec.herramientas_utilizadas.length > 0 ? (
                        sec.herramientas_utilizadas.map((tool, idx) => (
                          <tr key={idx}>
                            <td className="p-2 border-r border-black font-medium">{tool.nombre}</td>
                            <td className="p-2 border-r border-black font-mono text-xs">{tool.numero_parte || '-----------------------------------'}</td>
                            <td className="p-2 text-center font-bold">{tool.cantidad}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="p-2 text-center text-slate-500 italic">No se registraron herramientas especiales</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* SECTION 4: FALLA(S) */}
            <div className="space-y-0">
              <div className="border border-black bg-white inline-block px-3 py-1 font-bold text-xs uppercase">
                4. Falla(s).
              </div>
              <div className="border border-black p-4 text-xs leading-relaxed min-h-[60px] whitespace-pre-line text-justify font-normal">
                {sec["4_fallas_detectadas"] || 'Fallas y síntomas identificados durante la inspección técnica.'}
              </div>
            </div>

            {/* SECTION 5: CAUSA(S) DE LA FALLA(S) */}
            <div className="space-y-0">
              <div className="border border-black bg-white inline-block px-3 py-1 font-bold text-xs uppercase">
                5. Causa(s) de la falla(s).
              </div>
              <div className="border border-black p-4 text-xs leading-relaxed min-h-[60px] whitespace-pre-line text-justify font-normal">
                {sec["5_causas_fallas"] || 'Causas raíces y factores determinantes del comportamiento del equipo.'}
              </div>
            </div>

            {/* SECTION 6: CONCLUSIONES Y/O RECOMENDACIONES */}
            <div className="space-y-0">
              <div className="border border-black bg-white inline-block px-3 py-1 font-bold text-xs uppercase">
                6. Conclusiones y/o Recomendaciones
              </div>
              <div className="border border-black p-4 text-xs leading-relaxed min-h-[70px] whitespace-pre-line text-justify font-normal">
                {sec["6_conclusiones_recomendaciones"] || 'Recomendaciones operativas y de mantenimiento preventivo.'}
              </div>
            </div>

            {/* SECTION 7: REGISTRO FOTOGRÁFICO Y ANEXOS */}
            <div className="space-y-0">
              <div className="border border-black bg-white inline-block px-3 py-1 font-bold text-xs uppercase">
                7. Registro fotográfico y Anexos :
              </div>
              <div className="border border-black p-4 space-y-6">
                {sec["7_registro_fotografico"] && sec["7_registro_fotografico"].length > 0 ? (
                  sec["7_registro_fotografico"].map((photo, idx) => {
                    const blockImages = photo.imagenes && photo.imagenes.length > 0
                      ? photo.imagenes.filter(img => Boolean(img && img.trim()))
                      : (photo.url_o_base64 && photo.url_o_base64.trim() ? [photo.url_o_base64] : []);

                    return (
                      <div key={idx} className="border border-black bg-white flex flex-col">
                        <div className="p-3 bg-white flex items-center justify-center overflow-hidden">
                          {blockImages.length === 1 ? (
                            <img 
                              src={blockImages[0]} 
                              alt={photo.descripcion || photo.imagen_id || `Imagen ${idx + 1}`} 
                              crossOrigin="anonymous"
                              className="max-h-[330px] max-w-full object-contain"
                            />
                          ) : blockImages.length > 1 ? (
                            <div className={`w-full grid gap-3 ${
                              blockImages.length === 2 
                                ? 'grid-cols-2' 
                                : 'grid-cols-2 sm:grid-cols-3'
                            }`}>
                              {blockImages.map((imgSrc, imgI) => (
                                <div 
                                  key={imgI} 
                                  className="border border-slate-300 bg-slate-50 rounded p-1 flex items-center justify-center min-h-[160px] max-h-[240px] overflow-hidden"
                                >
                                  <img 
                                    src={imgSrc} 
                                    alt={`${photo.descripcion || 'Evidencia'} #${imgI + 1}`} 
                                    crossOrigin="anonymous"
                                    className="max-h-[220px] max-w-full object-contain"
                                  />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-slate-400 italic text-center py-8">
                              [Imagen pendiente de carga]
                            </div>
                          )}
                        </div>
                        {/* Caption Bar matching exact PDF table format */}
                        <div className="grid grid-cols-12 border-t border-black text-xs">
                          <div className="col-span-3 border-r border-black p-2 font-bold bg-white text-black flex items-center">
                            {photo.imagen_id || `Imagen ${idx + 1}`}
                          </div>
                          <div className="col-span-9 p-2 text-black font-semibold flex items-center">
                            {photo.descripcion || 'Sin descripción'}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-xs text-slate-500 py-6 italic border border-dashed border-slate-300">
                    Sin registro fotográfico adjunto
                  </div>
                )}
              </div>
            </div>

            {/* FIRMAS BLOCK */}
            <div className="border border-black mt-6">
              <div className="grid grid-cols-3 divide-x divide-black text-center text-xs font-semibold">
                
                {/* Elaborado por */}
                <div className="flex flex-col justify-between min-h-[160px] p-2 bg-white">
                  <div className="font-bold border-b border-black pb-1 uppercase text-xs">Elaborado por:</div>
                  <div className="font-extrabold text-xs uppercase text-black mt-1">{fir.elaborado_por?.nombre || 'Técnico Especialista'}</div>
                  <div className="my-auto h-16 flex items-center justify-center overflow-hidden bg-white">
                    <img 
                      src={fir.elaborado_por?.firma_image && fir.elaborado_por.firma_image.trim() ? fir.elaborado_por.firma_image : getDefaultSignatureDataUrl(fir.elaborado_por?.nombre || 'Elaborado')} 
                      alt="Firma Elaborado" 
                      crossOrigin="anonymous" 
                      className="max-h-14 max-w-full object-contain block" 
                    />
                  </div>
                  <div className="border-t border-black pt-1">
                    <div className="font-bold text-[10px] uppercase text-black">Cargo y Firma:</div>
                    <div className="font-semibold text-[11px] uppercase text-black mt-0.5">{fir.elaborado_por?.cargo || 'Técnico de Servicio'}</div>
                  </div>
                </div>

                {/* Revisado y Corregido por */}
                <div className="flex flex-col justify-between min-h-[160px] p-2 bg-white">
                  <div className="font-bold border-b border-black pb-1 uppercase text-xs">Revisado y Corregido por :</div>
                  <div className="font-extrabold text-xs uppercase text-black mt-1">{fir.revisado_por?.nombre || 'Supervisor de Taller'}</div>
                  <div className="my-auto h-16 flex items-center justify-center overflow-hidden bg-white">
                    <img 
                      src={fir.revisado_por?.firma_image && fir.revisado_por.firma_image.trim() ? fir.revisado_por.firma_image : getDefaultSignatureDataUrl(fir.revisado_por?.nombre || 'Revisado')} 
                      alt="Firma Revisado" 
                      crossOrigin="anonymous" 
                      className="max-h-14 max-w-full object-contain block" 
                    />
                  </div>
                  <div className="border-t border-black pt-1">
                    <div className="font-bold text-[10px] uppercase text-black">Cargo y Firma:</div>
                    <div className="font-semibold text-[11px] uppercase text-black mt-0.5">{fir.revisado_por?.cargo || 'Supervisor de Servicio'}</div>
                  </div>
                </div>

                {/* Aprobado por */}
                <div className="flex flex-col justify-between min-h-[160px] p-2 bg-white">
                  <div className="font-bold border-b border-black pb-1 uppercase text-xs">Aprobado por:</div>
                  <div className="font-extrabold text-xs uppercase text-black mt-1">{fir.aprobado_por?.nombre || 'Gerente de Operaciones'}</div>
                  <div className="my-auto h-16 flex items-center justify-center overflow-hidden bg-white">
                    <img 
                      src={fir.aprobado_por?.firma_image && fir.aprobado_por.firma_image.trim() ? fir.aprobado_por.firma_image : getDefaultSignatureDataUrl(fir.aprobado_por?.nombre || 'Aprobado')} 
                      alt="Firma Aprobado" 
                      crossOrigin="anonymous" 
                      className="max-h-14 max-w-full object-contain block" 
                    />
                  </div>
                  <div className="border-t border-black pt-1">
                    <div className="font-bold text-[10px] uppercase text-black">Cargo y Firma:</div>
                    <div className="font-semibold text-[11px] uppercase text-black mt-0.5">{fir.aprobado_por?.cargo || 'Gerente de Sucursal'}</div>
                  </div>
                </div>

              </div>
            </div>

            {/* Footnote */}
            <div className="text-[9px] text-slate-500 text-center uppercase tracking-wider font-mono pt-3 border-t border-slate-200">
              CONSORCIO DE COGESTIÓN VENEQUIP, S.A. • DOCUMENTO TÉCNICO OFICIAL DE SERVICIO • RIF: J404644865
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

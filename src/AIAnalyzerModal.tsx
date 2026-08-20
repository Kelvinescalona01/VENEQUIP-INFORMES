import React, { useState, useRef, useMemo } from 'react';
import { 
  Sparkles, 
  Upload, 
  FileText, 
  AlertCircle, 
  X, 
  Loader2, 
  Image as ImageIcon, 
  Camera,
  Calculator,
  Copy,
  Check,
  MessageSquare,
  Send,
  Zap,
  RotateCcw,
  CheckCircle2,
  Cpu,
  Activity,
  Sliders,
  ChevronRight
} from 'lucide-react';
import { InformeTecnico } from './types';
import { generateEngineeringCalculation, chatGeminiUniversal } from './geminiService';

interface AIAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (files: { data: string; mimeType: string; name: string }[], rawNotes: string, instructions: string) => Promise<void>;
  isLoading: boolean;
  currentReport?: InformeTecnico;
  onInsertTechnicalText?: (sectionKey: string, text: string) => void;
}

export const AIAnalyzerModal: React.FC<AIAnalyzerModalProps> = ({
  isOpen,
  onClose,
  onAnalyze,
  isLoading,
  currentReport,
  onInsertTechnicalText
}) => {
  const [activeTab, setActiveTab] = useState<'ocr' | 'calc' | 'chat'>('ocr');

  // Tab 1: OCR State
  const [rawNotes, setRawNotes] = useState('');
  const [userInstructions, setUserInstructions] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<{ data: string; mimeType: string; name: string }[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Tab 2: JavaScript Technical Calculations State
  const [calcModule, setCalcModule] = useState<'derating' | 'fuel' | 'megger' | 'sos' | 'battery' | 'unbalance' | 'custom'>('derating');
  
  // Derating State
  const [deratingModel, setDeratingModel] = useState(currentReport?.encabezado_venequip?.modelo || 'Generador / Motor Diésel');
  const [deratingKw, setDeratingKw] = useState(500);
  const [deratingPf, setDeratingPf] = useState(0.8);
  const [deratingAltitude, setDeratingAltitude] = useState(1800);
  const [deratingTemp, setDeratingTemp] = useState(35);

  // Fuel State
  const [fuelTankLiters, setFuelTankLiters] = useState(1500);
  const [fuelLoadPercent, setFuelLoadPercent] = useState(75);
  const [fuelHoursPerDay, setFuelHoursPerDay] = useState(10);
  const [fuelEngineKw, setFuelEngineKw] = useState(400);

  // Megger State
  const [meggerTestVoltage, setMeggerTestVoltage] = useState(1000);
  const [meggerR30s, setMeggerR30s] = useState(120);
  const [meggerR60s, setMeggerR60s] = useState(195);
  const [meggerR10min, setMeggerR10min] = useState(460);

  // SOS Fluid State
  const [sosFe, setSosFe] = useState(24);
  const [sosCu, setSosCu] = useState(11);
  const [sosPb, setSosPb] = useState(7);
  const [sosCr, setSosCr] = useState(2);
  const [sosAl, setSosAl] = useState(5);
  const [sosSi, setSosSi] = useState(12);

  // Battery State
  const [batteryVRest, setBatteryVRest] = useState(25.6);
  const [batteryVCranking, setBatteryVCranking] = useState(20.4);
  const [batteryAmps, setBatteryAmps] = useState(620);

  // Voltage Unbalance State
  const [vL1L2, setVL1L2] = useState(480);
  const [vL2L3, setVL2L3] = useState(478);
  const [vL3L1, setVL3L1] = useState(482);

  // AI Custom Engineering Prompt State
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGeneratingCalc, setIsGeneratingCalc] = useState(false);
  const [customCalcResult, setCustomCalcResult] = useState<{
    title: string;
    explanation: string;
    calculationText: string;
    expectedOutcome: string;
  } | null>(null);

  const [copiedText, setCopiedText] = useState(false);
  const [insertedSuccess, setInsertedSuccess] = useState(false);

  // Tab 3: Chat State
  const [chatInput, setChatInput] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'gemini'; text: string; time: string }>>([
    {
      sender: 'gemini',
      text: `Hola, soy el Asistente Técnico y de Ingeniería de Venequip S.A. Puedes consultarme sobre procedimientos de servicio, especificaciones de torques, secuencias de diagnóstico multimarca (CAT, Cummins, Perkins, Detroit) o solicitar redacción técnica.`,
      time: new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Real-time pure JavaScript calculations
  const deratingResult = useMemo(() => {
    const altDerate = deratingAltitude > 1000 ? ((deratingAltitude - 1000) / 100) * 0.01 : 0;
    const tempDerate = deratingTemp > 25 ? ((deratingTemp - 25) / 5) * 0.01 : 0;
    const totalDerate = Math.min(altDerate + tempDerate, 0.40);
    const availableKw = deratingKw * (1 - totalDerate);
    const availableKva = availableKw / (deratingPf || 0.8);
    const nominalKva = deratingKw / (deratingPf || 0.8);

    const text = `ANÁLISIS DE POTENCIA EFECTIVA Y DERATING (ISO 3046 / ESTÁNDAR VENEQUIP)
Equipo/Motor: ${deratingModel}
• Potencia Nominal de Placa: ${deratingKw.toFixed(1)} kW (${nominalKva.toFixed(1)} kVA @ FP ${deratingPf})
• Condiciones Ambientales: ${deratingAltitude} msnm | ${deratingTemp} °C
• Pérdida por Altitud: -${(altDerate * 100).toFixed(2)} %
• Pérdida por Temperatura: -${(tempDerate * 100).toFixed(2)} %
• Derating Total Aplicable: -${(totalDerate * 100).toFixed(2)} %
------------------------------------------------------------
• POTENCIA MÁXIMA DISPONIBLE: ${availableKw.toFixed(1)} kW (${availableKva.toFixed(1)} kVA)
VEREDICTO: ${totalDerate > 0.15 ? 'Se requiere ajustar la carga operacional para evitar sobrecalentamiento y emisión de humos.' : 'Condiciones de operación seguras dentro del margen admisible.'}`;

    return {
      altDerate: altDerate * 100,
      tempDerate: tempDerate * 100,
      totalDerate: totalDerate * 100,
      availableKw,
      availableKva,
      nominalKva,
      text
    };
  }, [deratingKw, deratingPf, deratingAltitude, deratingTemp, deratingModel]);

  const fuelResult = useMemo(() => {
    const deliveredKw = fuelEngineKw * (fuelLoadPercent / 100);
    const litersPerHour = deliveredKw * 0.245;
    const gph = litersPerHour / 3.78541;
    const dailyLiters = litersPerHour * fuelHoursPerDay;
    const autonomyHours = fuelTankLiters > 0 && litersPerHour > 0 ? fuelTankLiters / litersPerHour : 0;

    const text = `BALANCE DE COMBUSTIBLE Y RENDIMIENTO OPERACIONAL VENEQUIP
• Potencia Entregada: ${deliveredKw.toFixed(1)} kW (${fuelLoadPercent}% de carga)
• Consumo Específico: ${litersPerHour.toFixed(2)} Litros/hora (${gph.toFixed(2)} Galones/hora)
• Consumo por Jornada (${fuelHoursPerDay} hrs): ${dailyLiters.toFixed(2)} Litros
• Capacidad del Tanque: ${fuelTankLiters} Litros
• Autonomía Estimada: ${autonomyHours.toFixed(1)} Horas de Operación Continua
RECOMENDACIÓN: Drenar sedimentador de agua cada 50 horas de consumo continuo.`;

    return { deliveredKw, litersPerHour, gph, dailyLiters, autonomyHours, text };
  }, [fuelEngineKw, fuelLoadPercent, fuelHoursPerDay, fuelTankLiters]);

  const meggerResult = useMemo(() => {
    const dar = meggerR30s > 0 ? meggerR60s / meggerR30s : 0;
    const ip = meggerR60s > 0 ? meggerR10min / meggerR60s : 0;
    let verdict = 'AISLAMIENTO BUENO (Apto para servicio)';
    let badgeClass = 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';

    if (ip >= 2.0 && dar >= 1.6) {
      verdict = 'AISLAMIENTO EXCELENTE (Sin humedad ni contaminación iónica)';
      badgeClass = 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
    } else if (ip >= 1.5 && dar >= 1.4) {
      verdict = 'AISLAMIENTO BUENO (Dentro de norma IEEE 43)';
      badgeClass = 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30';
    } else if (ip >= 1.0) {
      verdict = 'AISLAMIENTO DUDOSO (Requiere proceso de secado o barnizado)';
      badgeClass = 'text-amber-400 bg-amber-500/20 border-amber-500/30';
    } else {
      verdict = 'AISLAMIENTO DEFICIENTE (Peligro de cortocircuito a masa)';
      badgeClass = 'text-rose-400 bg-rose-500/20 border-rose-500/30';
    }

    const text = `ENSAYO DE RESISTENCIA DE AISLAMIENTO DIELÉCTRICO (NORMA IEEE 43)
• Tensión de Ensayo: ${meggerTestVoltage} V DC
• Resistencia 30s: ${meggerR30s} MΩ | Resistencia 60s: ${meggerR60s} MΩ | Resistencia 10min: ${meggerR10min} MΩ
• Razón de Absorción Dieléctrica (DAR = R60s / R30s): ${dar.toFixed(2)}
• Índice de Polarización (IP = R10min / R60s): ${ip.toFixed(2)}
------------------------------------------------------------
DIAGNÓSTICO NORMATIVO: ${verdict}`;

    return { dar, ip, verdict, badgeClass, text };
  }, [meggerTestVoltage, meggerR30s, meggerR60s, meggerR10min]);

  const sosResult = useMemo(() => {
    const limits: Record<string, number> = { Fe: 35, Cu: 25, Pb: 15, Cr: 8, Al: 12, Si: 20 };
    const values: Record<string, number> = { Fe: sosFe, Cu: sosCu, Pb: sosPb, Cr: sosCr, Al: sosAl, Si: sosSi };
    const alerts: string[] = [];

    Object.entries(values).forEach(([metal, val]) => {
      if (val > limits[metal]) alerts.push(`${metal} (${val} ppm > ${limits[metal]} ppm)`);
    });

    const text = `ANÁLISIS DE FLUIDOS S.O.S. Y METALES DE DESGASTE
• Hierro (Fe): ${sosFe} ppm [Límite: 35 ppm] ${sosFe > 35 ? '⚠️ ALERTA' : '✓ Normal'}
• Cobre (Cu): ${sosCu} ppm [Límite: 25 ppm] ${sosCu > 25 ? '⚠️ ALERTA' : '✓ Normal'}
• Plomo (Pb): ${sosPb} ppm [Límite: 15 ppm] ${sosPb > 15 ? '⚠️ ALERTA' : '✓ Normal'}
• Cromo (Cr): ${sosCr} ppm [Límite: 8 ppm] ${sosCr > 8 ? '⚠️ ALERTA' : '✓ Normal'}
• Aluminio (Al): ${sosAl} ppm [Límite: 12 ppm] ${sosAl > 12 ? '⚠️ ALERTA' : '✓ Normal'}
• Silicio (Si): ${sosSi} ppm [Límite: 20 ppm] ${sosSi > 20 ? '⚠️ ALERTA CONTAMINACIÓN' : '✓ Normal'}
------------------------------------------------------------
VEREDICTO: ${alerts.length === 0 ? 'Aceite en condiciones normales de operación. Lubricación óptima.' : `Desgaste prematuro detectado en: ${alerts.join(', ')}.`}`;

    return { alerts, text };
  }, [sosFe, sosCu, sosPb, sosCr, sosAl, sosSi]);

  const batteryResult = useMemo(() => {
    const deltaV = batteryVRest - batteryVCranking;
    const internalR = batteryAmps > 0 ? (deltaV / batteryAmps) * 1000 : 0;
    let verdict = 'BANCO DE BATERÍAS APTO (Excelente entrega de corriente)';
    let badgeClass = 'text-emerald-400 bg-emerald-500/20';

    if (batteryVCranking >= 19.5) {
      verdict = 'BANCO DE BATERÍAS APTO (Excelente respuesta de arranque)';
      badgeClass = 'text-emerald-400 bg-emerald-500/20';
    } else if (batteryVCranking >= 18.0) {
      verdict = 'CONDICIÓN ACEPTABLE (Revisar apriete de bornes y sulfatación)';
      badgeClass = 'text-amber-400 bg-amber-500/20';
    } else {
      verdict = 'FALLA CRÍTICA: Tensión de arranque insuficiente (<18V). Riesgo de fallo.';
      badgeClass = 'text-rose-400 bg-rose-500/20';
    }

    const text = `TEST DE CARGA DE BATERÍAS DE ARRANQUE (24V DC)
• Tensión en Reposo: ${batteryVRest.toFixed(2)} V DC
• Tensión en Arranque (Cranking): ${batteryVCranking.toFixed(2)} V DC
• Caída de Tensión (ΔV): ${deltaV.toFixed(2)} V DC
• Resistencia Interna Estimada: ${internalR.toFixed(2)} mΩ
------------------------------------------------------------
EVALUACIÓN: ${verdict}`;

    return { deltaV, internalR, verdict, badgeClass, text };
  }, [batteryVRest, batteryVCranking, batteryAmps]);

  const unbalanceResult = useMemo(() => {
    const vAvg = (vL1L2 + vL2L3 + vL3L1) / 3;
    const maxDev = Math.max(
      Math.abs(vL1L2 - vAvg),
      Math.abs(vL2L3 - vAvg),
      Math.abs(vL3L1 - vAvg)
    );
    const unbalancePercent = vAvg > 0 ? (maxDev / vAvg) * 100 : 0;
    const isOk = unbalancePercent <= 2.0;

    const text = `MEDICIÓN DE DESBALANCE DE VOLTAJE TRIFÁSICO (NEMA MG-1)
• Voltaje L1-L2: ${vL1L2} V AC | L2-L3: ${vL2L3} V AC | L3-L1: ${vL3L1} V AC
• Voltaje Promedio: ${vAvg.toFixed(2)} V AC
• Desviación Máxima: ${maxDev.toFixed(2)} V AC
• Desbalance Calculado: ${unbalancePercent.toFixed(2)} % (Límite NEMA: 2.0%)
------------------------------------------------------------
VEREDICTO: ${isOk ? 'Tensión trifásica balanceada y conforme con NEMA MG-1.' : 'Desbalance elevado (> 2%). Riesgo de calentamiento excesivo en bobinados.'}`;

    return { vAvg, maxDev, unbalancePercent, isOk, text };
  }, [vL1L2, vL2L3, vL3L1]);

  // Current calculation text to copy/insert
  const activeCalculationText = useMemo(() => {
    if (calcModule === 'custom' && customCalcResult) {
      return `${customCalcResult.title}\n\n${customCalcResult.calculationText}\n\nVEREDICTO TÉCNICO:\n${customCalcResult.expectedOutcome}`;
    }
    if (calcModule === 'derating') return deratingResult.text;
    if (calcModule === 'fuel') return fuelResult.text;
    if (calcModule === 'megger') return meggerResult.text;
    if (calcModule === 'sos') return sosResult.text;
    if (calcModule === 'battery') return batteryResult.text;
    if (calcModule === 'unbalance') return unbalanceResult.text;
    return '';
  }, [calcModule, customCalcResult, deratingResult, fuelResult, meggerResult, sosResult, batteryResult, unbalanceResult]);

  // Handlers
  const processFiles = (files: FileList) => {
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAttachedFiles((prev) => [
            ...prev,
            { data: reader.result as string, mimeType: file.type || 'image/jpeg', name: file.name }
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

  const handleSubmitOCR = async (e: React.FormEvent) => {
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

  const handleGenerateCustomCalc = async () => {
    if (!customPrompt.trim()) return;
    setIsGeneratingCalc(true);
    setErrorMsg(null);
    try {
      const res = await generateEngineeringCalculation(
        customPrompt,
        currentReport?.encabezado_venequip || {}
      );
      if (res.success && res.data) {
        setCustomCalcResult(res.data);
      } else {
        setErrorMsg(res.error || 'No se pudo generar el cálculo técnico.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error comunicando con el asistente de IA.');
    } finally {
      setIsGeneratingCalc(false);
    }
  };

  const handleInsertIntoReport = (sectionKey: string) => {
    if (!activeCalculationText) return;
    const outputText = `\n\n[CÁLCULO TÉCNICO Y DIAGNÓSTICO DE INGENIERÍA VENEQUIP]:\n${activeCalculationText}`;
    if (onInsertTechnicalText) {
      onInsertTechnicalText(sectionKey, outputText);
    }
    setInsertedSuccess(true);
    setTimeout(() => setInsertedSuccess(false), 3000);
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || isChatSending) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    const nowTime = new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });

    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg, time: nowTime }]);
    setIsChatSending(true);

    try {
      const reply = await chatGeminiUniversal(userMsg, currentReport?.encabezado_venequip);
      const replyTime = new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
      setChatMessages(prev => [...prev, { sender: 'gemini', text: reply, time: replyTime }]);
    } catch (e: any) {
      const errorTime = new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
      setChatMessages(prev => [...prev, { 
        sender: 'gemini', 
        text: 'Disculpa, ocurrió un error de comunicación con el servicio de IA. Por favor reintenta en unos momentos.', 
        time: errorTime 
      }]);
    } finally {
      setIsChatSending(false);
      setTimeout(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <div 
      id="modal-ai-analyzer-backdrop" 
      className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading && !isGeneratingCalc) onClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl space-y-0 my-auto max-h-[94vh] flex flex-col animate-scaleUp">
        
        {/* Corporate Header */}
        <div className="bg-slate-950 px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-400/20 text-amber-300 p-2 rounded-xl border border-amber-400/30 shrink-0">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-slate-100">
                  Suite de Inteligencia Artificial & Motor de Cálculo Técnico
                </h3>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold">
                  Venequip Multimarca
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Consorcio de Cogestión Venequip S.A. • Ingesta OCR, diagnósticos de ingeniería y asistencia en tiempo real
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading || isGeneratingCalc}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-950/60 border-b border-slate-800 px-4 flex items-center gap-2 overflow-x-auto shrink-0 py-2">
          <button
            type="button"
            onClick={() => setActiveTab('ocr')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-black rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'ocr'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>1. Ingesta OCR & Redacción IA</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('calc')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-black rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'calc'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Calculator className="w-4 h-4 text-emerald-400" />
            <span>2. Diagnóstico & Cálculos de Ingeniería</span>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] px-1.5 py-0.2 rounded font-bold">
              Instantáneo
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-black rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-sky-400" />
            <span>3. Consultas Multimarca & Chat Técnico</span>
          </button>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="bg-rose-950/80 border-b border-rose-700/60 px-4 py-2 text-rose-300 text-xs flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-white text-xs font-bold">
              Descartar
            </button>
          </div>
        )}

        {/* TAB 1: OCR & INGESTA */}
        {activeTab === 'ocr' && (
          <form onSubmit={handleSubmitOCR} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  1. Cargar Archivos Insumo (Fotos de constancias, placas de motor, mediciones, PDF)
                </label>
                <span className="text-[11px] text-slate-400">
                  {attachedFiles.length} {attachedFiles.length === 1 ? 'archivo listo' : 'archivos listos'}
                </span>
              </div>
              
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files) processFiles(e.dataTransfer.files); }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 sm:p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                  isDragging
                    ? 'border-amber-400 bg-amber-400/10'
                    : 'border-slate-700 hover:border-amber-400/60 bg-slate-950/40 hover:bg-slate-950/70'
                }`}
              >
                <div className="p-3 bg-amber-500/10 rounded-full text-amber-400 border border-amber-500/20">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-xs text-slate-300 font-semibold">
                  <span>Haz clic o arrastra fotos de constancias físicas, hojas de servicio o reportes PDF</span>
                </div>
                <p className="text-[11px] text-slate-500">Formatos soportados: JPG, PNG, WEBP, PDF (Sin límite de tamaño)</p>
                
                <div className="mt-2 flex flex-wrap gap-2 justify-center" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-600 rounded-lg text-xs font-bold transition shadow-sm"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Tomar Foto con Cámara (Móvil / Tablet)</span>
                  </button>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFileUpload}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileUpload}
              />

              {attachedFiles.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                  {attachedFiles.map((file, idx) => (
                    <div 
                      key={idx} 
                      className="bg-slate-800/80 border border-slate-700 rounded-lg p-2.5 flex items-center justify-between text-xs group"
                    >
                      <div className="flex items-center space-x-2.5 overflow-hidden">
                        {file.mimeType.startsWith('image/') ? (
                          <div className="w-8 h-8 rounded bg-slate-900 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                            <img src={file.data} alt={file.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded bg-rose-950/60 border border-rose-800/60 shrink-0 flex items-center justify-center text-rose-300">
                            <FileText className="w-4 h-4" />
                          </div>
                        )}
                        <span className="truncate font-medium text-slate-200">{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAttachedFiles(prev => prev.filter((_, i) => i !== idx));
                        }}
                        className="text-slate-400 hover:text-rose-400 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                2. Notas Técnicas de Campo (Opcional)
              </label>
              <textarea
                value={rawNotes}
                onChange={(e) => setRawNotes(e.target.value)}
                rows={3}
                placeholder="Escribe anotaciones rápidas, mediciones tomadas en sitio o datos adicionales..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                3. Instrucciones de Enfoque para la Redacción (Opcional)
              </label>
              <input
                type="text"
                value={userInstructions}
                onChange={(e) => setUserInstructions(e.target.value)}
                placeholder="Ej: Enfatizar en cambio de sellos hidráulicos y calibración de presiones..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading || (attachedFiles.length === 0 && !rawNotes.trim())}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black flex items-center space-x-2 transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Analizando y Redactando con IA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>Estructurar Informe Oficial Venequip</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: INSTANT JAVASCRIPT ENGINEERING CALCULATIONS */}
        {activeTab === 'calc' && (
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
            
            {/* Calculation Module Selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs shrink-0">
              {[
                { id: 'derating', label: '⚡ Derating (Altitud/Temp)' },
                { id: 'fuel', label: '⛽ Consumo & Autonomía' },
                { id: 'megger', label: '🔌 Megóhmetro (IEEE 43)' },
                { id: 'sos', label: '🧪 Metales S.O.S. (ppm)' },
                { id: 'battery', label: '🔋 Banco Baterías (24V)' },
                { id: 'unbalance', label: '⚡ Desbalance NEMA' },
                { id: 'custom', label: '✨ Asistente IA Especial' },
              ].map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setCalcModule(m.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-black transition-all whitespace-nowrap cursor-pointer ${
                    calcModule === m.id
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* MODULE: DERATING */}
            {calcModule === 'derating' && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">
                    Cálculo de Derating por Altitud y Temperatura (ISO 3046)
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">Reactivo en tiempo real</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Potencia Nominal (kW)</label>
                    <input
                      type="number"
                      value={deratingKw}
                      onChange={(e) => setDeratingKw(Number(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-amber-300 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Factor de Potencia (FP)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={deratingPf}
                      onChange={(e) => setDeratingPf(Number(e.target.value) || 0.8)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Altitud (msnm)</label>
                    <input
                      type="number"
                      value={deratingAltitude}
                      onChange={(e) => setDeratingAltitude(Number(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Temperatura Ambiente (°C)</label>
                    <input
                      type="number"
                      value={deratingTemp}
                      onChange={(e) => setDeratingTemp(Number(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">Derating Altitud</span>
                    <span className="text-sm font-black text-rose-400">-{deratingResult.altDerate.toFixed(1)}%</span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">Derating Temp</span>
                    <span className="text-sm font-black text-amber-400">-{deratingResult.tempDerate.toFixed(1)}%</span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">Derating Total</span>
                    <span className="text-sm font-black text-rose-300">-{deratingResult.totalDerate.toFixed(1)}%</span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">Potencia Disponible</span>
                    <span className="text-sm font-black text-emerald-400">{deratingResult.availableKw.toFixed(0)} kW</span>
                  </div>
                </div>
              </div>
            )}

            {/* MODULE: FUEL */}
            {calcModule === 'fuel' && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">
                    Balance de Combustible Diésel y Autonomía de Tanque
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">Consumo específico ISO</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Potencia Motor (kW)</label>
                    <input
                      type="number"
                      value={fuelEngineKw}
                      onChange={(e) => setFuelEngineKw(Number(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-amber-300 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">% Carga Operacional</label>
                    <input
                      type="number"
                      value={fuelLoadPercent}
                      onChange={(e) => setFuelLoadPercent(Number(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Capacidad Tanque (L)</label>
                    <input
                      type="number"
                      value={fuelTankLiters}
                      onChange={(e) => setFuelTankLiters(Number(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Horas Operación / Día</label>
                    <input
                      type="number"
                      value={fuelHoursPerDay}
                      onChange={(e) => setFuelHoursPerDay(Number(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">Consumo Horario</span>
                    <span className="text-sm font-black text-amber-300">{fuelResult.litersPerHour.toFixed(1)} L/h</span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">Consumo Galones</span>
                    <span className="text-sm font-black text-slate-300">{fuelResult.gph.toFixed(1)} GPH</span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">Consumo Diario</span>
                    <span className="text-sm font-black text-rose-300">{fuelResult.dailyLiters.toFixed(0)} L/día</span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">Autonomía</span>
                    <span className="text-sm font-black text-emerald-400">{fuelResult.autonomyHours.toFixed(1)} hrs</span>
                  </div>
                </div>
              </div>
            )}

            {/* MODULE: MEGGER */}
            {calcModule === 'megger' && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">
                    Ensayo de Aislamiento Dieléctrico Megóhmetro (Norma IEEE 43)
                  </h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${meggerResult.badgeClass}`}>
                    {meggerResult.verdict.split('(')[0]}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Tensión Ensayo (V DC)</label>
                    <input
                      type="number"
                      value={meggerTestVoltage}
                      onChange={(e) => setMeggerTestVoltage(Number(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-amber-300 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">R 30s (MΩ)</label>
                    <input
                      type="number"
                      value={meggerR30s}
                      onChange={(e) => setMeggerR30s(Number(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">R 60s (MΩ)</label>
                    <input
                      type="number"
                      value={meggerR60s}
                      onChange={(e) => setMeggerR60s(Number(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">R 10min (MΩ)</label>
                    <input
                      type="number"
                      value={meggerR10min}
                      onChange={(e) => setMeggerR10min(Number(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">DAR (R60s / R30s)</span>
                    <span className="text-lg font-black text-emerald-400">{meggerResult.dar.toFixed(2)}</span>
                    <span className="text-[10px] text-slate-500 block">Norma: ≥ 1.6 Excelente</span>
                  </div>
                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">Índice Polarización (IP)</span>
                    <span className="text-lg font-black text-emerald-400">{meggerResult.ip.toFixed(2)}</span>
                    <span className="text-[10px] text-slate-500 block">Norma: ≥ 2.0 Excelente</span>
                  </div>
                </div>
              </div>
            )}

            {/* MODULE: SOS FLUIDS */}
            {calcModule === 'sos' && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">
                    Matriz de Análisis de Fluidos S.O.S. (Metales en ppm)
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">Límites ASTM / Venequip</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-300 block mb-1">Hierro Fe (max 35)</label>
                    <input
                      type="number"
                      value={sosFe}
                      onChange={(e) => setSosFe(Number(e.target.value) || 0)}
                      className={`w-full bg-slate-900 border rounded-lg p-2 text-xs font-bold ${sosFe > 35 ? 'border-rose-500 text-rose-400' : 'border-slate-700 text-emerald-400'}`}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-300 block mb-1">Cobre Cu (max 25)</label>
                    <input
                      type="number"
                      value={sosCu}
                      onChange={(e) => setSosCu(Number(e.target.value) || 0)}
                      className={`w-full bg-slate-900 border rounded-lg p-2 text-xs font-bold ${sosCu > 25 ? 'border-rose-500 text-rose-400' : 'border-slate-700 text-emerald-400'}`}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-300 block mb-1">Plomo Pb (max 15)</label>
                    <input
                      type="number"
                      value={sosPb}
                      onChange={(e) => setSosPb(Number(e.target.value) || 0)}
                      className={`w-full bg-slate-900 border rounded-lg p-2 text-xs font-bold ${sosPb > 15 ? 'border-rose-500 text-rose-400' : 'border-slate-700 text-emerald-400'}`}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-300 block mb-1">Cromo Cr (max 8)</label>
                    <input
                      type="number"
                      value={sosCr}
                      onChange={(e) => setSosCr(Number(e.target.value) || 0)}
                      className={`w-full bg-slate-900 border rounded-lg p-2 text-xs font-bold ${sosCr > 8 ? 'border-rose-500 text-rose-400' : 'border-slate-700 text-emerald-400'}`}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-300 block mb-1">Aluminio Al (max 12)</label>
                    <input
                      type="number"
                      value={sosAl}
                      onChange={(e) => setSosAl(Number(e.target.value) || 0)}
                      className={`w-full bg-slate-900 border rounded-lg p-2 text-xs font-bold ${sosAl > 12 ? 'border-rose-500 text-rose-400' : 'border-slate-700 text-emerald-400'}`}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-300 block mb-1">Silicio Si (max 20)</label>
                    <input
                      type="number"
                      value={sosSi}
                      onChange={(e) => setSosSi(Number(e.target.value) || 0)}
                      className={`w-full bg-slate-900 border rounded-lg p-2 text-xs font-bold ${sosSi > 20 ? 'border-rose-500 text-rose-400' : 'border-slate-700 text-emerald-400'}`}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* MODULE: BATTERY */}
            {calcModule === 'battery' && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">
                    Diagnóstico de Banco de Baterías 24V DC en Arranque (Cranking)
                  </h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${batteryResult.badgeClass}`}>
                    {batteryResult.verdict.split('(')[0]}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Voltaje en Reposo (V DC)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={batteryVRest}
                      onChange={(e) => setBatteryVRest(Number(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-amber-300 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Voltaje en Cranking (V DC)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={batteryVCranking}
                      onChange={(e) => setBatteryVCranking(Number(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Corriente de Arranque (A)</label>
                    <input
                      type="number"
                      value={batteryAmps}
                      onChange={(e) => setBatteryAmps(Number(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">Caída de Tensión (ΔV)</span>
                    <span className="text-lg font-black text-amber-400">{batteryResult.deltaV.toFixed(2)} V</span>
                  </div>
                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">Resistencia Interna</span>
                    <span className="text-lg font-black text-emerald-400">{batteryResult.internalR.toFixed(2)} mΩ</span>
                  </div>
                </div>
              </div>
            )}

            {/* MODULE: UNBALANCE */}
            {calcModule === 'unbalance' && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">
                    Desbalance de Voltaje Trifásico en Generadores (NEMA MG-1)
                  </h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${unbalanceResult.isOk ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                    {unbalanceResult.isOk ? '✓ Balanceado (<2%)' : '⚠️ Desbalance Crítico'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Voltaje L1 - L2 (V AC)</label>
                    <input
                      type="number"
                      value={vL1L2}
                      onChange={(e) => setVL1L2(Number(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-amber-300 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Voltaje L2 - L3 (V AC)</label>
                    <input
                      type="number"
                      value={vL2L3}
                      onChange={(e) => setVL2L3(Number(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Voltaje L3 - L1 (V AC)</label>
                    <input
                      type="number"
                      value={vL3L1}
                      onChange={(e) => setVL3L1(Number(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">Voltaje Promedio</span>
                    <span className="text-lg font-black text-slate-200">{unbalanceResult.vAvg.toFixed(1)} V AC</span>
                  </div>
                  <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block font-bold">% Desbalance NEMA</span>
                    <span className={`text-lg font-black ${unbalanceResult.isOk ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {unbalanceResult.unbalancePercent.toFixed(2)} %
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* MODULE: CUSTOM AI ASSISTANT */}
            {calcModule === 'custom' && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">
                    Asistente de Cálculos de Ingeniería Personalizados con IA
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">Gemini Multimarca</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Ej: Calcular calibre de conductor para 480V, 300 metros, 250A con caída < 3%..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleGenerateCustomCalc();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleGenerateCustomCalc}
                    disabled={isGeneratingCalc || !customPrompt.trim()}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-sm shrink-0"
                  >
                    {isGeneratingCalc ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>Calcular con IA</span>
                  </button>
                </div>
              </div>
            )}

            {/* TECHNICAL RESULT CARD & INSERTION CONTROLS */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 animate-scaleUp">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-slate-200">Desglose Técnico Formateado para Informe</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(activeCalculationText);
                      setCopiedText(true);
                      setTimeout(() => setCopiedText(false), 2000);
                    }}
                    className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-lg transition"
                  >
                    {copiedText ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedText ? 'Copiado' : 'Copiar'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleInsertIntoReport('3_pruebas_actividades')}
                    className="text-[11px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3 h-3 text-amber-400" />
                    <span>Insertar en Secc. 3 (Pruebas)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleInsertIntoReport('6_conclusiones_recomendaciones')}
                    className="text-[11px] bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3 h-3 text-sky-400" />
                    <span>Insertar en Secc. 6 (Conclusiones)</span>
                  </button>
                </div>
              </div>

              {insertedSuccess && (
                <div className="bg-emerald-950/80 border border-emerald-600/60 p-2 rounded-lg text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>¡Resultados del cálculo insertados correctamente en el informe técnico!</span>
                </div>
              )}

              <pre className="font-mono text-xs text-slate-100 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                {activeCalculationText || '(Configura los parámetros para ver el resultado técnico)'}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 3: LIVE MULTIBRAND CHAT */}
        {activeTab === 'chat' && (
          <div className="flex flex-col flex-1 overflow-hidden p-4 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs shrink-0">
              <span className="text-slate-500 text-[11px] font-bold shrink-0">Sugerencias:</span>
              {[
                "Códigos de falla MID 036 CID 0100 FMI 04",
                "Torque de culata motor CAT C15 / Cummins QSK",
                "Procedimiento toma de muestra SOS",
                "Límites de vibración según ISO 10816",
                "Holgura de válvulas de escape C18 / Perkins"
              ].map((chip, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setChatInput(chip)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap transition cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>

            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-y-auto space-y-3 min-h-[260px] max-h-[380px]">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none'
                        : 'bg-slate-800/90 text-slate-100 border border-slate-700 rounded-tl-none'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 pb-1 border-b border-black/10 text-[10px] opacity-75 font-bold">
                      {msg.sender === 'user' ? (
                        <span>Tú (Técnico Venequip)</span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-300">
                          <Sparkles className="w-3 h-3" />
                          <span>Asistente Técnico Venequip</span>
                        </span>
                      )}
                      <span>• {msg.time}</span>
                    </div>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              ))}
              {isChatSending && (
                <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/50 p-3 rounded-2xl max-w-xs border border-slate-700 animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Consultando manuales y base técnica...</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            <div className="flex gap-2 shrink-0">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Pregunta sobre códigos de falla, torques, diagramas o procedimientos..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendChat();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleSendChat}
                disabled={isChatSending || !chatInput.trim()}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

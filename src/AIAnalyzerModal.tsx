import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Upload, 
  FileText, 
  AlertCircle, 
  X, 
  Loader2, 
  Image as ImageIcon, 
  Camera,
  Terminal,
  Play,
  Copy,
  Check,
  Download,
  MessageSquare,
  Send,
  Zap,
  Sliders,
  RotateCcw,
  CheckCircle2,
  Cpu,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { InformeTecnico } from './types';
import { executePythonCode, generateGeminiPython, chatGeminiUniversal } from './geminiService';

interface AIAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (files: { data: string; mimeType: string; name: string }[], rawNotes: string, instructions: string) => Promise<void>;
  isLoading: boolean;
  currentReport?: InformeTecnico;
  onInsertTechnicalText?: (sectionKey: string, text: string) => void;
}

// Built-in Python Diagnostics Templates for Caterpillar Machinery & Power Generation
const PYTHON_TEMPLATES = [
  {
    id: 'derating',
    name: '⚡ Curva de Potencia & Derating Cat (Altitud / Temp)',
    description: 'Calcula pérdida de potencia por altitud (msnm) y temperatura ambiente según ISO 3046 / Cat SIS.',
    code: `# CÁLCULO DE POTENCIA EFECTIVA Y DERATING CATERPILLAR
# Basado en estándares ISO 3046 / Caterpillar SIS

modelo_motor = "CAT C15 ACERT"
potencia_nominal_kw = 400.0  # kW nominales a nivel del mar
factor_potencia = 0.80
altitud_msnm = 2200.0        # Metros sobre el nivel del mar
temp_ambiente_c = 38.0       # Grados Celsius en sala / faena

# Factor de derating por altitud (1% cada 100m sobre 1000m)
derating_altitud = 0.0
if altitud_msnm > 1000.0:
    derating_altitud = ((altitud_msnm - 1000.0) / 100.0) * 0.01

# Factor de derating por temperatura (1% cada 5°C sobre 25°C)
derating_temp = 0.0
if temp_ambiente_c > 25.0:
    derating_temp = ((temp_ambiente_c - 25.0) / 5.0) * 0.01

derating_total = min(derating_altitud + derating_temp, 0.40)
factor_disponibilidad = 1.0 - derating_total
potencia_disponible_kw = potencia_nominal_kw * factor_disponibilidad
potencia_disponible_kva = potencia_disponible_kw / factor_potencia

print("=" * 60)
print(f"DIAGNÓSTICO ELECTROMECÁNICO VENEQUIP: {modelo_motor}")
print("=" * 60)
print(f"Potencia Nominal de Placa:      {potencia_nominal_kw:.2f} kW ({potencia_nominal_kw/factor_potencia:.2f} kVA)")
print(f"Condiciones de Operación:       {altitud_msnm:.0f} msnm | {temp_ambiente_c:.1f} °C")
print(f"Pérdida por Altitud:            -{derating_altitud*100:.2f} %")
print(f"Pérdida por Temperatura:        -{derating_temp*100:.2f} %")
print(f"Derating Total Aplicable:       -{derating_total*100:.2f} %")
print("-" * 60)
print(f"POTENCIA MÁXIMA DISPONIBLE:     {potencia_disponible_kw:.2f} kW ({potencia_disponible_kva:.2f} kVA)")
print("=" * 60)
if derating_total > 0.15:
    print("VEREDICTO: Se requiere ajuste de carga operacional para evitar sobrecalentamiento y humo negro.")
else:
    print("VEREDICTO: Condiciones de desclasificación dentro del margen operativo seguro.")
`
  },
  {
    id: 'fuel',
    name: '⛽ Cálculo de Consumo de Combustible Cat (L/h según Carga)',
    description: 'Determina el consumo horario, autonomía del tanque y costo operativo a distintos regímenes.',
    code: `# ANÁLISIS DE EFICIENCIA Y CONSUMO ESPECÍFICO DE DIESEL
# Consorcio de Cogestión Venequip S.A.

modelo = "CAT 3512B / Generador 1250 kVA"
capacidad_tanque_litros = 2000.0
horas_trabajo_dia = 12.0
porcentaje_carga = 75.0  # Carga promedio al 75%

# Tasa de consumo específico aproximada Cat (0.245 L/kWh)
potencia_nominal_kw = 1000.0
potencia_entregada_kw = potencia_nominal_kw * (porcentaje_carga / 100.0)
consumo_litros_hora = potencia_entregada_kw * 0.245
consumo_galones_hora = consumo_litros_hora / 3.78541

consumo_diario = consumo_litros_hora * horas_trabajo_dia
autonomia_horas = capacidad_tanque_litros / consumo_litros_hora

print("=" * 60)
print(f"BALANCE DE COMBUSTIBLE VENEQUIP: {modelo}")
print("=" * 60)
print(f"Régimen de Operación:          {porcentaje_carga:.1f}% ({potencia_entregada_kw:.1f} kW)")
print(f"Consumo Horario Calculado:     {consumo_litros_hora:.2f} Litros/hora ({consumo_galones_hora:.2f} GPH)")
print(f"Consumo por Jornada ({horas_trabajo_dia:.0f}h):      {consumo_diario:.2f} Litros")
print(f"Autonomía del Tanque ({capacidad_tanque_litros:.0f}L):   {autonomia_horas:.1f} Horas de Servicio Continuo")
print("=" * 60)
print("RECOMENDACIÓN: Realizar drenaje de agua del separador primario cada 50 horas de consumo continuo.")
`
  },
  {
    id: 'megger',
    name: '🔌 Aislamiento Megger (IEEE 43 - DAR & IP)',
    description: 'Evalúa Índice de Polarización (IP = R10min/R1min) y Razón de Absorción Dieléctrica (DAR).',
    code: `# EVALUACIÓN DE RESISTENCIA DE AISLAMIENTO SEGÚN NORMA IEEE 43
# Ensayos de Megóhmetro en Estator / Generador Principal

voltaje_prueba_vdc = 1000.0 # Voltios DC aplicados
r_30s_mohm = 120.0          # Resistencia a los 30 segundos (MΩ)
r_60s_mohm = 190.0          # Resistencia a los 60 segundos (MΩ)
r_10min_mohm = 450.0        # Resistencia a los 10 minutos (MΩ)

dar = r_60s_mohm / r_30s_mohm
ip = r_10min_mohm / r_60s_mohm

print("=" * 60)
print("INSPECCIÓN DIELÉCTRICA DE AISLAMIENTO ELÉCTRICO")
print("=" * 60)
print(f"Tensión de Prueba:             {voltaje_prueba_vdc:.0f} V DC")
print(f"R30s: {r_30s_mohm} MΩ | R60s: {r_60s_mohm} MΩ | R10min: {r_10min_mohm} MΩ")
print(f"DAR (R60s / R30s):             {dar:.2f}")
print(f"Índice Polarización (IP):      {ip:.2f}")
print("-" * 60)

# Veredicto normativo IEEE 43
if ip >= 2.0 and dar >= 1.6:
    veredicto = "AISLAMIENTO EXCELENTE (Sin humedad ni contaminación iónica)"
elif ip >= 1.5 and dar >= 1.4:
    veredicto = "AISLAMIENTO BUENO (Apto para servicio normal continuo)"
elif ip >= 1.0:
    veredicto = "AISLAMIENTO DUDOSO (Presencia leve de humedad. Requiere secado y limpieza)"
else:
    veredicto = "PELIGRO: AISLAMIENTO DEFICIENTE (Riesgo inminente de cortocircuito a masa)"

print(f"DIAGNÓSTICO NORMATIVO: {veredicto}")
print("=" * 60)
`
  },
  {
    id: 'sos_fluids',
    name: '🧪 Análisis de Muestras SOS & Metales de Desgaste (ppm)',
    description: 'Diagnostica desgaste prematuro en cojinetes, camisas y anillos comparando con tablas Caterpillar.',
    code: `# EVALUACIÓN DE ANÁLISIS DE FLUIDOS S•O•S CATERPILLAR
# Comparación de partículas por millón (PPM) vs umbrales permisibles

horas_aceite = 250
fe_ppm = 28.0    # Hierro (Camisas, cigüeñal, engranajes) - Límite Cat: 35 ppm
cu_ppm = 12.0    # Cobre (Bujes, enfriador, cojinetes) - Límite Cat: 25 ppm
pb_ppm = 8.0     # Plomo (Cojinetes de biela/bancada) - Límite Cat: 15 ppm
cr_ppm = 3.0     # Cromo (Anillos de pistón) - Límite Cat: 8 ppm
al_ppm = 6.0     # Aluminio (Pistones) - Límite Cat: 12 ppm
si_ppm = 14.0    # Silicio (Polvo/Tierra externa) - Límite Cat: 20 ppm

limites = {'Fe': 35.0, 'Cu': 25.0, 'Pb': 15.0, 'Cr': 8.0, 'Al': 12.0, 'Si': 20.0}
valores = {'Fe': fe_ppm, 'Cu': cu_ppm, 'Pb': pb_ppm, 'Cr': cr_ppm, 'Al': al_ppm, 'Si': si_ppm}

print("=" * 60)
print(f"LABORATORIO S•O•S VENEQUIP - REPORTE DE DESGASTE ({horas_aceite} hrs)")
print("=" * 60)
alertas = []
for metal, ppm in valores.items():
    lim = limites[metal]
    pct = (ppm / lim) * 100.0
    estado = "NORMAL" if ppm <= lim else "¡ALERTA EXCEDIDO!"
    if ppm > lim: alertas.append(metal)
    print(f"Metal {metal:2s}:  {ppm:5.1f} ppm / Límite {lim:4.1f} ppm ({pct:5.1f}%) -> {estado}")

print("-" * 60)
if not alertas:
    print("VEREDICTO: Aceite en condiciones óptimas de lubricación. Desgaste normal.")
else:
    print(f"VEREDICTO: Desgaste crítico en elementos con: {', '.join(alertas)}. Tomar contramedidas.")
print("=" * 60)
`
  },
  {
    id: 'battery',
    name: '🔋 Diagnóstico de Baterías 24V/12V en Arranque (Cranking)',
    description: 'Evalúa caída de tensión bajo carga de arranque y resistencia interna del banco.',
    code: `# EVALUACIÓN DE SISTEMA DE ARRANQUE Y BANCO DE BATERÍAS
v_reposo = 25.6        # Voltios en circuito abierto (Reposado > 2 horas)
v_cranking = 20.2      # Voltios mínimos durante el ciclo de arranque
corriente_arranque_a = 650.0 # Amperios demandados por el motor de arranque
temp_bateria_c = 28.0

caida_tension_v = v_reposo - v_cranking
resistencia_interna_mohm = (caida_tension_v / corriente_arranque_a) * 1000.0

print("=" * 60)
print("TEST DE CARGA DE BATERÍAS DE ARRANQUE (24V DC)")
print("=" * 60)
print(f"Tensión en Reposo:             {v_reposo:.2f} V DC (100% Carga Teórica)")
print(f"Tensión en Pleno Cranking:     {v_cranking:.2f} V DC")
print(f"Caída de Tensión (ΔV):         {caida_tension_v:.2f} V DC")
print(f"Resistencia Interna del Banco: {resistencia_interna_mohm:.2f} mΩ")
print("-" * 60)

if v_cranking >= 19.5:
    veredicto = "BANCO DE BATERÍAS APTO (Excelente entrega de corriente de arranque)"
elif v_cranking >= 18.0:
    veredicto = "CONDICIÓN ACEPTABLE (Monitorear densidad del electrolito y bornes)"
else:
    veredicto = "FALLA CRÍTICA: Tensión de arranque inferior a 18V. Riesgo de fallo de encendido."

print(f"EVALUACIÓN: {veredicto}")
print("=" * 60)
`
  }
];

export const AIAnalyzerModal: React.FC<AIAnalyzerModalProps> = ({
  isOpen,
  onClose,
  onAnalyze,
  isLoading,
  currentReport,
  onInsertTechnicalText
}) => {
  const [activeTab, setActiveTab] = useState<'ocr' | 'python' | 'chat'>('ocr');

  // Tab 1: OCR State
  const [rawNotes, setRawNotes] = useState('');
  const [userInstructions, setUserInstructions] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<{ data: string; mimeType: string; name: string }[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Tab 2: Python Code & Engine State
  const [selectedTemplateId, setSelectedTemplateId] = useState('derating');
  const [pythonCode, setPythonCode] = useState(PYTHON_TEMPLATES[0].code);
  const [pythonPrompt, setPythonPrompt] = useState('');
  const [isGeneratingPython, setIsGeneratingPython] = useState(false);
  const [isRunningPython, setIsRunningPython] = useState(false);
  const [pythonOutput, setPythonOutput] = useState<{
    stdout: string;
    stderr: string;
    exitCode: number | null;
    executionTimeMs: number;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [insertedSuccess, setInsertedSuccess] = useState(false);

  // Tab 3: Chat State
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'gemini'; text: string; time: string }>>([
    {
      sender: 'gemini',
      text: '¡Hola! Soy el Asistente Técnico y de Ingeniería Venequip con IA Gemini 3.7. ¿En qué diagnóstico, código de falla Caterpillar, prueba electromecánica o cálculo en Python te puedo ayudar hoy?',
      time: new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatSending, setIsChatSending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // File handling for OCR
  const processFiles = (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    files.forEach((file: File) => {
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

  // Python Execution Handler
  const handleRunPython = async () => {
    if (!pythonCode.trim()) return;
    setIsRunningPython(true);
    setErrorMsg(null);
    try {
      const res = await executePythonCode(pythonCode);
      setPythonOutput({
        stdout: res.stdout || '',
        stderr: res.stderr || '',
        exitCode: res.exitCode,
        executionTimeMs: res.executionTimeMs || 0
      });
    } catch (err: any) {
      setPythonOutput({
        stdout: '',
        stderr: err.message || 'Error al ejecutar Python.',
        exitCode: 1,
        executionTimeMs: 0
      });
    } finally {
      setIsRunningPython(false);
    }
  };

  // Python Generation with Gemini
  const handleGeneratePythonWithGemini = async () => {
    if (!pythonPrompt.trim()) return;
    setIsGeneratingPython(true);
    setErrorMsg(null);
    try {
      const res = await generateGeminiPython(
        pythonPrompt,
        currentReport?.encabezado_venequip || {},
        true
      );

      if (res.success && res.data?.pythonCode) {
        setPythonCode(res.data.pythonCode);
        if (res.executionResult) {
          setPythonOutput(res.executionResult);
        }
      } else {
        setErrorMsg(res.error || 'No se pudo generar el código Python.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error comunicando con Gemini.');
    } finally {
      setIsGeneratingPython(false);
    }
  };

  // Insert Python output into report
  const handleInsertIntoReport = (sectionKey: string) => {
    if (!pythonOutput || !pythonOutput.stdout) return;
    const outputText = `\n\n[ANÁLISIS Y CÁLCULO TÉCNICO EN PYTHON (MOTOR CATERPILLAR)]:\n${pythonOutput.stdout}`;
    if (onInsertTechnicalText) {
      onInsertTechnicalText(sectionKey, outputText);
    }
    setInsertedSuccess(true);
    setTimeout(() => setInsertedSuccess(false), 3000);
  };

  // Chat Send Handler
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
        text: 'Disculpa, ocurrió un error de comunicación con el servicio de IA Gemini. Por favor reintenta en unos momentos.', 
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
        if (e.target === e.currentTarget && !isLoading && !isRunningPython && !isGeneratingPython) onClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl space-y-0 my-auto max-h-[94vh] flex flex-col animate-scaleUp">
        
        {/* Top Corporate Header */}
        <div className="bg-slate-950 px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-400/20 text-amber-300 p-2 rounded-xl border border-amber-400/30 shrink-0">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-slate-100">
                  Suite de Inteligencia Artificial & Python
                </h3>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-mono font-bold">
                  Gemini 3.7 Flash + Python 3
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Consorcio de Cogestión Venequip S.A. • Ingesta OCR, scripts de diagnóstico y asistencia en tiempo real
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading || isRunningPython}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Bar */}
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
            onClick={() => setActiveTab('python')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-black rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'python'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>2. Diagnóstico & Código Python</span>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] px-1.5 py-0.2 rounded font-mono">
              Live
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
            <span>3. Consultas SIS & Chat Técnico</span>
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
            
            {/* Drag & Drop File Upload Area */}
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
                
                {/* Mobile Camera Direct Button */}
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

              {/* Hidden Inputs */}
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

              {/* Attached Files List */}
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
                        <span className="text-slate-200 truncate font-medium max-w-[180px] sm:max-w-[220px]">
                          {file.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-rose-400 p-1 rounded transition-colors"
                        title="Eliminar archivo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Field Notes Area */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                2. Notas Rápidas de Campo o Datos de Voz (Opcional)
              </label>
              <textarea
                value={rawNotes}
                onChange={(e) => setRawNotes(e.target.value)}
                placeholder="Ejemplo: Se atendió planta CAT C15 en Planta Polar. Horómetro 4,250 hrs. Tensión 440V, frecuencia 60Hz. Falla detectada en solenoide de parada y fuga leve en sello de bomba de agua..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
              />
            </div>

            {/* Custom Instructions */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                3. Instrucciones Especiales para Gemini IA
              </label>
              <input
                type="text"
                value={userInstructions}
                onChange={(e) => setUserInstructions(e.target.value)}
                placeholder="Ejemplo: Priorizar protocolo de mantenimiento PM2 de 500 horas y agregar lista de repuestos requeridos..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black flex items-center space-x-2 transition shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Analizando con Gemini 3.7...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>Estructurar y Generar Informe Completo</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: PYTHON DIAGNOSTICS & EXECUTION */}
        {activeTab === 'python' && (
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
            
            {/* Top Bar: Template Selector & Prompt Bar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1">
                  Plantillas de Diagnóstico Caterpillar / Venequip
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => {
                    const tId = e.target.value;
                    setSelectedTemplateId(tId);
                    const found = PYTHON_TEMPLATES.find(t => t.id === tId);
                    if (found) {
                      setPythonCode(found.code);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-700 text-xs text-amber-300 font-semibold rounded-xl p-2.5 focus:outline-none focus:border-amber-400"
                >
                  {PYTHON_TEMPLATES.map(t => (
                    <option key={t.id} value={t.id} className="bg-slate-900 text-slate-100">
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Gemini Python Code Generator */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1">
                  Generar Nuevo Cálculo en Python con Gemini IA
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={pythonPrompt}
                    onChange={(e) => setPythonPrompt(e.target.value)}
                    placeholder="Ej: Calcular caída de tensión en cable de 150m..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleGeneratePythonWithGemini();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleGeneratePythonWithGemini}
                    disabled={isGeneratingPython || !pythonPrompt.trim()}
                    className="px-3 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 transition disabled:opacity-50 shrink-0 cursor-pointer shadow-sm"
                  >
                    {isGeneratingPython ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>Generar con IA</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Python Code Editor */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-300 font-bold">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>Editor de Código Python 3</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(pythonCode);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg transition"
                  >
                    {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode ? 'Copiado' : 'Copiar'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const blob = new Blob([pythonCode], { type: 'text/x-python' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `calculo_venequip_${selectedTemplateId}.py`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg transition"
                  >
                    <Download className="w-3 h-3" />
                    <span>Descargar .py</span>
                  </button>
                </div>
              </div>

              <textarea
                value={pythonCode}
                onChange={(e) => setPythonCode(e.target.value)}
                rows={10}
                spellCheck={false}
                className="w-full bg-slate-950 border border-slate-700 font-mono text-xs text-emerald-300 p-3 rounded-xl focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition leading-relaxed resize-y"
              />
            </div>

            {/* Run Button and Output Console */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={handleRunPython}
                disabled={isRunningPython || !pythonCode.trim()}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black flex items-center justify-center space-x-2 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isRunningPython ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Ejecutando en Servidor Python...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 text-slate-950 fill-current" />
                    <span>▶ Ejecutar Código Python</span>
                  </>
                )}
              </button>

              {pythonOutput && (
                <div className="text-[11px] text-slate-400 flex items-center gap-3">
                  <span>Tiempo: <strong>{pythonOutput.executionTimeMs} ms</strong></span>
                  <span className={`px-2 py-0.5 rounded-full font-bold ${
                    pythonOutput.exitCode === 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {pythonOutput.exitCode === 0 ? '✓ Exitoso (Exit 0)' : `✕ Error (Exit ${pythonOutput.exitCode})`}
                  </span>
                </div>
              )}
            </div>

            {/* Terminal Output Window */}
            {pythonOutput && (
              <div className="space-y-2 bg-slate-950 border border-slate-800 rounded-xl p-4 animate-scaleUp">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    <span className="font-mono text-slate-400 font-bold ml-1">Terminal de Salida (Stdout)</span>
                  </div>

                  {pythonOutput.stdout && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleInsertIntoReport("3_pruebas_actividades")}
                        className="text-[11px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3 h-3 text-amber-400" />
                        <span>Insertar en Secc. 3 (Pruebas)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleInsertIntoReport("6_conclusiones_recomendaciones")}
                        className="text-[11px] bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3 h-3 text-sky-400" />
                        <span>Insertar en Secc. 6 (Conclusiones)</span>
                      </button>
                    </div>
                  )}
                </div>

                {insertedSuccess && (
                  <div className="bg-emerald-950/80 border border-emerald-600/60 p-2 rounded-lg text-emerald-300 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>¡Resultados del cálculo insertados correctamente en el informe técnico!</span>
                  </div>
                )}

                <pre className="font-mono text-xs text-slate-100 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                  {pythonOutput.stdout || (pythonOutput.stderr ? '' : '(Sin salida por consola)')}
                </pre>

                {pythonOutput.stderr && (
                  <div className="pt-2 border-t border-rose-900/50">
                    <span className="text-[11px] font-mono text-rose-400 font-bold block mb-1">Stderr / Advertencias:</span>
                    <pre className="font-mono text-xs text-rose-300 whitespace-pre-wrap">
                      {pythonOutput.stderr}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LIVE GEMINI CHAT */}
        {activeTab === 'chat' && (
          <div className="flex flex-col flex-1 overflow-hidden p-4 sm:p-6 space-y-4">
            
            {/* Quick Prompt Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs shrink-0">
              <span className="text-slate-500 text-[11px] font-bold shrink-0">Sugerencias:</span>
              {[
                "Códigos de falla MID 036 CID 0100 FMI 04",
                "Torque de culata motor CAT C15",
                "Procedimiento toma de muestra SOS",
                "Límites de vibración según ISO 10816",
                "Holgura de válvulas de escape C18"
              ].map((chip, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setChatInput(chip);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2.5 py-1 rounded-full text-[11px] whitespace-nowrap transition cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Chat History Box */}
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
                          <span>Gemini 3.7 Asistente SIS</span>
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
                  <span>Gemini consultando manuales técnicos...</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input Bar */}
            <div className="flex gap-2 shrink-0">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Pregunta sobre códigos de falla, torques, diagramas Caterpillar o cálculos..."
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

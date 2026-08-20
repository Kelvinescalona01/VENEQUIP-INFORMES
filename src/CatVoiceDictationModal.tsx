import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Mic, 
  MicOff, 
  Sparkles, 
  Check, 
  Copy, 
  Zap, 
  RotateCcw, 
  Volume2, 
  Languages,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface CatVoiceDictationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInjectText: (targetSection: string, text: string) => void;
  currentSections: {
    "1_solicitud_cliente": string;
    "2_condiciones_fallas": string;
    "3_actividades_efectuadas": string;
    "4_fallas_detectadas": string;
    "5_causas_fallas": string;
    "6_conclusiones_recomendaciones": string;
  };
}

// Specialized Caterpillar Technical Vocabulary Normalizer
const CAT_VOCABULARY_MAP: Record<string, string> = {
  'orometro': 'horómetro',
  'horometro': 'horómetro',
  'inyector mehui': 'inyector MEUI',
  'inyector meui': 'inyector MEUI',
  'inyectores meui': 'inyectores MEUI',
  'ecm': 'ECM (Módulo de Control Electrónico)',
  'emcp': 'panel EMCP',
  'emcp4': 'panel EMCP 4',
  'cid': 'CID',
  'fmi': 'FMI',
  'mid': 'MID',
  'cat et': 'Caterpillar Electronic Technician (CAT ET)',
  'sis': 'CAT SIS 2.0',
  'elc': 'refrigerante CAT ELC',
  'deo': 'aceite CAT DEO 15W-40',
  'sos': 'análisis de fluidos S.O.S.',
  'megometro': 'megóhmetro',
  'megado': 'prueba de aislamiento con megóhmetro',
  'damper': 'amortiguador de vibraciones (Damper)',
  'posenfriador': 'posenfriador de aire (ATAAC)',
  'intercooler': 'posenfriador ATAAC',
  'culata': 'culata de cilindros',
  'cárter': 'cárter de motor',
  'carter': 'cárter de motor',
  'turbo': 'turbocompresor',
  'wastegate': 'válvula de descarga Wastegate',
  'avr': 'regulador de voltaje AVR / CDVR',
  'kva': 'kVA',
  'kw': 'kW',
  'amperios': 'Amperios',
  'load bank': 'banco de carga resistivo'
};

function normalizeCatVoiceText(raw: string): string {
  let cleaned = raw;
  Object.entries(CAT_VOCABULARY_MAP).forEach(([key, replacement]) => {
    const regex = new RegExp(`\\b${key}\\b`, 'gi');
    cleaned = cleaned.replace(regex, replacement);
  });
  return cleaned;
}

export const CatVoiceDictationModal: React.FC<CatVoiceDictationModalProps> = ({
  isOpen,
  onClose,
  onInjectText,
  currentSections
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<string>('3_actividades_efectuadas');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    // Check Web Speech API support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMsg('El reconocimiento de voz no está soportado en este navegador. Puede escribir el texto directamente.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-ES'; // Spanish default for Venequip technicians

      recognition.onresult = (event: any) => {
        let currentText = '';
        for (let i = 0; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript + ' ';
        }
        const corrected = normalizeCatVoiceText(currentText.trim());
        setTranscript(corrected);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMsg('Acceso al micrófono denegado. Permita el uso del micrófono en la barra de direcciones.');
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      setErrorMsg('Error inicializando el motor de voz.');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    setErrorMsg(null);

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Start error:', err);
      }
    }
  };

  const handleInject = () => {
    if (!transcript.trim()) return;
    onInjectText(selectedTarget, transcript.trim());
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between shrink-0 border-b border-slate-800 text-white">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl text-slate-950 shadow-md transition-colors ${isListening ? 'bg-rose-500 animate-pulse text-white' : 'bg-amber-500'}`}>
              <Mic className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black text-white tracking-wide">
                  Dictado por Voz Técnico Caterpillar
                </h2>
                <span className="bg-amber-400/20 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-400/30">
                  Manos Libres
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Reconocimiento de voz adaptado con auto-corrección de terminología técnica CAT
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          
          {/* Target Section Selector */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wide mb-1.5">
              Sección de Destino en el Informe Técnico:
            </label>
            <select
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
            >
              <option value="1_solicitud_cliente">1. Solicitud del Cliente / Motivo del Servicio</option>
              <option value="2_condiciones_fallas">2. Condiciones Iniciales / Parámetros Operacionales</option>
              <option value="3_actividades_efectuadas">3. Actividades Efectuadas y Trabajos Ejecutados</option>
              <option value="4_fallas_detectadas">4. Fallas Detectadas y Diagnóstico Electrónico</option>
              <option value="5_causas_fallas">5. Causas Raíz de las Fallas Identificadas</option>
              <option value="6_conclusiones_recomendaciones">6. Conclusiones y Recomendaciones Técnicas</option>
            </select>
          </div>

          {/* Microphone Control Area */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3">
            <button
              onClick={toggleListening}
              className={`p-6 rounded-full shadow-lg transition-all transform hover:scale-105 cursor-pointer ${
                isListening
                  ? 'bg-rose-600 text-white ring-8 ring-rose-200 animate-pulse'
                  : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
              }`}
            >
              {isListening ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
            </button>

            <div>
              <p className="text-sm font-bold text-slate-800">
                {isListening ? 'Escuchando en vivo... Hable claro sobre la inspección' : 'Haga clic en el micrófono para iniciar el dictado'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Soporta términos: ECM, MEUI, Horómetro, Válvula Wastegate, Damper, S.O.S., etc.
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Real-time Text Area */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wide">
                Texto Transcrito (Editable):
              </label>
              {transcript && (
                <button
                  onClick={() => setTranscript('')}
                  className="text-[11px] text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  Limpiar
                </button>
              )}
            </div>
            <textarea
              rows={4}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="El texto dictado aparecerá aquí automáticamente con corrección de terminología Caterpillar..."
              className="w-full p-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-medium text-slate-900 leading-relaxed"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between shrink-0">
          <button
            onClick={handleCopy}
            disabled={!transcript}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copiado' : 'Copiar Texto'}</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
            >
              Cerrar
            </button>
            <button
              onClick={handleInject}
              disabled={!transcript.trim()}
              className="px-5 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="h-4 w-4" />
              <span>Insertar en Informe</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

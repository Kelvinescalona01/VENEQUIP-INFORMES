import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Wrench, 
  Zap, 
  Copy, 
  Check, 
  BookOpen, 
  Activity,
  Layers,
  ChevronRight
} from 'lucide-react';

export interface CatDtcRecord {
  mid: string; // Module Identifier (e.g., MID 036 ECM Motor, MID 053 EMCP, MID 087 VIMS)
  cid: string; // Component Identifier (e.g., CID 0100)
  fmi: string; // Failure Mode Identifier (e.g., FMI 01)
  fmiDesc: string; // e.g. "Datos válidos pero por debajo del rango operacional normal (Nivel de Advertencia Crítico)"
  componentName: string; // e.g. "Sensor de Presión de Aceite de Motor"
  system: 'Lubricación' | 'Combustible' | 'Admisión/Escape' | 'Refrigeración' | 'Eléctrico/ECM' | 'Generador/EMCP' | 'Inyección';
  applicableEngines: string[]; // ['C7', 'C9', 'C13', 'C15', 'C18', 'C27', 'C32', '3500', 'G3500']
  symptom: string;
  rootCauses: string[];
  diagnosticSteps: string[];
  recommendedAction: string;
}

export const CAT_DTC_DATABASE: CatDtcRecord[] = [
  {
    mid: 'MID 036',
    cid: 'CID 0100',
    fmi: 'FMI 01',
    fmiDesc: 'FMI 01: Datos válidos pero por debajo del rango normal (Más severo - Nivel Crítico)',
    componentName: 'Sensor de Presión de Aceite de Motor',
    system: 'Lubricación',
    applicableEngines: ['C9', 'C13', 'C15', 'C18', 'C27', 'C32', '3512', '3516'],
    symptom: 'Lámpara de advertencia de presión de aceite encendida, reducción de potencia automática (Derate) o apagado de emergencia (Shutdown).',
    rootCauses: [
      'Nivel de aceite en cárter bajo o contaminación excesiva con combustible diésel.',
      'Válvula de alivio de presión de aceite de la bomba trabada en posición abierta.',
      'Bomba de aceite de motor desgastada o con holgura excesiva en engranajes.',
      'Filtro de aceite saturado o válvula de derivación del filtro con falla.',
      'Cojinetes de bancada o biela con desgaste excesivo (holgura radial fuera de tolerancia CAT).'
    ],
    diagnosticSteps: [
      '1. Verificar nivel y viscosidad del aceite en la varilla medidora con motor detenido.',
      '2. Conectar manómetro de presión calibrado en el puerto principal de la galería de aceite.',
      '3. Arrancar el motor en ralentí bajo (600-800 RPM) y comparar la lectura mecánica con el sensor del ECM.',
      '4. Desarmar e inspeccionar el elemento del filtro de aceite CAT 1R-1808 en búsqueda de partículas metálicas.',
      '5. Inspeccionar la válvula reguladora de presión en la carcasa de la bomba de aceite.'
    ],
    recommendedAction: 'Realizar cambio de aceite y filtros, inspeccionar válvula reguladora. Si la baja presión persiste mecánicamente, desmontar cárter e inspeccionar cojinetes principales.'
  },
  {
    mid: 'MID 036',
    cid: 'CID 0110',
    fmi: 'FMI 00',
    fmiDesc: 'FMI 00: Datos válidos pero por encima del rango operacional normal (Nivel de Alarma Alta)',
    componentName: 'Sensor de Temperatura de Refrigerante de Motor',
    system: 'Refrigeración',
    applicableEngines: ['C7', 'C9', 'C13', 'C15', 'C18', 'C27', 'C32', '3500'],
    symptom: 'Temperatura de refrigerante superior a 102°C (216°F). Disparo de alarma en panel EMCP y protección por sobretemperatura.',
    rootCauses: [
      'Nivel de refrigerante bajo por fuga externa o consumo interno.',
      'Termostatos (reguladores de temperatura) pegados en posición cerrada.',
      'Panal del radiador obstruido externamente por polvo, aceite o residuos.',
      'Correa del ventilador floja o embrague viscoso del ventilador dañado.',
      'Bomba de agua con rodete desgastado o cavitación severa.'
    ],
    diagnosticSteps: [
      '1. Comprobar nivel de refrigerante CAT ELC en el tanque de expansión (después de enfriar).',
      '2. Medir temperatura diferencial con pirómetro láser infrarrojo en la entrada y salida del radiador.',
      '3. Desmontar los termostatos CAT 248-5513 y probarlos en recipiente térmico a 82°C (180°F).',
      '4. Comprobar tensión de correas con tensiómetro de frecuencia o deflexión manual.',
      '5. Inspeccionar visualmente el panal del radiador a contraluz.'
    ],
    recommendedAction: 'Lavar externamente el panal del radiador con desengrasante biodegradable. Reemplazar conjunto de termostatos y empaques de carcasa.'
  },
  {
    mid: 'MID 036',
    cid: 'CID 0190',
    fmi: 'FMI 08',
    fmiDesc: 'FMI 08: Frecuencia o ancho de pulso anormal / Señal errática',
    componentName: 'Sensor Primario de Velocidad y Sincronización del Motor',
    system: 'Eléctrico/ECM',
    applicableEngines: ['C7', 'C9', 'C13', 'C15', 'C18', 'C27', 'C32'],
    symptom: 'Arranque prolongado, marcha mínima inestable, explosiones en escape o imposibilidad de arrancar.',
    rootCauses: [
      'Acumulación de virutas metálicas en la punta magnética del sensor.',
      'Separación de aire (Air Gap) incorrecta entre la punta del sensor y la rueda fónica.',
      'Cableado apantallado con cortocircuito o circuito abierto en conector J1/P1.',
      'Rueda fónica de sincronización con dientes dañados o floja en el eje de levas.'
    ],
    diagnosticSteps: [
      '1. Desmontar el sensor de velocidad CAT y limpiar virutas magnéticas de la punta.',
      '2. Medir resistencia interna de la bobina del sensor (debe estar entre 75 y 230 Ohmios según modelo).',
      '3. Inspeccionar el arnés eléctrico por rozamiento con partes móviles o calor excesivo.',
      '4. Conectar CAT ET y verificar el estado del sensor secundario de velocidad en tiempo real.'
    ],
    recommendedAction: 'Limpiar sensor e inspeccionar conector Deutsch. Si el código persiste, calibrar luz entre sensor y rueda de sincronización o reemplazar sensor de velocidad.'
  },
  {
    mid: 'MID 036',
    cid: 'CID 0091',
    fmi: 'FMI 08',
    fmiDesc: 'FMI 08: Frecuencia o ciclo de trabajo PWM de señal de acelerador fuera de tolerancia',
    componentName: 'Sensor de Posición del Acelerador (PWM)',
    system: 'Eléctrico/ECM',
    applicableEngines: ['C9', 'C13', 'C15', 'C18', 'C27', 'C32'],
    symptom: 'El motor queda clavado en velocidad de ralentí bajo (Default Idle) y no responde a la demanda de carga o velocidad.',
    rootCauses: [
      'Sensor de posición de pedal/potenciómetro descalibrado o con desgaste interno.',
      'Voltaje de alimentación de 8V DC del ECM al sensor fuera de rango.',
      'Línea de señal PWM con alta resistencia o sulfatación en terminales.'
    ],
    diagnosticSteps: [
      '1. Monitorear el porcentaje de aceleración en CAT ET mientras se acciona el pedal/mando.',
      '2. Medir voltaje de referencia de 8V DC en los pines A y B del conector del sensor.',
      '3. Medir señal PWM con multímetro en modo Duty Cycle (debe variar suavemente de 10% a 90%).'
    ],
    recommendedAction: 'Revisar pines de conector del acelerador, verificar alimentación regulada de 8V y recalibrar rango de señal PWM.'
  },
  {
    mid: 'MID 036',
    cid: 'CID 0268',
    fmi: 'FMI 02',
    fmiDesc: 'FMI 02: Datos intermitentes o incorrectos en parámetros programables del ECM',
    componentName: 'Módulo de Control Electrónico (ECM) - Memoria de Configuración',
    system: 'Eléctrico/ECM',
    applicableEngines: ['C7', 'C9', 'C13', 'C15', 'C18', 'C27', 'C32', '3500'],
    symptom: 'Lámpara Check Engine parpadeante. El ECM opera en modo de protección por defecto.',
    rootCauses: [
      'Parámetros del motor o archivos Flash desactualizados o corruptos.',
      'Desconexión de batería durante proceso de flasheo o ciclo de guardado de clave de seguridad.',
      'Falla en la memoria EEPROM no volátil del ECM.'
    ],
    diagnosticSteps: [
      '1. Conectar interfaz CAT Comm Adapter III con software Caterpillar Electronic Technician (CAT ET).',
      '2. Ingresar al menú de Configuración del ECM y revisar los parámetros marcados con asterisco (*).',
      '3. Comparar el número de archivo Flash instalado con la última versión de software en SIS 2.0.'
    ],
    recommendedAction: 'Reprogramar los parámetros de configuración y códigos de fábrica (Factory Passwords) en el ECM utilizando CAT ET.'
  },
  {
    mid: 'MID 036',
    cid: 'CID 0001',
    fmi: 'FMI 05',
    fmiDesc: 'FMI 05: Corriente por debajo de lo normal o circuito abierto (Inyector Cilindro #1)',
    componentName: 'Solenoide de Inyector Unitario Electrónico Cilindro #1 (MEUI/EUI)',
    system: 'Inyección',
    applicableEngines: ['C9', 'C13', 'C15', 'C18', 'C27', 'C32', '3500'],
    symptom: 'Falla de encendido en el cilindro 1, humo blanco o gris por el escape, pérdida de potencia y vibración notable.',
    rootCauses: [
      'Bobina del solenoide del inyector #1 quemada o abierta.',
      'Arnés interno bajo la tapa de válvulas (Valve Cover Harness) pellizcado o quemado.',
      'Conector pasamuros del cabezal de cilindros con terminal sulfatado o flojo.'
    ],
    diagnosticSteps: [
      '1. Ejecutar la prueba automática de solenoides de inyectores (Injector Solenoid Test) en CAT ET.',
      '2. Retirar tapa de válvulas y medir resistencia en los bornes del inyector #1 (debe ser ~1.5 a 2.5 Ω).',
      '3. Medir continuidad desde el conector del ECM (J2) hasta el conector del inyector #1.',
      '4. Ejecutar prueba de corte de cilindros (Cylinder Cutout Test) para confirmar pérdida de contribución.'
    ],
    recommendedAction: 'Reemplazar el arnés interno de tapa de válvulas o sustituir el inyector electrónico MEUI por unidad original CAT Reman.'
  },
  {
    mid: 'MID 036',
    cid: 'CID 0094',
    fmi: 'FMI 01',
    fmiDesc: 'FMI 01: Presión de Entrega de Combustible por debajo del rango operacional',
    componentName: 'Sensor de Presión de Entrega de Combustible',
    system: 'Combustible',
    applicableEngines: ['C9', 'C13', 'C15', 'C18', 'C27', 'C32', '3500'],
    symptom: 'Pérdida de potencia en plena carga, vacilación del motor al acelerar o apagado por desabastecimiento.',
    rootCauses: [
      'Filtro de combustible primario (separador de agua) o secundario de 2 micras tapado.',
      'Bomba de transferencia de combustible con desgaste mecánico en engranajes.',
      'Válvula reguladora de presión de combustible (Check Valve) trabada abierta.',
      'Entrada de aire en las líneas de succión desde el tanque diario.'
    ],
    diagnosticSteps: [
      '1. Inspeccionar manómetros de presión diferencial de combustible en la base del filtro.',
      '2. Medir presión de transferencia con motor operando a 1800 RPM (mínimo 60-70 PSI según modelo CAT).',
      '3. Cebar el sistema con la bomba manual e inspeccionar si hay burbujas de aire en el visor de retorno.',
      '4. Inspeccionar la válvula check de retorno en la parte posterior de la culata.'
    ],
    recommendedAction: 'Reemplazar filtros de combustible 1R-0770 y 1R-0749. Purgar aire del sistema e inspeccionar válvula de alivio de combustible.'
  },
  {
    mid: 'MID 053',
    cid: 'CID 0617',
    fmi: 'FMI 05',
    fmiDesc: 'FMI 05: Circuito abierto en relé de precalentador / calentador de camisas (Jacket Water Heater)',
    componentName: 'Relé de Control del Calentador de Agua de Camisas',
    system: 'Generador/EMCP',
    applicableEngines: ['C13', 'C15', 'C18', 'C27', 'C32', '3512', '3516'],
    symptom: 'Temperatura de bloque de motor fría en reposo (< 40°C). Arranque dificultoso en modo Standby automático.',
    rootCauses: [
      'Resistencia del calentador de camisas quemada por operar sin refrigerante (cavitación).',
      'Contactor electromagnético de potencia con bobina abierta.',
      'Termostato de control del calentador de bloque abierto o descalibrado.'
    ],
    diagnosticSteps: [
      '1. Medir voltaje de alimentación de 120V/240V AC en los bornes del calentador de camisas.',
      '2. Medir resistencia en Ohmios de la resistencia calefactora (debe ser aprox. 10 a 25 Ω según potencia en kW).',
      '3. Verificar la señal de activación de salida digital del controlador EMCP 4.'
    ],
    recommendedAction: 'Reemplazar resistencia del calentador de camisas y purgar aire del circuito de termosifón para evitar quemado en seco.'
  },
  {
    mid: 'MID 053',
    cid: 'CID 0333',
    fmi: 'FMI 03',
    fmiDesc: 'FMI 03: Voltaje por encima de lo normal en sensor de voltaje de generador (L-L / L-N)',
    componentName: 'Módulo Regulador Automático de Voltaje (AVR / CDVR) / EMCP 4',
    system: 'Generador/EMCP',
    applicableEngines: ['C15', 'C18', 'C27', 'C32', '3512', '3516'],
    symptom: 'Sobretensión en bornes del generador (> 500V en red de 480V o > 240V en 208V). Disparo del interruptor principal.',
    rootCauses: [
      'Regulador digital de voltaje (CAT CDVR o Leroy Somer) con potenciómetro desajustado.',
      'Pérdida de la señal de sensado de voltaje (Sensing Voltage Loss).',
      'Diodos giratorios del puente rectificador en el rotor en cortocircuito.'
    ],
    diagnosticSteps: [
      '1. Inspeccionar fusibles y cableado de sensado de voltaje trifásico hacia el regulador AVR.',
      '2. Medir voltajes de salida en vacío a 1800 RPM (60 Hz) con multímetro True RMS calibrado.',
      '3. Desconectar y probar los 6 diodos del puente rectificador rotativo con escala de diodos.'
    ],
    recommendedAction: 'Ajustar la ganancia de estabilidad y voltaje de referencia en el CDVR. Verificar diodos giratorios y varistor de protección contra sobretensiones.'
  }
];

interface CatDtcDecoderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInjectIntoReport: (data: {
    fallasText: string;
    causasText: string;
    actividadesText: string;
    herramientas: Array<{ nombre: string; numero_parte: string; cantidad: number }>;
  }) => void;
}

export const CatDtcDecoderModal: React.FC<CatDtcDecoderModalProps> = ({
  isOpen,
  onClose,
  onInjectIntoReport
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSystem, setSelectedSystem] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<CatDtcRecord>(CAT_DTC_DATABASE[0]);
  const [copied, setCopied] = useState(false);

  const filteredCodes = useMemo(() => {
    return CAT_DTC_DATABASE.filter((rec) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        rec.cid.toLowerCase().includes(term) ||
        rec.fmi.toLowerCase().includes(term) ||
        rec.mid.toLowerCase().includes(term) ||
        rec.componentName.toLowerCase().includes(term) ||
        rec.fmiDesc.toLowerCase().includes(term) ||
        rec.system.toLowerCase().includes(term) ||
        rec.applicableEngines.some(e => e.toLowerCase().includes(term));

      const matchesSystem = selectedSystem === 'all' || rec.system === selectedSystem;
      return matchesSearch && matchesSystem;
    });
  }, [searchTerm, selectedSystem]);

  if (!isOpen) return null;

  const handleInject = () => {
    const fallasText = `Código de Diagnóstico Activo Caterpillar: ${selectedRecord.mid} - ${selectedRecord.cid} ${selectedRecord.fmi}\nComponente: ${selectedRecord.componentName}\nCondición: ${selectedRecord.fmiDesc}\nSíntoma en Equipo: ${selectedRecord.symptom}`;
    
    const causasText = `Causas Técnicas Identificadas:\n${selectedRecord.rootCauses.map((c, i) => `• ${c}`).join('\n')}`;
    
    const actividadesText = `Procedimiento de Diagnóstico y Corrección CAT:\n${selectedRecord.diagnosticSteps.join('\n')}\n\nAcción Correctiva Ejecutada:\n${selectedRecord.recommendedAction}`;
    
    const herramientas = [
      { nombre: 'Adaptador de Comunicaciones CAT Comm Adapter III', numero_parte: '538-5051', cantidad: 1 },
      { nombre: 'Software Caterpillar Electronic Technician (CAT ET)', numero_parte: 'JERD2129', cantidad: 1 },
      { nombre: 'Multímetro Digital True RMS Fluke 87V CAT', numero_parte: '9U-7330', cantidad: 1 }
    ];

    onInjectIntoReport({
      fallasText,
      causasText,
      actividadesText,
      herramientas
    });

    onClose();
  };

  const handleCopy = () => {
    const text = `${selectedRecord.mid} - ${selectedRecord.cid} ${selectedRecord.fmi}\n${selectedRecord.componentName}\n${selectedRecord.fmiDesc}\n\nPasos de Diagnóstico:\n${selectedRecord.diagnosticSteps.join('\n')}\n\nAcción Recomendada:\n${selectedRecord.recommendedAction}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-5xl h-[92vh] max-h-[850px] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between shrink-0 border-b border-slate-800 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500 rounded-xl text-slate-950 shadow-md">
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black text-white tracking-wide">
                  Decodificador de Códigos de Falla Caterpillar (MID / CID / FMI)
                </h2>
                <span className="bg-amber-400/20 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-400/30">
                  CAT ET 2026.1
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Base de conocimiento técnico oficial para motores C7-C32, Serie 3500 y controladores EMCP
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

        {/* Modal Search & Filter Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por CID, FMI, Sensor o Motor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
            />
          </div>

          {/* System Filters */}
          <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none text-xs">
            {['all', 'Lubricación', 'Combustible', 'Admisión/Escape', 'Refrigeración', 'Eléctrico/ECM', 'Generador/EMCP', 'Inyección'].map((sys) => (
              <button
                key={sys}
                onClick={() => setSelectedSystem(sys)}
                className={`px-2.5 py-1.5 rounded-lg font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedSystem === sys
                    ? 'bg-slate-900 text-amber-400 shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {sys === 'all' ? 'Todos los Sistemas' : sys}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body: Split 2-Column Explorer */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden bg-slate-100/50">
          
          {/* Left Column: Code List (5 Cols) */}
          <div className="md:col-span-5 border-r border-slate-200 bg-white overflow-y-auto divide-y divide-slate-100">
            {filteredCodes.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-amber-500/70" />
                <p className="text-xs font-semibold">No se encontraron códigos coincidentes.</p>
              </div>
            ) : (
              filteredCodes.map((code) => {
                const isSelected = selectedRecord.cid === code.cid && selectedRecord.fmi === code.fmi;
                return (
                  <div
                    key={`${code.cid}_${code.fmi}`}
                    onClick={() => setSelectedRecord(code)}
                    className={`p-3.5 transition cursor-pointer text-left flex items-start justify-between group ${
                      isSelected
                        ? 'bg-amber-500/10 border-l-4 border-amber-500'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1 pr-2">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono font-black text-xs text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {code.cid}
                        </span>
                        <span className="font-mono font-bold text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          {code.fmi}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                          {code.system}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">
                        {code.componentName}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {code.fmiDesc}
                      </p>
                    </div>
                    <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${isSelected ? 'text-amber-600 translate-x-0.5' : 'text-slate-300'}`} />
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Code Detail & Diagnostic Flowchart (7 Cols) */}
          <div className="md:col-span-7 p-5 overflow-y-auto space-y-4 bg-white">
            {/* Header of Detail */}
            <div className="p-4 bg-slate-900 rounded-xl text-white shadow-sm border border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center space-x-2">
                  <span className="bg-amber-500 text-slate-950 text-xs font-black px-2 py-0.5 rounded">
                    {selectedRecord.mid}
                  </span>
                  <span className="text-amber-400 font-mono font-black text-base">
                    {selectedRecord.cid} - {selectedRecord.fmi}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  {selectedRecord.applicableEngines.map(eng => (
                    <span key={eng} className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700 font-mono">
                      {eng}
                    </span>
                  ))}
                </div>
              </div>
              <h3 className="text-sm font-bold text-white">
                {selectedRecord.componentName}
              </h3>
              <p className="text-xs text-amber-200 mt-1 font-medium">
                {selectedRecord.fmiDesc}
              </p>
            </div>

            {/* Symptom */}
            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl">
              <h4 className="text-xs font-black text-amber-900 uppercase tracking-wide flex items-center gap-1.5 mb-1">
                <Activity className="h-3.5 w-3.5 text-amber-600" />
                Síntoma y Comportamiento del Motor
              </h4>
              <p className="text-xs text-amber-950 leading-relaxed">
                {selectedRecord.symptom}
              </p>
            </div>

            {/* Root Causes */}
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                Causas Probables (Caterpillar Troubleshooting)
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {selectedRecord.rootCauses.map((cause, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{cause}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Diagnostic Steps */}
            <div className="bg-blue-50/70 border border-blue-200 p-3.5 rounded-xl">
              <h4 className="text-xs font-black text-blue-900 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                <Wrench className="h-3.5 w-3.5 text-blue-600" />
                Procedimiento de Diagnóstico Paso a Paso
              </h4>
              <div className="space-y-2 text-xs text-blue-950 font-medium">
                {selectedRecord.diagnosticSteps.map((step, idx) => (
                  <div key={idx} className="p-2 bg-white/80 rounded-lg border border-blue-100 shadow-2xs">
                    {step}
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Action */}
            <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl">
              <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wide flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Acción Correctiva Estándar
              </h4>
              <p className="text-xs text-emerald-950 leading-relaxed font-semibold">
                {selectedRecord.recommendedAction}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer: Action Bar */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between shrink-0">
          <button
            onClick={handleCopy}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copiado al Portapapeles' : 'Copiar Diagnóstico'}</span>
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
              className="px-5 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="h-4 w-4" />
              <span>Insertar en Informe Técnico</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

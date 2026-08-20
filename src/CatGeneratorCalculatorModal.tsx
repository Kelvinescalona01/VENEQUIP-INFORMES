import React, { useState, useMemo } from 'react';
import { 
  X, 
  Zap, 
  Gauge, 
  Flame, 
  Activity, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  ArrowRight,
  TrendingUp,
  Cpu
} from 'lucide-react';

interface CatGeneratorCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInjectIntoReport: (text: string) => void;
}

export const CatGeneratorCalculatorModal: React.FC<CatGeneratorCalculatorModalProps> = ({
  isOpen,
  onClose,
  onInjectIntoReport
}) => {
  // Generator Rating
  const [gensetKvaRating, setGensetKvaRating] = useState('500');
  const [voltageL_L, setVoltageL_L] = useState('480'); // 480V, 208V, 440V, 380V
  const [frequency, setFrequency] = useState<'60' | '50'>('60');

  // Load Measurements
  const [voltageL1, setVoltageL1] = useState('480');
  const [voltageL2, setVoltageL2] = useState('479');
  const [voltageL3, setVoltageL3] = useState('481');

  const [currentL1, setCurrentL1] = useState('450');
  const [currentL2, setCurrentL2] = useState('455');
  const [currentL3, setCurrentL3] = useState('448');

  const [powerFactor, setPowerFactor] = useState('0.8');

  // Ambient & Altitude Derating parameters
  const [altitudeMeters, setAltitudeMeters] = useState('500');
  const [ambientTempC, setAmbientTempC] = useState('32');

  const [copied, setCopied] = useState(false);

  // Computed Values
  const calcs = useMemo(() => {
    const v1 = parseFloat(voltageL1) || 0;
    const v2 = parseFloat(voltageL2) || 0;
    const v3 = parseFloat(voltageL3) || 0;
    const vAvg = (v1 + v2 + v3) / 3 || 1;

    const i1 = parseFloat(currentL1) || 0;
    const i2 = parseFloat(currentL2) || 0;
    const i3 = parseFloat(currentL3) || 0;
    const iAvg = (i1 + i2 + i3) / 3 || 0;

    const pf = Math.min(1.0, Math.max(0.1, parseFloat(powerFactor) || 0.8));
    const kvaRated = parseFloat(gensetKvaRating) || 500;
    const kwRated = kvaRated * pf;

    // Actual Total kVA = (sqrt(3) * Vavg * Iavg) / 1000
    const actualKva = (Math.sqrt(3) * vAvg * iAvg) / 1000;
    // Actual Total kW = Actual kVA * PF
    const actualKw = actualKva * pf;

    // Load Percentage
    const loadPercent = kvaRated > 0 ? (actualKva / kvaRated) * 100 : 0;

    // Voltage Unbalance % = (Max Deviation from Avg / Avg) * 100
    const maxVDev = Math.max(Math.abs(v1 - vAvg), Math.abs(v2 - vAvg), Math.abs(v3 - vAvg));
    const vUnbalance = (maxVDev / vAvg) * 100;

    // Current Unbalance % = (Max Deviation from Avg / Avg) * 100
    const maxIDev = Math.max(Math.abs(i1 - iAvg), Math.abs(i2 - iAvg), Math.abs(i3 - iAvg));
    const iUnbalance = iAvg > 0 ? (maxIDev / iAvg) * 100 : 0;

    // Estimated Fuel Consumption (Caterpillar Standard Curve: approx 0.22 - 0.26 Liters per kW-hour produced)
    const fuelLph = actualKw * 0.245;
    const fuelGph = fuelLph * 0.264172;

    // Derating Calculation (ISO 8528 & CAT specs):
    // Standard reference: 1000m altitude, 40°C ambient.
    // Above 1000m: 1% per 100m. Above 40°C: 2% per 5°C.
    const alt = parseFloat(altitudeMeters) || 0;
    const temp = parseFloat(ambientTempC) || 25;

    let altDerate = 0;
    if (alt > 1000) {
      altDerate = ((alt - 1000) / 100) * 1.0; // %
    }

    let tempDerate = 0;
    if (temp > 40) {
      tempDerate = ((temp - 40) / 5) * 2.0; // %
    }

    const totalDerate = Math.min(40, altDerate + tempDerate);
    const deratingFactor = Math.max(0.6, (100 - totalDerate) / 100);
    const availableKva = kvaRated * deratingFactor;
    const availableKw = kwRated * deratingFactor;

    return {
      vAvg: vAvg.toFixed(1),
      iAvg: iAvg.toFixed(1),
      actualKva: actualKva.toFixed(1),
      actualKw: actualKw.toFixed(1),
      loadPercent: loadPercent.toFixed(1),
      vUnbalance: vUnbalance.toFixed(2),
      iUnbalance: iUnbalance.toFixed(2),
      fuelLph: fuelLph.toFixed(1),
      fuelGph: fuelGph.toFixed(1),
      totalDerate: totalDerate.toFixed(1),
      deratingFactor: deratingFactor.toFixed(3),
      availableKva: availableKva.toFixed(1),
      availableKw: availableKw.toFixed(1)
    };
  }, [voltageL1, voltageL2, voltageL3, currentL1, currentL2, currentL3, powerFactor, gensetKvaRating, altitudeMeters, ambientTempC]);

  if (!isOpen) return null;

  const handleInject = () => {
    let summary = `MEDICIONES ELÉCTRICAS Y PRUEBA DE CARGA DE GRUPO ELECTRÓGENO CAT\n`;
    summary += `Capacidad Nominal: ${gensetKvaRating} kVA @ Frecuencia ${frequency} Hz | F.P.: ${powerFactor}\n`;
    summary += `Condiciones Ambientales: Altura ${altitudeMeters} m.s.n.m. | Temp. Ambiente: ${ambientTempC}°C | Factor de Derating: ${calcs.deratingFactor} (Potencia Útil: ${calcs.availableKva} kVA / ${calcs.availableKw} kW)\n\n`;
    
    summary += `Parámetros de Medición en Bornes de Carga:\n`;
    summary += `• Voltaje Línea-Línea: L1-L2 = ${voltageL1}V | L2-L3 = ${voltageL2}V | L3-L1 = ${voltageL3}V (Promedio: ${calcs.vAvg}V, Desbalance: ${calcs.vUnbalance}%)\n`;
    summary += `• Corriente por Fase: L1 = ${currentL1}A | L2 = ${currentL2}A | L3 = ${currentL3}A (Promedio: ${calcs.iAvg}A, Desbalance: ${calcs.iUnbalance}%)\n\n`;

    summary += `Potencia y Rendimiento Entregado:\n`;
    summary += `• Potencia Aparente: ${calcs.actualKva} kVA | Potencia Activa: ${calcs.actualKw} kW\n`;
    summary += `• Porcentaje de Carga del Generador: ${calcs.loadPercent}%\n`;
    summary += `• Consumo Teórico Estimado de Diésel: ${calcs.fuelLph} L/h (${calcs.fuelGph} GPH)\n\n`;

    const vUnbNum = parseFloat(calcs.vUnbalance);
    const iUnbNum = parseFloat(calcs.iUnbalance);
    const loadNum = parseFloat(calcs.loadPercent);

    summary += `Evaluación Técnica y Estabilidad de Tensión:\n`;
    if (vUnbNum > 2.0) {
      summary += `⚠️ ADVERTENCIA: Desbalance de voltaje superior al 2.0% (NEMA MG-1). Requiere equilibrar cargas monofásicas en tablero de distribución.\n`;
    } else {
      summary += `✓ Estabilidad y balance de voltaje dentro de los límites estrictos de regulación ISO 8528 (< 2%).\n`;
    }

    if (loadNum > 100) {
      summary += `🚨 ALERTA: Generador operando en condición de sobrecarga (${calcs.loadPercent}%). Riesgo de disparo térmico o degradación del bobinado.\n`;
    } else if (loadNum < 30) {
      summary += `ℹ️ NOTA: Carga baja (< 30%). Se recomienda aplicar banco de carga resistivo para evitar acumulación de carbón y 'Wet Stacking' en el escape.\n`;
    } else {
      summary += `✓ Operación en rango óptimo de carga (${calcs.loadPercent}%), asegurando combustión completa y máxima eficiencia térmica.\n`;
    }

    onInjectIntoReport(summary);
    onClose();
  };

  const handleCopy = () => {
    const text = `Cálculo de Carga CAT: ${calcs.actualKw} kW / ${calcs.actualKva} kVA (${calcs.loadPercent}% de carga)\nVoltajes: ${voltageL1}V / ${voltageL2}V / ${voltageL3}V (Desbalance: ${calcs.vUnbalance}%)\nCorrientes: ${currentL1}A / ${currentL2}A / ${currentL3}A (Desbalance: ${calcs.iUnbalance}%)\nConsumo: ${calcs.fuelLph} L/h | Derating: ${calcs.deratingFactor}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-5xl h-[92vh] max-h-[850px] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between shrink-0 border-b border-slate-800 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500 rounded-xl text-slate-950 shadow-md">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black text-white tracking-wide">
                  Calculadora Eléctrica y Banco de Carga de Generadores CAT
                </h2>
                <span className="bg-amber-400/20 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-400/30">
                  ISO 8528 / NEMA MG-1
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Cálculo en tiempo real de kW, kVA, Amperaje, Desbalance de Fase, Consumo de Combustible y Derating
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

        {/* Top Preset Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-slate-700">Potencia de Placa:</span>
            <div className="flex space-x-1.5">
              {['150', '250', '500', '750', '1000', '1500', '2000'].map((k) => (
                <button
                  key={k}
                  onClick={() => setGensetKvaRating(k)}
                  className={`px-2.5 py-1 text-xs font-black rounded-lg transition cursor-pointer ${
                    gensetKvaRating === k
                      ? 'bg-slate-900 text-amber-400'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {k} kVA
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="font-bold text-slate-700">Frecuencia:</span>
            <button
              onClick={() => setFrequency('60')}
              className={`px-2.5 py-1 font-bold rounded-lg ${frequency === '60' ? 'bg-amber-500 text-slate-950' : 'bg-white border border-slate-200 text-slate-700'}`}
            >
              60 Hz (1800 RPM)
            </button>
            <button
              onClick={() => setFrequency('50')}
              className={`px-2.5 py-1 font-bold rounded-lg ${frequency === '50' ? 'bg-amber-500 text-slate-950' : 'bg-white border border-slate-200 text-slate-700'}`}
            >
              50 Hz (1500 RPM)
            </button>
          </div>
        </div>

        {/* Body: Inputs & Realtime HUD */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-y-auto bg-slate-100/40 p-4 sm:p-6 gap-6">
          
          {/* Left: Input Columns (6 Cols) */}
          <div className="md:col-span-6 space-y-4">
            
            {/* Phase Voltages */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <Gauge className="h-4 w-4 text-amber-500" />
                Voltaje de Salida Línea a Línea (V AC)
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Fase L1 - L2 (V)</label>
                  <input
                    type="number"
                    value={voltageL1}
                    onChange={(e) => setVoltageL1(e.target.value)}
                    className="w-full px-3 py-1.5 font-bold border border-slate-300 rounded-lg text-center text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Fase L2 - L3 (V)</label>
                  <input
                    type="number"
                    value={voltageL2}
                    onChange={(e) => setVoltageL2(e.target.value)}
                    className="w-full px-3 py-1.5 font-bold border border-slate-300 rounded-lg text-center text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Fase L3 - L1 (V)</label>
                  <input
                    type="number"
                    value={voltageL3}
                    onChange={(e) => setVoltageL3(e.target.value)}
                    className="w-full px-3 py-1.5 font-bold border border-slate-300 rounded-lg text-center text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Phase Currents */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-blue-600" />
                Corrientes de Fase Medidas (Amperios)
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Corriente L1 (A)</label>
                  <input
                    type="number"
                    value={currentL1}
                    onChange={(e) => setCurrentL1(e.target.value)}
                    className="w-full px-3 py-1.5 font-bold border border-slate-300 rounded-lg text-center text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Corriente L2 (A)</label>
                  <input
                    type="number"
                    value={currentL2}
                    onChange={(e) => setCurrentL2(e.target.value)}
                    className="w-full px-3 py-1.5 font-bold border border-slate-300 rounded-lg text-center text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Corriente L3 (A)</label>
                  <input
                    type="number"
                    value={currentL3}
                    onChange={(e) => setCurrentL3(e.target.value)}
                    className="w-full px-3 py-1.5 font-bold border border-slate-300 rounded-lg text-center text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Power Factor & Site Derating */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <Sliders className="h-4 w-4 text-emerald-600" />
                Factor de Potencia y Condiciones Ambientales
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Factor Potencia (cos φ)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={powerFactor}
                    onChange={(e) => setPowerFactor(e.target.value)}
                    className="w-full px-3 py-1.5 font-bold border border-slate-300 rounded-lg text-center text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Altitud (m.s.n.m.)</label>
                  <input
                    type="number"
                    value={altitudeMeters}
                    onChange={(e) => setAltitudeMeters(e.target.value)}
                    className="w-full px-3 py-1.5 font-bold border border-slate-300 rounded-lg text-center text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Temp. Ambiente (°C)</label>
                  <input
                    type="number"
                    value={ambientTempC}
                    onChange={(e) => setAmbientTempC(e.target.value)}
                    className="w-full px-3 py-1.5 font-bold border border-slate-300 rounded-lg text-center text-xs"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Right: Calculated Metrics & Dashboard HUD (6 Cols) */}
          <div className="md:col-span-6 space-y-4">
            
            {/* Primary KPI Card */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                  Potencia y Carga Real
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                  parseFloat(calcs.loadPercent) > 100 ? 'bg-rose-500 text-white' : parseFloat(calcs.loadPercent) < 30 ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500 text-white'
                }`}>
                  {calcs.loadPercent}% CARGA
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                  <span className="text-[10px] text-slate-400 font-bold block">Potencia Activa</span>
                  <span className="text-2xl font-black text-amber-400">{calcs.actualKw}</span>
                  <span className="text-xs text-slate-300 font-bold ml-1">kW</span>
                </div>

                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                  <span className="text-[10px] text-slate-400 font-bold block">Potencia Aparente</span>
                  <span className="text-2xl font-black text-white">{calcs.actualKva}</span>
                  <span className="text-xs text-slate-300 font-bold ml-1">kVA</span>
                </div>
              </div>

              {/* Progress Bar of Load */}
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-slate-300">
                  <span>0 kVA</span>
                  <span>Carga: {calcs.actualKva} / {gensetKvaRating} kVA</span>
                  <span>{gensetKvaRating} kVA</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      parseFloat(calcs.loadPercent) > 100 ? 'bg-rose-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, parseFloat(calcs.loadPercent))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quality & Efficiency Metrics */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              
              {/* Unbalance */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-black text-slate-500 uppercase">Desbalance de Voltaje</span>
                <div className="flex items-center space-x-1.5">
                  <span className={`text-lg font-black ${parseFloat(calcs.vUnbalance) > 2 ? 'text-rose-600' : 'text-slate-900'}`}>
                    {calcs.vUnbalance}%
                  </span>
                  <span className="text-[10px] text-slate-400">(Máx 2%)</span>
                </div>
                <span className="text-[10px] text-slate-500 block">Desbalance I: {calcs.iUnbalance}%</span>
              </div>

              {/* Fuel Rate */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1">
                  <Flame className="h-3 w-3 text-amber-500" />
                  Consumo Estimado
                </span>
                <div className="flex items-center space-x-1">
                  <span className="text-lg font-black text-amber-600">{calcs.fuelLph}</span>
                  <span className="text-[10px] text-slate-600 font-bold">L/hora</span>
                </div>
                <span className="text-[10px] text-slate-500 block">{calcs.fuelGph} GPH (Galones/h)</span>
              </div>

              {/* Derating */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1 col-span-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-500 uppercase">Derating por Altura / Temperatura</span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Factor: {calcs.deratingFactor}
                  </span>
                </div>
                <p className="text-[11px] text-slate-700">
                  Potencia neta utilizable en sitio: <strong className="text-slate-900">{calcs.availableKva} kVA ({calcs.availableKw} kW)</strong>.
                  {parseFloat(calcs.totalDerate) > 0 ? ` Pérdida por condiciones ambientales: ${calcs.totalDerate}%.` : ' Sin penalización de potencia por ambiente.'}
                </p>
              </div>

            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between shrink-0">
          <button
            onClick={handleCopy}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copiado al Portapapeles' : 'Copiar Resumen'}</span>
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
              <span>Insertar Mediciones en Informe</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

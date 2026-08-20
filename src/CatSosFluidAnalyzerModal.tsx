import React, { useState, useMemo } from 'react';
import { 
  X, 
  FlaskConical, 
  AlertTriangle, 
  CheckCircle2, 
  Droplets, 
  Zap, 
  Sparkles, 
  TrendingUp, 
  Info, 
  RotateCcw 
} from 'lucide-react';

interface MetalLimit {
  normal: number;
  alert: number;
  critical: number;
  unit: string;
  source: string;
}

export const CAT_SOS_LIMITS: Record<string, Record<string, MetalLimit>> = {
  motor_diesel: {
    hierro_fe: { normal: 50, alert: 100, critical: 150, unit: 'ppm', source: 'Camisas de cilindro, tren de válvulas, cigüeñal, engranajes' },
    cobre_cu: { normal: 20, alert: 40, critical: 60, unit: 'ppm', source: 'Bujes de biela, enfriador de aceite, cojinetes de empuje' },
    plomo_pb: { normal: 15, alert: 30, critical: 50, unit: 'ppm', source: 'Cojinetes principales de bancada y biela' },
    aluminio_al: { normal: 15, alert: 30, critical: 45, unit: 'ppm', source: 'Faldas de pistón, bujes de bancada de árbol de levas' },
    cromo_cr: { normal: 5, alert: 12, critical: 20, unit: 'ppm', source: 'Anillos de compresión de pistón' },
    silicio_si: { normal: 15, alert: 25, critical: 40, unit: 'ppm', source: 'Entrada de polvo/tierra por admisión de aire o sellos' },
    sodio_na: { normal: 20, alert: 50, critical: 100, unit: 'ppm', source: 'Contaminación con refrigerante CAT ELC / sales' },
    estano_sn: { normal: 10, alert: 20, critical: 30, unit: 'ppm', source: 'Recubrimiento de cojinetes trimetálicos' }
  },
  hidraulico: {
    hierro_fe: { normal: 20, alert: 45, critical: 70, unit: 'ppm', source: 'Bombas de pistones, cilindros, válvulas de control' },
    cobre_cu: { normal: 15, alert: 35, critical: 50, unit: 'ppm', source: 'Platos oscilantes y bujes de bomba' },
    aluminio_al: { normal: 10, alert: 20, critical: 35, unit: 'ppm', source: 'Carcasas de bomba y válvulas' },
    silicio_si: { normal: 15, alert: 30, critical: 50, unit: 'ppm', source: 'Sellos de vástago de cilindro dañados, respiradero' },
    plomo_pb: { normal: 10, alert: 20, critical: 30, unit: 'ppm', source: 'Bujes de bancada' },
    cromo_cr: { normal: 3, alert: 8, critical: 15, unit: 'ppm', source: 'Vástagos cromados de cilindros' },
    sodio_na: { normal: 15, alert: 30, critical: 60, unit: 'ppm', source: 'Condensación externa o lavado a presión' },
    estano_sn: { normal: 5, alert: 15, critical: 25, unit: 'ppm', source: 'Recubrimiento de pistas de rodadura' }
  },
  transmision: {
    hierro_fe: { normal: 80, alert: 150, critical: 250, unit: 'ppm', source: 'Discos de embrague de acero, engranajes planetarios' },
    cobre_cu: { normal: 50, alert: 100, critical: 180, unit: 'ppm', source: 'Discos de fricción sinterizados de bronce' },
    aluminio_al: { normal: 25, alert: 50, critical: 80, unit: 'ppm', source: 'Carcasas de convertidor de par e impulsores' },
    plomo_pb: { normal: 25, alert: 50, critical: 80, unit: 'ppm', source: 'Bujes de soporte' },
    silicio_si: { normal: 20, alert: 40, critical: 65, unit: 'ppm', source: 'Respiradero de transmisión / suciedad externa' },
    cromo_cr: { normal: 5, alert: 10, critical: 20, unit: 'ppm', source: 'Pistas de rodamientos de agujas' },
    sodio_na: { normal: 20, alert: 40, critical: 80, unit: 'ppm', source: 'Enfriador de aceite de transmisión' },
    estano_sn: { normal: 10, alert: 25, critical: 40, unit: 'ppm', source: 'Bujes de aleación de estaño' }
  }
};

interface CatSosFluidAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInjectIntoReport: (textSummary: string) => void;
}

export const CatSosFluidAnalyzerModal: React.FC<CatSosFluidAnalyzerModalProps> = ({
  isOpen,
  onClose,
  onInjectIntoReport
}) => {
  const [compartment, setCompartment] = useState<'motor_diesel' | 'hidraulico' | 'transmision'>('motor_diesel');
  const [oilBrand, setOilBrand] = useState('CAT DEO-ULS 15W-40');
  const [fluidHours, setFluidHours] = useState('250');
  const [viscosity, setViscosity] = useState('14.2'); // cSt at 100°C (Normal is 12.5 - 16.3 for 15W-40)
  const [soot, setSoot] = useState('0.8'); // %
  const [fuelDilution, setFuelDilution] = useState('0.5'); // %
  const [water, setWater] = useState('0.05'); // %
  const [tbn, setTbn] = useState('8.5'); // mg KOH/g

  // Wear Metals (ppm)
  const [metals, setMetals] = useState<Record<string, number>>({
    hierro_fe: 28,
    cobre_cu: 8,
    plomo_pb: 6,
    aluminio_al: 7,
    cromo_cr: 2,
    silicio_si: 9,
    sodio_na: 8,
    estano_sn: 3
  });

  const handleMetalChange = (key: string, val: string) => {
    const num = parseFloat(val) || 0;
    setMetals(prev => ({ ...prev, [key]: num }));
  };

  const limits = CAT_SOS_LIMITS[compartment] || CAT_SOS_LIMITS.motor_diesel;

  // Evaluation computation
  const evaluation = useMemo(() => {
    let criticalCount = 0;
    let alertCount = 0;
    const findings: string[] = [];

    // Evaluate wear metals
    Object.entries(metals).forEach(([key, rawVal]) => {
      const val = Number(rawVal) || 0;
      const limit = limits[key];
      if (!limit) return;

      const metalName = key.replace('_', ' ').toUpperCase();
      if (val >= limit.critical) {
        criticalCount++;
        findings.push(`🚨 CRÍTICO: ${metalName} en ${val} ppm (Límite: ${limit.critical} ppm). Origen probable: ${limit.source}.`);
      } else if (val >= limit.alert) {
        alertCount++;
        findings.push(`⚠️ ALERTA: ${metalName} elevado en ${val} ppm (Umbral de alerta: ${limit.alert} ppm). Monitorear desgaste en ${limit.source}.`);
      }
    });

    // Evaluate physical properties for engine oil
    if (compartment === 'motor_diesel') {
      const sootNum = parseFloat(soot) || 0;
      if (sootNum >= 2.5) {
        criticalCount++;
        findings.push(`🚨 CRÍTICO: Hollín en ${sootNum}% (Límite máx: 2.5%). Riesgo inminente de taponamiento de filtros y desgaste abrasivo.`);
      } else if (sootNum >= 1.5) {
        alertCount++;
        findings.push(`⚠️ ALERTA: Hollín elevado en ${sootNum}%. Revisar inyectores, sincronización o sobrecarga del motor.`);
      }

      const fuelNum = parseFloat(fuelDilution) || 0;
      if (fuelNum >= 4.0) {
        criticalCount++;
        findings.push(`🚨 CRÍTICO: Dilución por combustible en ${fuelNum}% (Límite: 4.0%). Pérdida severa de viscosidad. Posible fuga en sellos de inyectores MEUI.`);
      } else if (fuelNum >= 2.0) {
        alertCount++;
        findings.push(`⚠️ ALERTA: Dilución por combustible en ${fuelNum}%. Inspeccionar líneas de retorno y sellos O-ring de inyectores.`);
      }

      const waterNum = parseFloat(water) || 0;
      if (waterNum >= 0.5) {
        criticalCount++;
        findings.push(`🚨 CRÍTICO: Presencia de agua/humedad en ${waterNum}%. Posible fuga en enfriador de aceite o condensación extrema.`);
      }

      const viscNum = parseFloat(viscosity) || 0;
      if (viscNum < 12.0 || viscNum > 17.0) {
        alertCount++;
        findings.push(`⚠️ ALERTA: Viscosidad a 100°C fuera de especificación SAE 15W-40 (${viscNum} cSt).`);
      }
    }

    let status: 'NORMAL' | 'ALERTA' | 'CRITICO' = 'NORMAL';
    if (criticalCount > 0) status = 'CRITICO';
    else if (alertCount > 0) status = 'ALERTA';

    return {
      status,
      criticalCount,
      alertCount,
      findings
    };
  }, [metals, limits, compartment, soot, fuelDilution, water, viscosity]);

  if (!isOpen) return null;

  const handleInject = () => {
    const compartmentName = compartment === 'motor_diesel' ? 'Cárter de Motor Diésel' : compartment === 'hidraulico' ? 'Sistema Hidráulico' : 'Transmisión / Tren de Fuerza';
    
    let summary = `ANÁLISIS PROGRAMADO DE FLUIDOS S.O.S. CATERPILLAR\n`;
    summary += `Compartimiento: ${compartmentName} | Fluido: ${oilBrand} | Horas de Aceite: ${fluidHours} hrs\n`;
    summary += `Diagnóstico Global: ESTADO ${evaluation.status} (${evaluation.criticalCount} parámetros críticos, ${evaluation.alertCount} en alerta)\n\n`;
    
    summary += `Resultados de Metales de Desgaste (Espectrometría ICP):\n`;
    summary += `• Hierro (Fe): ${metals.hierro_fe} ppm | Cobre (Cu): ${metals.cobre_cu} ppm | Plomo (Pb): ${metals.plomo_pb} ppm\n`;
    summary += `• Aluminio (Al): ${metals.aluminio_al} ppm | Cromo (Cr): ${metals.cromo_cr} ppm | Silicio (Si): ${metals.silicio_si} ppm\n`;
    summary += `• Sodio (Na): ${metals.sodio_na} ppm | Estaño (Sn): ${metals.estano_sn} ppm\n\n`;

    if (compartment === 'motor_diesel') {
      summary += `Propiedades Físico-Químicas:\n`;
      summary += `• Viscosidad @ 100°C: ${viscosity} cSt | Hollín (Soot): ${soot}% | Dilución Combustible: ${fuelDilution}%\n`;
      summary += `• Contenido de Agua: ${water}% | TBN: ${tbn} mg KOH/g\n\n`;
    }

    if (evaluation.findings.length > 0) {
      summary += `Conclusiones y Dictamen S.O.S.:\n${evaluation.findings.join('\n')}\n\n`;
      summary += `Recomendación Venequip: ${evaluation.status === 'CRITICO' ? 'Drenar fluido inmediatamente, reemplazar elementos filtrantes e inspeccionar componentes mecánicos señalados antes de retornar a servicio.' : evaluation.status === 'ALERTA' ? 'Repetir muestreo S.O.S. en 125 horas de operación y verificar estado de filtros.' : 'Continuar con el intervalo regular de mantenimiento preventivo CAT.'}`;
    } else {
      summary += `Conclusiones S.O.S.: Todos los metales de desgaste y propiedades del lubricante se encuentran dentro de los rangos normales de fábrica Caterpillar. Continuar con el intervalo regular de operación.`;
    }

    onInjectIntoReport(summary);
    onClose();
  };

  const handleResetSample = () => {
    setMetals({
      hierro_fe: 28,
      cobre_cu: 8,
      plomo_pb: 6,
      aluminio_al: 7,
      cromo_cr: 2,
      silicio_si: 9,
      sodio_na: 8,
      estano_sn: 3
    });
    setViscosity('14.2');
    setSoot('0.8');
    setFuelDilution('0.5');
    setWater('0.05');
    setTbn('8.5');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-5xl h-[92vh] max-h-[850px] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between shrink-0 border-b border-slate-800 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500 rounded-xl text-slate-950 shadow-md">
              <FlaskConical className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black text-white tracking-wide">
                  Laboratorio y Matriz de Análisis S.O.S. Caterpillar
                </h2>
                <span className="bg-emerald-400/20 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Norma ASTM / CAT SOS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluación espectrométrica de metales de desgaste, hollín, contaminación y degradación de lubricante
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

        {/* Compartment & Oil Config Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
          <div>
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wide mb-1">
              Compartimiento Evaluado
            </label>
            <select
              value={compartment}
              onChange={(e) => setCompartment(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
            >
              <option value="motor_diesel">Cárter Motor Diésel (CAT DEO)</option>
              <option value="hidraulico">Sistema Hidráulico (CAT HYDO)</option>
              <option value="transmision">Transmisión / Tren de Fuerza (CAT TDTO)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wide mb-1">
              Tipo de Aceite / Grado
            </label>
            <input
              type="text"
              value={oilBrand}
              onChange={(e) => setOilBrand(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wide mb-1">
              Horas de Servicio del Aceite
            </label>
            <input
              type="number"
              value={fluidHours}
              onChange={(e) => setFluidHours(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
              placeholder="e.g. 250"
            />
          </div>
        </div>

        {/* Body: Split View */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-y-auto bg-slate-100/40 p-4 sm:p-6 gap-6">
          
          {/* Left: Input Matrix (7 Cols) */}
          <div className="md:col-span-7 space-y-4">
            
            {/* Wear Metals Grid */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <Droplets className="h-4 w-4 text-amber-500" />
                  Metales de Desgaste (ICP PPM)
                </h3>
                <button
                  onClick={handleResetSample}
                  className="text-[11px] text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  Restablecer
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                {Object.entries(limits).map(([metalKey, limit]) => {
                  const currentVal = metals[metalKey] || 0;
                  const isCrit = currentVal >= limit.critical;
                  const isAlert = !isCrit && currentVal >= limit.alert;

                  return (
                    <div 
                      key={metalKey}
                      className={`p-2.5 rounded-lg border transition ${
                        isCrit ? 'bg-rose-50 border-rose-300' : isAlert ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-black text-slate-800 uppercase text-[11px]">
                          {metalKey.replace('_', ' ')}
                        </span>
                        <span className="text-[9px] text-slate-500 font-semibold">
                          &lt;{limit.normal}
                        </span>
                      </div>
                      <input
                        type="number"
                        value={currentVal}
                        onChange={(e) => handleMetalChange(metalKey, e.target.value)}
                        className={`w-full px-2 py-1 text-xs font-black rounded border text-center ${
                          isCrit ? 'bg-rose-100 text-rose-900 border-rose-400' : isAlert ? 'bg-amber-100 text-amber-900 border-amber-400' : 'bg-white text-slate-900 border-slate-300'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Physical / Chemical Properties */}
            {compartment === 'motor_diesel' && (
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  Propiedades Físico-Químicas y Contaminación
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Viscosidad @ 100°C (cSt)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={viscosity}
                      onChange={(e) => setViscosity(e.target.value)}
                      className="w-full px-2.5 py-1.5 font-bold border border-slate-300 rounded-lg text-center"
                    />
                    <span className="text-[9px] text-slate-400 block text-center mt-0.5">Norma 12.5 - 16.3</span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Hollín / Soot (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={soot}
                      onChange={(e) => setSoot(e.target.value)}
                      className="w-full px-2.5 py-1.5 font-bold border border-slate-300 rounded-lg text-center"
                    />
                    <span className="text-[9px] text-slate-400 block text-center mt-0.5">Máx: 2.5%</span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Combustible (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={fuelDilution}
                      onChange={(e) => setFuelDilution(e.target.value)}
                      className="w-full px-2.5 py-1.5 font-bold border border-slate-300 rounded-lg text-center"
                    />
                    <span className="text-[9px] text-slate-400 block text-center mt-0.5">Máx: 4.0%</span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Agua (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={water}
                      onChange={(e) => setWater(e.target.value)}
                      className="w-full px-2.5 py-1.5 font-bold border border-slate-300 rounded-lg text-center"
                    />
                    <span className="text-[9px] text-slate-400 block text-center mt-0.5">Máx: 0.1%</span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">TBN (mg KOH/g)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={tbn}
                      onChange={(e) => setTbn(e.target.value)}
                      className="w-full px-2.5 py-1.5 font-bold border border-slate-300 rounded-lg text-center"
                    />
                    <span className="text-[9px] text-slate-400 block text-center mt-0.5">Mín: 4.0</span>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Right: Instant Diagnostic Card (5 Cols) */}
          <div className="md:col-span-5 space-y-4">
            
            {/* Status Banner */}
            <div className={`p-5 rounded-2xl border shadow-sm text-white ${
              evaluation.status === 'CRITICO' ? 'bg-rose-900 border-rose-700' : evaluation.status === 'ALERTA' ? 'bg-amber-900 border-amber-700' : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                  Diagnóstico Automático
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                  evaluation.status === 'CRITICO' ? 'bg-rose-500 text-white' : evaluation.status === 'ALERTA' ? 'bg-amber-500 text-slate-950' : 'bg-emerald-500 text-white'
                }`}>
                  ESTADO {evaluation.status}
                </span>
              </div>

              <h4 className="text-sm font-bold text-white mb-2">
                {evaluation.status === 'CRITICO' ? 'Acción Correctiva Inmediata Requerida' : evaluation.status === 'ALERTA' ? 'Atención y Muestreo Anticipado' : 'Fluido y Componentes en Estado Óptimo'}
              </h4>

              <p className="text-xs text-slate-300">
                {evaluation.findings.length > 0
                  ? `Se detectaron ${evaluation.criticalCount} anomalías críticas y ${evaluation.alertCount} parámetros en rango de advertencia.`
                  : 'Todos los parámetros espectrométricos y viscosimétricos cumplen con las tolerancias de fábrica Caterpillar.'}
              </p>
            </div>

            {/* Detailed Findings List */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
              <h5 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                Interpretación y Origen de Desgaste
              </h5>

              {evaluation.findings.length === 0 ? (
                <div className="p-3 bg-emerald-50 text-emerald-900 rounded-lg text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>No se evidencian trazas anómalas de desgaste o contaminación.</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {evaluation.findings.map((f, i) => (
                    <div key={i} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium leading-relaxed">
                      {f}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400 font-medium">
            Muestras interpretadas bajo catálogo SIS 2.0 y Guía de Contaminación CAT PEHP6001.
          </div>

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
              <span>Insertar Dictamen S.O.S. en Informe</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { 
  Wrench, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Filter, 
  TrendingUp, 
  Calendar, 
  FileText, 
  ArrowRight, 
  PlusCircle, 
  Layers, 
  ShieldCheck, 
  Zap, 
  Info, 
  ChevronRight, 
  Sparkles,
  Calculator,
  RefreshCw,
  Sliders,
  Check
} from 'lucide-react';
import { EquipmentFleetRecord, MaintenanceLevel, InformeTecnico } from './types';
import { 
  CAT_MAINTENANCE_CONFIGS, 
  calculateNextCATMaintenance, 
  detectMaintenanceLevelFromText 
} from './catMaintenanceEngine';

interface PredictiveMaintenanceViewProps {
  fleet: EquipmentFleetRecord[];
  onSelectEquipmentToReport?: (equipment: EquipmentFleetRecord) => void;
  onRefreshFleet?: () => void;
}

export const PredictiveMaintenanceView: React.FC<PredictiveMaintenanceViewProps> = ({
  fleet,
  onSelectEquipmentToReport,
  onRefreshFleet
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('all');
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [activeDetailEquipment, setActiveDetailEquipment] = useState<EquipmentFleetRecord | null>(null);

  // Simulator / Quick Predictor Calculator State
  const [calcModel, setCalcModel] = useState('CATERPILLAR C15 ACERT');
  const [calcHours, setCalcHours] = useState<number>(5120);
  const [calcLastType, setCalcLastType] = useState<MaintenanceLevel>('PM1');

  // Computed quick simulation
  const calcResult = useMemo(() => {
    return calculateNextCATMaintenance(calcHours, calcLastType);
  }, [calcHours, calcLastType]);

  // Clients and models lists for filter dropdowns
  const uniqueClients = useMemo(() => {
    const set = new Set<string>();
    fleet.forEach(f => {
      if (f.cliente) set.add(f.cliente);
    });
    return Array.from(set).sort();
  }, [fleet]);

  const uniqueModels = useMemo(() => {
    const set = new Set<string>();
    fleet.forEach(f => {
      if (f.modelo) set.add(f.modelo);
    });
    return Array.from(set).sort();
  }, [fleet]);

  // Filtered fleet
  const filteredFleet = useMemo(() => {
    return fleet.filter(item => {
      const matchSearch = 
        !searchTerm ||
        item.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.serial_equipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.serial_motor && item.serial_motor.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sucursal.toLowerCase().includes(searchTerm.toLowerCase());

      const matchClient = selectedClient === 'all' || item.cliente === selectedClient;
      const matchModel = selectedModel === 'all' || item.modelo === selectedModel;
      const matchUrgency = selectedUrgency === 'all' || item.nextRecommendedMaintenance.urgency === selectedUrgency;

      return matchSearch && matchClient && matchModel && matchUrgency;
    });
  }, [fleet, searchTerm, selectedClient, selectedModel, selectedUrgency]);

  // Fleet Statistics
  const stats = useMemo(() => {
    const total = fleet.length;
    const overdue = fleet.filter(f => f.nextRecommendedMaintenance.urgency === 'vencido').length;
    const upcoming = fleet.filter(f => f.nextRecommendedMaintenance.urgency === 'proximo').length;
    const onTrack = fleet.filter(f => f.nextRecommendedMaintenance.urgency === 'al_dia').length;
    const totalHours = fleet.reduce((acc, f) => acc + (f.lastHorometro || 0), 0);

    return { total, overdue, upcoming, onTrack, totalHours };
  }, [fleet]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-700 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-black tracking-wider uppercase mb-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Módulo de Mantenimiento Preventivo Predictivo Caterpillar</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Control de Flota y Ciclos de Horómetro CAT</span>
            </h2>
            <p className="text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
              Algoritmo inteligente de proyección que analiza los informes técnicos registrados, compara los horómetros acumulados con los intervalos oficiales del fabricante (PM1, PM2, PM3, PM4 y Overhaul) y calcula con exactitud el próximo servicio preventivo correspondiente.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onRefreshFleet && (
              <button
                onClick={onRefreshFleet}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
                title="Actualizar datos de flota desde Firestore"
              >
                <RefreshCw className="w-4 h-4 text-amber-400" />
                <span>Actualizar Flota</span>
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-700/80">
          <div className="bg-slate-800/80 backdrop-blur rounded-xl p-3 border border-slate-700">
            <span className="text-[11px] font-semibold text-slate-400 block">Total Equipos</span>
            <span className="text-xl font-black text-white">{stats.total}</span>
          </div>

          <div className="bg-rose-950/40 rounded-xl p-3 border border-rose-800/50">
            <span className="text-[11px] font-semibold text-rose-300 block">Mantenimientos Vencidos</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span className="text-xl font-black text-rose-400">{stats.overdue}</span>
            </div>
          </div>

          <div className="bg-amber-950/40 rounded-xl p-3 border border-amber-800/50">
            <span className="text-[11px] font-semibold text-amber-300 block">Próximos (&lt; 50 Hrs)</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="text-xl font-black text-amber-400">{stats.upcoming}</span>
            </div>
          </div>

          <div className="bg-emerald-950/40 rounded-xl p-3 border border-emerald-800/50">
            <span className="text-[11px] font-semibold text-emerald-300 block">Equipos Al Día</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xl font-black text-emerald-400">{stats.onTrack}</span>
            </div>
          </div>

          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 col-span-2 sm:col-span-1">
            <span className="text-[11px] font-semibold text-slate-400 block">Horas Acumuladas</span>
            <span className="text-xl font-black text-amber-400">
              {stats.totalHours.toLocaleString('es-VE')} <span className="text-xs text-slate-300 font-normal">hrs</span>
            </span>
          </div>
        </div>
      </div>

      {/* Simulator / Quick Calculator Widget */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500 text-slate-950 rounded-xl font-black">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Calculadora Rápida de Ciclo de Mantenimiento Preventivo Multimarca</h3>
              <p className="text-xs text-slate-600">Simula cualquier horómetro para consultar qué mantenimiento corresponde (CAT, Cummins, Perkins, Detroit).</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">Modelo de Equipo / Motor</label>
            <input
              type="text"
              value={calcModel}
              onChange={(e) => setCalcModel(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              placeholder="Ej: C15, 3516B, 3412..."
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">Horómetro Actual de Operación (Horas)</label>
            <input
              type="number"
              value={calcHours}
              onChange={(e) => setCalcHours(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-black text-amber-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              placeholder="Ej: 5240"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">Último Mantenimiento Efectuado</label>
            <select
              value={calcLastType}
              onChange={(e) => setCalcLastType(e.target.value as MaintenanceLevel)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="PM1">PM1 (250 Horas)</option>
              <option value="PM2">PM2 (500 Horas)</option>
              <option value="PM3">PM3 (1,000 Horas)</option>
              <option value="PM4">PM4 (2,000 Horas)</option>
              <option value="PM5">PM5 (4,000 Horas)</option>
              <option value="OVERHAUL">Overhaul (10,000+ Horas)</option>
            </select>
          </div>
        </div>

        {/* Live Calculation Output Card */}
        <div className="mt-4 bg-white rounded-xl p-4 border border-amber-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-amber-500 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded-lg">
                PRÓXIMO: {calcResult.level} ({CAT_MAINTENANCE_CONFIGS[calcResult.level]?.hoursInterval || 250} Horas)
              </span>
              <span className="text-xs font-bold text-slate-700">
                Horómetro Meta: <strong className="text-slate-900 font-black">{calcResult.targetHorometro.toLocaleString('es-VE')} hrs</strong>
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                calcResult.urgency === 'vencido' 
                  ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                  : calcResult.urgency === 'proximo' 
                  ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}>
                {calcResult.urgency === 'vencido' ? '¡Vencido / Excedido!' : calcResult.urgency === 'proximo' ? '¡Próximo Servicio!' : 'Al Día'}
              </span>
            </div>
            <p className="text-xs text-slate-600">{calcResult.description}</p>
          </div>

          <div className="text-right shrink-0 flex items-center gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Margen Restante</span>
              <span className="text-lg font-black text-slate-900">{calcResult.hoursRemaining} Horas</span>
            </div>
            <div className="border-l border-slate-200 pl-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Proyección Estimada</span>
              <span className="text-xs font-bold text-slate-700">{calcResult.suggestedDateProjection}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por modelo, serial de máquina, cliente..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Client Filter */}
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">Todos los Clientes</option>
            {uniqueClients.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Model Filter */}
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">Todos los Modelos CAT</option>
            {uniqueModels.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          {/* Urgency Filter */}
          <select
            value={selectedUrgency}
            onChange={(e) => setSelectedUrgency(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">Todos los Estados</option>
            <option value="vencido">⚠️ Vencidos</option>
            <option value="proximo">⏳ Próximos (&lt; 50h)</option>
            <option value="al_dia">✅ Al Día</option>
          </select>
        </div>
      </div>

      {/* Fleet Table / Grid */}
      {filteredFleet.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
          <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
            <Wrench className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No se encontraron equipos registrados</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            A medida que redactes y guardes informes técnicos en el sistema, los seriales, modelos y horómetros se agruparán automáticamente aquí para predecir sus mantenimientos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFleet.map((eq) => {
            const next = eq.nextRecommendedMaintenance;
            const cycleInterval = 250;
            const progressInCycle = Math.min(100, Math.max(0, ((cycleInterval - next.hoursRemaining) / cycleInterval) * 100));

            return (
              <div
                key={eq.equipmentKey}
                className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-amber-400 hover:shadow-lg transition-all flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Status colored top stripe */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                  next.urgency === 'vencido' 
                    ? 'bg-rose-500' 
                    : next.urgency === 'proximo' 
                    ? 'bg-amber-500' 
                    : 'bg-emerald-500'
                }`} />

                <div>
                  {/* Top Metadata */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider block">
                        {eq.cliente}
                      </span>
                      <h4 className="text-base font-black text-slate-900 group-hover:text-amber-600 transition">
                        {eq.modelo}
                      </h4>
                    </div>

                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      next.urgency === 'vencido'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : next.urgency === 'proximo'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}>
                      {next.urgency === 'vencido' ? 'Vencido' : next.urgency === 'proximo' ? 'Próximo' : 'Al Día'}
                    </span>
                  </div>

                  {/* Serial Details */}
                  <div className="bg-slate-50 rounded-xl p-2.5 space-y-1 text-xs border border-slate-100 mb-3">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Serial Máquina:</span>
                      <strong className="font-mono text-slate-900">{eq.serial_equipo}</strong>
                    </div>
                    {eq.serial_motor && (
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Serial Motor:</span>
                        <strong className="font-mono text-slate-900">{eq.serial_motor}</strong>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Último Horómetro:</span>
                      <strong className="text-amber-800 font-bold">{eq.lastHorometro.toLocaleString('es-VE')} hrs</strong>
                    </div>
                  </div>

                  {/* Prediction Highlight Box */}
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 rounded-xl p-3 space-y-2 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-amber-950">Próximo Mantenimiento:</span>
                      <span className="bg-amber-500 text-slate-950 text-[11px] font-black px-2 py-0.5 rounded-lg shadow-sm">
                        {next.level} ({CAT_MAINTENANCE_CONFIGS[next.level]?.hoursInterval}h)
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Meta: <strong>{next.targetHorometro.toLocaleString('es-VE')} hrs</strong></span>
                      <span className="font-black text-slate-900">
                        {next.hoursRemaining <= 0 ? 'Excedido por ' + Math.abs(next.hoursRemaining) + ' hrs' : `Faltan ${next.hoursRemaining} hrs`}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="w-full bg-amber-200/60 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full transition-all rounded-full ${
                            next.urgency === 'vencido' ? 'bg-rose-600' : next.urgency === 'proximo' ? 'bg-amber-600' : 'bg-emerald-600'
                          }`}
                          style={{ width: `${progressInCycle}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                        <span>Ciclo de 250h</span>
                        <span>Proyección: {next.suggestedDateProjection}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setActiveDetailEquipment(eq)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Info className="w-3.5 h-3.5 text-slate-600" />
                    <span>Ver Plan CAT</span>
                  </button>

                  {onSelectEquipmentToReport && (
                    <button
                      onClick={() => onSelectEquipmentToReport(eq)}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
                      title="Crear informe técnico pre-llenado con los datos de esta máquina"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Informe</span>
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Equipment Detail Modal */}
      {activeDetailEquipment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-scaleUp">
            
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-6 rounded-t-3xl flex items-start justify-between gap-4 sticky top-0 z-10">
              <div>
                <span className="text-amber-400 text-xs font-black uppercase tracking-wider block">
                  {activeDetailEquipment.cliente} • {activeDetailEquipment.sucursal}
                </span>
                <h3 className="text-xl font-black text-white mt-1">
                  {activeDetailEquipment.modelo} (Serial: {activeDetailEquipment.serial_equipo})
                </h3>
              </div>
              <button
                onClick={() => setActiveDetailEquipment(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              
              {/* Next Recommended Maintenance Focus Box */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-amber-500 text-slate-950 rounded-lg font-black text-xs">
                      {activeDetailEquipment.nextRecommendedMaintenance.level}
                    </span>
                    <h4 className="font-black text-slate-900 text-sm">
                      {CAT_MAINTENANCE_CONFIGS[activeDetailEquipment.nextRecommendedMaintenance.level]?.title}
                    </h4>
                  </div>
                  <span className="text-xs font-bold text-slate-700">
                    Meta: <strong>{activeDetailEquipment.nextRecommendedMaintenance.targetHorometro} hrs</strong>
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  {activeDetailEquipment.nextRecommendedMaintenance.description}
                </p>
              </div>

              {/* Tasks to Check */}
              <div className="space-y-2">
                <h5 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-500" />
                  <span>Protocolo de Tareas e Inspecciones Requeridas por Caterpillar</span>
                </h5>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                  {CAT_MAINTENANCE_CONFIGS[activeDetailEquipment.nextRecommendedMaintenance.level]?.itemsToCheck.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Parts Kit */}
              <div className="space-y-2">
                <h5 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-emerald-600" />
                  <span>Kits de Filtros y Repuestos Originales CAT Recomendados</span>
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeDetailEquipment.nextRecommendedMaintenance.recommendedKit.map((part, idx) => (
                    <div key={idx} className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-2.5 text-xs font-semibold text-emerald-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span>{part}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fluid Samples */}
              <div className="space-y-2">
                <h5 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-sky-600" />
                  <span>Programa de Muestras de Fluidos SOS CAT</span>
                </h5>
                <div className="flex flex-wrap gap-2">
                  {activeDetailEquipment.nextRecommendedMaintenance.fluidSamples.map((sample, idx) => (
                    <span key={idx} className="bg-sky-50 text-sky-900 border border-sky-200 px-3 py-1.5 rounded-xl text-xs font-bold">
                      🧪 {sample}
                    </span>
                  ))}
                </div>
              </div>

              {/* History of Reports on this Machine */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h5 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-600" />
                  <span>Historial de Informes y Servicios Realizados ({activeDetailEquipment.maintenanceHistory.length})</span>
                </h5>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {activeDetailEquipment.maintenanceHistory.map((hist, i) => (
                    <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-900 font-black">{hist.numeroServicio}</strong>
                          <span className="bg-slate-200 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded">
                            {hist.tipoServicio}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">{hist.actividad}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-amber-800 block">{hist.horometro} hrs</span>
                        <span className="text-[10px] text-slate-400">{hist.fecha}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 rounded-b-3xl border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setActiveDetailEquipment(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
              >
                Cerrar
              </button>
              {onSelectEquipmentToReport && (
                <button
                  onClick={() => {
                    const eq = activeDetailEquipment;
                    setActiveDetailEquipment(null);
                    onSelectEquipmentToReport(eq);
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Crear Informe para este Equipo</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

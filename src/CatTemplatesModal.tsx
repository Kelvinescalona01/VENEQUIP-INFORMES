import React from 'react';
import { 
  X, 
  Layers, 
  Wrench, 
  Zap, 
  Sparkles, 
  CheckCircle2, 
  ChevronRight, 
  FileText, 
  Flame, 
  Cpu 
} from 'lucide-react';
import { InformeTecnico } from './types';

export interface CatReportTemplate {
  id: string;
  title: string;
  levelBadge: string;
  badgeColor: string;
  description: string;
  category: 'Preventivo' | 'Diagnóstico' | 'Prueba de Carga' | 'Inspección';
  data: Partial<InformeTecnico>;
}

export const CAT_TEMPLATES: CatReportTemplate[] = [
  {
    id: 'pm1_250h',
    title: 'Mantenimiento Preventivo PM1 (250 Horas)',
    levelBadge: 'PM1 - 250 HRS',
    badgeColor: 'bg-emerald-500 text-white',
    category: 'Preventivo',
    description: 'Servicio básico de lubricación, reemplazo de filtros de aceite y combustible, y toma de muestras S.O.S.',
    data: {
      encabezado_venequip: {
        empresa: 'CONSORCIO DE COGESTIÓN VENEQUIP S.A.',
        rif: 'J404644865',
        sucursal: 'SUCURSAL PRINCIPAL GUACARA',
        fecha: new Date().toISOString().split('T')[0],
        numero_servicio: 'S' + Math.floor(1000 + Math.random() * 9000),
        actividad: 'Mantenimiento Preventivo PM1 (250 Horas)',
        cliente: '',
        localizacion: '',
        fabricante: 'CATERPILLAR',
        modelo: 'C15 ACERT GENERATOR SET',
        serial_equipo: '',
        serial_motor: '',
        horas_motor: '250',
        horas_panel: '250'
      },
      secciones_informe: {
        "1_solicitud_cliente": "Ejecución de Mantenimiento Preventivo PM1 a las 250 horas de operación para Grupo Electrógeno Caterpillar, de acuerdo con el plan de mantenimiento recomendado por el fabricante.",
        "2_condiciones_fallas": "El equipo se encuentra operativo en modo Standby automático. No se aprecian códigos de falla activos en el panel EMCP 4.2. Temperatura ambiente: 30°C. Nivel de refrigerante en rango adecuado.",
        "3_actividades_efectuadas": "1. Drenaje total de aceite usado del cárter de motor.\n2. Reemplazo de elemento de filtro de aceite principal CAT 1R-1808.\n3. Reemplazo de filtro separador de agua y combustible CAT 1R-0770.\n4. Reemplazo de filtro de combustible secundario de alta eficiencia (2µm) CAT 1R-0749.\n5. Toma de muestra de aceite usado para análisis programado S.O.S. (Kit 169-8373).\n6. Llenado de cárter con aceite CAT DEO-ULS 15W-40 hasta nivel máximo en varilla.\n7. Cebado y purga de aire del sistema de combustible mediante bomba de cebado manual.\n8. Inspección visual de correas, poleas y mangueras de refrigeración.\n9. Encendido de prueba en vacío durante 10 minutos para verificación de fugas y presión de aceite (48 PSI en ralentí).",
        herramientas_utilizadas: [
          { nombre: 'Kit de Llaves de Filtros de Cadena CAT', numero_parte: '1U-5809', cantidad: 1 },
          { nombre: 'Bomba de Muestreo de Fluidos SOS CAT', numero_parte: '169-8373', cantidad: 1 },
          { nombre: 'Bandeja de Drenaje de Aceite 20 Gal', numero_parte: '8T-0450', cantidad: 1 }
        ],
        "4_fallas_detectadas": "No se detectaron fallas mecánicas ni electrónicas durante la ejecución del servicio PM1. Parámetros de presión de aceite y temperatura dentro de especificación de fábrica.",
        "5_causas_fallas": "No aplica. Servicio preventivo programado según horas de funcionamiento.",
        "6_conclusiones_recomendaciones": "El grupo electrógeno Caterpillar quedó completamente operativo y listo para responder ante eventos de falla de red comercial. Se recomienda programar el siguiente servicio preventivo PM2 al alcanzar las 500 horas de operación o en un lapso no mayor a 6 meses.",
        "7_registro_fotografico": []
      }
    }
  },
  {
    id: 'pm2_500h',
    title: 'Mantenimiento Preventivo PM2 (500 Horas)',
    levelBadge: 'PM2 - 500 HRS',
    badgeColor: 'bg-blue-600 text-white',
    category: 'Preventivo',
    description: 'Servicio intermedio completo: Aceite, todos los filtros, inspección de admisión de aire, correas y aditivo refrigerante.',
    data: {
      encabezado_venequip: {
        empresa: 'CONSORCIO DE COGESTIÓN VENEQUIP S.A.',
        rif: 'J404644865',
        sucursal: 'SUCURSAL PRINCIPAL GUACARA',
        fecha: new Date().toISOString().split('T')[0],
        numero_servicio: 'S' + Math.floor(1000 + Math.random() * 9000),
        actividad: 'Mantenimiento Preventivo PM2 (500 Horas)',
        cliente: '',
        localizacion: '',
        fabricante: 'CATERPILLAR',
        modelo: 'C18 ACERT GENERATOR SET',
        serial_equipo: '',
        serial_motor: '',
        horas_motor: '500',
        horas_panel: '500'
      },
      secciones_informe: {
        "1_solicitud_cliente": "Realizar mantenimiento preventivo intermedio PM2 a las 500 horas de servicio, incluyendo renovación de filtros de lubricación, combustible, aire y evaluación de baterías.",
        "2_condiciones_fallas": "Grupo electrógeno en sala de máquinas. Baterías de arranque en 25.4V DC en flotación. Filtros de aire primarios con ligera saturación por polvo ambiente.",
        "3_actividades_efectuadas": "1. Todo el protocolo de lubricación y filtración PM1 (Aceite CAT DEO 15W-40 + Filtros 1R-1808, 1R-0770, 1R-0749).\n2. Inspección y reemplazo del elemento primario de filtro de aire Radial Seal CAT 142-1339.\n3. Limpieza y desincrustado del respiradero de cárter de motor (Crankcase Breather).\n4. Prueba de acidez y concentración de inhibidor en refrigerante CAT ELC mediante tiras químicas 298-5311.\n5. Limpieza, ajuste y aplicación de grasa dieléctrica en bornes de baterías de 24V.\n6. Comprobación y ajuste de tensión en correas serpentinas Poly-V.\n7. Prueba de arranque y comprobación de parámetros en módulo EMCP 4.2.",
        herramientas_utilizadas: [
          { nombre: 'Tensiómetro de Correas CAT', numero_parte: '144-0235', cantidad: 1 },
          { nombre: 'Kit de Prueba de Refrigerante ELC CAT', numero_parte: '298-5311', cantidad: 1 },
          { nombre: 'Multímetro Fluke 87V CAT', numero_parte: '9U-7330', cantidad: 1 }
        ],
        "4_fallas_detectadas": "Leve sulfatación en terminal negativo de batería #2 corregida durante la limpieza. Sin fugas en sistema de enfriamiento.",
        "5_causas_fallas": "Sulfatación habitual por humedad ambiental en sala de generadores.",
        "6_conclusiones_recomendaciones": "Servicio PM2 completado exitosamente. Equipo con excelente respuesta de aceleración y regulación de frecuencia (60.0 Hz en vacío). Próximo servicio PM1 a las 750 hrs.",
        "7_registro_fotografico": []
      }
    }
  },
  {
    id: 'pm3_1000h',
    title: 'Mantenimiento Preventivo PM3 (1,000 Horas / Afinación Mayor)',
    levelBadge: 'PM3 - 1,000 HRS',
    badgeColor: 'bg-amber-500 text-slate-950',
    category: 'Preventivo',
    description: 'Calibración de holgura de válvulas de admisión/escape, ajuste de inyectores MEUI, lavado de radiador y megado de devanados.',
    data: {
      encabezado_venequip: {
        empresa: 'CONSORCIO DE COGESTIÓN VENEQUIP S.A.',
        rif: 'J404644865',
        sucursal: 'SUCURSAL PRINCIPAL GUACARA',
        fecha: new Date().toISOString().split('T')[0],
        numero_servicio: 'S' + Math.floor(1000 + Math.random() * 9000),
        actividad: 'Mantenimiento Preventivo PM3 (Calibración Válvulas e Inyectores)',
        cliente: '',
        localizacion: '',
        fabricante: 'CATERPILLAR',
        modelo: '3512B / 3516B GENERATOR SET',
        serial_equipo: '',
        serial_motor: '',
        horas_motor: '1000',
        horas_panel: '1000'
      },
      secciones_informe: {
        "1_solicitud_cliente": "Ejecución de Mantenimiento Preventivo PM3 de 1,000 horas: Calibración mecánica de tren de válvulas, sincronización de inyectores MEUI, lavado químico de radiador y prueba de aislamiento eléctrico en alternador.",
        "2_condiciones_fallas": "Motor detenido y enfriado a temperatura ambiente (< 35°C) para permitir medición precisa de holgura de válvulas según manual Caterpillar.",
        "3_actividades_efectuadas": "1. Desmontaje de tapas de culata de válvulas y reemplazo preventivo de empaquetaduras.\n2. Calibración de luz de válvulas de admisión (0.38 mm / 0.015 in) y escape (0.76 mm / 0.030 in) según carta de sincronización del volante.\n3. Calibración de altura de inyectores unitarios electrónicos (MEUI) con indicador de cuadrante y herramienta de ajuste CAT.\n4. Lavado y desincrustado exterior de serpentín de radiador y posenfriador ATAAC.\n5. Medición de resistencia de aislamiento con Megóhmetro a 1000V DC (Estator: 250 MΩ, Rotor: 180 MΩ - Estado Óptimo).\n6. Cambio completo de aceite CAT DEO 15W-40 y totalidad de filtros de aire, combustible y lubricación.\n7. Encendido, purga y prueba de estabilidad a 1800 RPM.",
        herramientas_utilizadas: [
          { nombre: 'Herramienta de Altura de Inyectores MEUI CAT', numero_parte: '9U-7227', cantidad: 1 },
          { nombre: 'Juego de Galgas Calibradas de Válvulas CAT', numero_parte: '202-8610', cantidad: 1 },
          { nombre: 'Megóhmetro Digital Fluke 1587 FC CAT', numero_parte: '257-8724', cantidad: 1 }
        ],
        "4_fallas_detectadas": "Luz de válvulas de escape en cilindros 3 y 5 se encontraban con holgura fuera de tolerancia (+0.12 mm), ajustadas a especificación nominal.",
        "5_causas_fallas": "Asentamiento mecánico normal del tren de balancines y varillas de empuje a las 1,000 horas de ciclo de carga.",
        "6_conclusiones_recomendaciones": "Afinación mecánica concluida con parámetros exactos de fábrica. Se constató reducción de nivel sonoro y combustión perfecta sin trazas de humo. Aislamiento dieléctrico del generador en nivel excelente.",
        "7_registro_fotografico": []
      }
    }
  },
  {
    id: 'load_bank_test',
    title: 'Prueba de Banco de Carga Resistivo (Load Bank 100%)',
    levelBadge: 'BANCO DE CARGA',
    badgeColor: 'bg-rose-600 text-white',
    category: 'Prueba de Carga',
    description: 'Protocolo de prueba escalonada (25%, 50%, 75%, 100% y 110%) para descarbonización y certificación de potencia continua.',
    data: {
      encabezado_venequip: {
        empresa: 'CONSORCIO DE COGESTIÓN VENEQUIP S.A.',
        rif: 'J404644865',
        sucursal: 'SUCURSAL PRINCIPAL GUACARA',
        fecha: new Date().toISOString().split('T')[0],
        numero_servicio: 'S' + Math.floor(1000 + Math.random() * 9000),
        actividad: 'Prueba de Rendimiento con Banco de Carga Resistivo',
        cliente: '',
        localizacion: '',
        fabricante: 'CATERPILLAR',
        modelo: 'C32 ACERT GENERATOR SET',
        serial_equipo: '',
        serial_motor: '',
        horas_motor: '1500',
        horas_panel: '1500'
      },
      secciones_informe: {
        "1_solicitud_cliente": "Certificación de capacidad térmica y eléctrica mediante prueba de carga resistiva escalonada por 4 horas continuas según norma NFPA 110 / ISO 8528.",
        "2_condiciones_fallas": "Grupo electrógeno conectado a banco de carga resistivo móvil con cables de fuerza 4/0 AWG debidamente torqueados. Sistema de enfriamiento limpio.",
        "3_actividades_efectuadas": "1. Conexión y verificación de sentido de giro de fases en bornes de potencia del generador.\n2. Paso 1 (0 a 30 min): Aplicación de 25% de carga (200 kW) - Temp. Refrigerante 78°C, Presión Aceite 52 PSI.\n3. Paso 2 (30 a 60 min): Aplicación de 50% de carga (400 kW) - Temp. 84°C, Presión 48 PSI.\n4. Paso 3 (60 a 120 min): Aplicación de 75% de carga (600 kW) - Temp. 89°C, Presión 45 PSI.\n5. Paso 4 (120 a 240 min): Aplicación de 100% de carga nominal (800 kW) - Temp. estabilizada en 92°C, Presión 42 PSI.\n6. Medición de armónicos THD-V (< 2.2%) y caída de frecuencia (0.0% con gobernador Isochronous).\n7. Paso de enfriamiento (Cooldown) por 10 minutos sin carga.",
        herramientas_utilizadas: [
          { nombre: 'Banco de Carga Resistivo Forzado 1000 kW', numero_parte: 'LB-1000', cantidad: 1 },
          { nombre: 'Analizador de Redes y Calidad de Energía Fluke 435', numero_parte: '284-4860', cantidad: 1 },
          { nombre: 'Cámara Termográfica Fluke Ti480 PRO', numero_parte: '522-8314', cantidad: 1 }
        ],
        "4_fallas_detectadas": "Comportamiento térmico y eléctrico excelente. No se detectaron puntos calientes (Hotspots) en terminales de fuerza ni sobretemperatura en devanados del generador.",
        "5_causas_fallas": "No aplica. Equipo en óptimas condiciones mecánicas y térmicas.",
        "6_conclusiones_recomendaciones": "El grupo generador Caterpillar C32 supera satisfactoriamente la prueba de carga al 100% de su placa continua, certificando su disponibilidad total para respaldo crítico hospitalario/industrial.",
        "7_registro_fotografico": []
      }
    }
  }
];

interface CatTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (template: CatReportTemplate) => void;
}

export const CatTemplatesModal: React.FC<CatTemplatesModalProps> = ({
  isOpen,
  onClose,
  onApplyTemplate
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between shrink-0 border-b border-slate-800 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500 rounded-xl text-slate-950 shadow-md">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black text-white tracking-wide">
                  Plantillas Rápidas de Informes Técnicos Caterpillar
                </h2>
                <span className="bg-amber-400/20 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-400/30">
                  Estándar Venequip
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Carga instantánea de protocolos oficiales de mantenimiento preventivo, afinación y pruebas de carga
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
        <div className="p-6 overflow-y-auto space-y-4 bg-slate-50">
          <p className="text-xs text-slate-600 font-medium">
            Seleccione una plantilla técnica para prellenar de forma inteligente todas las secciones, herramientas oficiales CAT y recomendaciones según el intervalo de servicio:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CAT_TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.id}
                onClick={() => {
                  onApplyTemplate(tmpl);
                  onClose();
                }}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-amber-400 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${tmpl.badgeColor}`}>
                      {tmpl.levelBadge}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 uppercase">
                      {tmpl.category}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-slate-900 group-hover:text-amber-600 transition-colors mb-1.5">
                    {tmpl.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {tmpl.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-800 group-hover:text-amber-700">
                  <span>Cargar Protocolo Completo</span>
                  <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
          >
            Cancelar
          </button>
        </div>

      </div>
    </div>
  );
};

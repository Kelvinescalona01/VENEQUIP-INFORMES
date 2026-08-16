import { InformeTecnico, MaintenanceLevel, MaintenanceIntervalConfig, EquipmentFleetRecord } from './types';

export const CAT_MAINTENANCE_CONFIGS: Record<MaintenanceLevel, MaintenanceIntervalConfig> = {
  PM1: {
    level: 'PM1',
    hoursInterval: 250,
    title: 'Mantenimiento Preventivo PM1 (250 Horas)',
    description: 'Servicio básico de lubricación, filtración y muestreo de fluidos SOS para motores y generadores CAT.',
    itemsToCheck: [
      'Cambio de aceite de motor CAT DEO 15W-40 / 10W-30',
      'Cambio de elemento de filtro de aceite de motor',
      'Cambio de filtro de combustible primario y separador de agua',
      'Cambio de filtro de combustible secundario de alta eficiencia (2 micras)',
      'Toma de muestra de aceite para análisis programado SOS (Wear metals, Viscosity, Soot)',
      'Drenaje de agua y sedimentos del tanque diario de combustible',
      'Inspección visual de fugas en tuberías de aceite, combustible y refrigerante',
      'Verificación y ajuste de tensión en correas de transmisión y alternador',
      'Inspección de nivel y concentración de refrigerante de motor'
    ],
    recommendedParts: [
      '1R-1808 (Filtro de Aceite de Motor Primario)',
      '1R-0770 (Filtro Separador de Agua Combustible)',
      '1R-0749 (Filtro de Combustible Secundario 2µm)',
      'Aceite CAT DEO-ULS 15W-40 (Galones según capacidad de cárter)'
    ],
    fluidSamples: ['Aceite de Motor SOS (Kit 169-8373)']
  },
  PM2: {
    level: 'PM2',
    hoursInterval: 500,
    title: 'Mantenimiento Preventivo PM2 (500 Horas)',
    description: 'Servicio intermedio de lubricación completa, revisión de admisión de aire, sistema eléctrico y refrigeración.',
    itemsToCheck: [
      'Todo lo incluido en el servicio PM1 (Aceite + Filtros de Aceite y Combustible + Muestras SOS)',
      'Inspección, limpieza o sustitución del filtro de aire primario Radial Seal',
      'Limpieza y revisión del respiradero del cárter de motor (Crankcase Breather)',
      'Prueba química de inhibidor de corrosión en refrigerante (Tiras de prueba SCA / ELC)',
      'Inspección de bornes de batería, nivel de electrolito y medición de voltaje en flotación',
      'Inspección de abrazaderas y ductos del posenfriador de aire (ATAAC)',
      'Comprobación del estado del turbocargador por posible presencia de hollín o aceite',
      'Limpieza del panel de control EMCP / sensor de velocidad magnético'
    ],
    recommendedParts: [
      '1R-1808 (Filtro de Aceite)',
      '1R-0770 (Filtro Separador de Agua)',
      '1R-0749 (Filtro de Combustible Secundario)',
      '142-1339 (Elemento Primario de Filtro de Aire)',
      'Acondicionador de Refrigerante Líquido SCA CAT'
    ],
    fluidSamples: ['Aceite de Motor SOS', 'Muestra de Refrigerante Nivel 1']
  },
  PM3: {
    level: 'PM3',
    hoursInterval: 1000,
    title: 'Mantenimiento Preventivo PM3 (1,000 Horas)',
    description: 'Servicio mayor de afinación mecánica, calibración de válvulas e inyectores y revisión de radiador.',
    itemsToCheck: [
      'Todo lo incluido en los servicios PM1 y PM2',
      'Reemplazo completo de elementos de filtro de aire primario y secundario de seguridad',
      'Calibración y ajuste de luz de válvulas de admisión y escape según especificación CAT',
      'Ajuste y sincronización de precarga de inyectores unitarios electrónicos (MEUI / EUI)',
      'Lavado y desincrustado externo del panal del radiador y enfriador de combustible',
      'Inspección y medición del amortiguador de vibraciones del cigüeñal (Damper de vibración)',
      'Verificación y reapriete de pernos de sujeción de motor y generador al chasis',
      'Megado de aislamiento eléctrico de devanados con Megóhmetro (Stator / Rotor > 1 MΩ)',
      'Comprobación de ajustes de protecciones y alarmas en módulo EMCP 4.2'
    ],
    recommendedParts: [
      '1R-1808 (Filtro de Aceite)',
      '1R-0770 (Filtro Separador de Agua)',
      '1R-0749 (Filtro de Combustible Secundario)',
      '142-1339 (Filtro de Aire Primario)',
      '142-1340 (Filtro de Aire Secundario de Seguridad)',
      'Kit de Empacaduras de Tapa de Válvulas CAT',
      'O-Rings y Sellos de Inyectores MEUI'
    ],
    fluidSamples: ['Aceite de Motor SOS', 'Refrigerante CAT ELC Nivel 2', 'Aceite de Generador / Cojinetes']
  },
  PM4: {
    level: 'PM4',
    hoursInterval: 2000,
    title: 'Mantenimiento Preventivo PM4 (2,000 Horas / 1 Año)',
    description: 'Servicio preventivo mayor de ciclo anual. Reemplazo de termostatos, bomba de agua e inspección turbo.',
    itemsToCheck: [
      'Todo lo incluido en los servicios PM1, PM2 y PM3',
      'Reemplazo preventivo de los termostatos / reguladores de temperatura de agua (82°C / 180°F)',
      'Reemplazo de sellos de labio y empaques de la carcasa de termostatos',
      'Inspección de juego axial y radial en eje del turbocargador con reloj comparador',
      'Inspección del sello y rodamiento de la bomba de agua de refrigeración',
      'Drenaje, enjuague y recarga de refrigerante de larga duración CAT ELC (50/50 Premix)',
      'Limpieza y prueba de sensores de sincronización de motor (Speed/Timing Sensors)',
      'Prueba de banco de carga resistivo (Load Bank Test al 25%, 50%, 75% y 100% de potencia)',
      'Prueba de disparo de protecciones de sobrevelocidad, baja presión y alta temperatura'
    ],
    recommendedParts: [
      'Kit Completo de Filtración PM3 (Aceite, Combustible 1°/2°, Aire 1°/2°)',
      '248-5513 (Termostatos de Refrigeración 82°C)',
      'Sellos y Empacaduras de Termostato CAT',
      'Refrigerante CAT ELC (Extended Life Coolant) Premixed 50/50',
      'Sensor de Presión de Aceite 194-6725 (Inspección / Repuesto)'
    ],
    fluidSamples: ['Aceite de Motor SOS', 'Refrigerante ELC Completo', 'Análisis de Combustible Diésel']
  },
  PM5: {
    level: 'PM5',
    hoursInterval: 4000,
    title: 'Mantenimiento Preventivo PM5 (4,000 - 6,000 Horas)',
    description: 'Mantenimiento semi-mayor. Reacondicionamiento de componentes periféricos y accesorios.',
    itemsToCheck: [
      'Todo lo incluido en el servicio preventivo PM4',
      'Reemplazo o reacondicionamiento preventivo de turbocompresor(es)',
      'Reemplazo de bomba de agua de motor y mangueras de silicona de alta temperatura',
      'Reemplazo preventivo de inyectores MEUI / comprobación en banco de pruebas CAT',
      'Reemplazo de amortiguador de vibraciones viscoso (Damper) si presenta fugas o deformación',
      'Inspección de juego entre dientes del tren de engranajes de distribución frontal',
      'Prueba de compresor de aire y alternador de carga de 24V'
    ],
    recommendedParts: [
      'Kit Completo de Filtros y Fluidos CAT',
      'Turbocargador Remanufacturado CAT / Cartucho CHRA',
      'Bomba de Agua Reman CAT',
      'Juego de Inyectores MEUI 10R-1000',
      'Juego de Correas Poly-V y Tensores Automáticos'
    ],
    fluidSamples: ['Aceite de Motor SOS', 'Refrigerante ELC', 'Grasa de Cojinetes de Generador']
  },
  OVERHAUL: {
    level: 'OVERHAUL',
    hoursInterval: 10000,
    title: 'Overhaul Mayor y Reacondicionamiento General (10,000+ Horas)',
    description: 'Reconstrucción completa de bloque de motor, tren de potencia y sistemas auxiliares a estándar cero horas.',
    itemsToCheck: [
      'Desarme total de motor, limpieza química de bloque y verificación de grietas / alineación',
      'Instalación de kit de overhaul mayor: camisas de cilindro, pistones, anillos y pasadores',
      'Reemplazo de cojinetes de biela y cojinetes de bancada principales estándar',
      'Reacondicionamiento de culatas de cilindro: guías, asientos, válvulas y resortes',
      'Rectificación o reemplazo de árbol de levas y bujes',
      'Reconstrucción total de bomba de aceite, bomba de agua y enfriador de aceite de motor',
      'Reemplazo de conjunto de turbocargadores e inyectores nuevos/reman certificados',
      'Prueba y certificación en dinamómetro bajo curva de potencia completa'
    ],
    recommendedParts: [
      'Kit de Reconstrucción de Motor CAT Major Overhaul Kit (In-Frame / Out-of-Frame)',
      'Juego de Camisas, Pistones y Anillos CAT Originales',
      'Juego de Cojinetes de Bancada y Biela CAT',
      'Kit Completo de Juntas y Sellos de Motor Superior e Inferior',
      'Conjunto de Inyectores y Turbocargadores Remanufacturados CAT'
    ],
    fluidSamples: ['Muestras de todos los compartimientos', 'Fluidos nuevos al 100%']
  },
  CORRECTIVO: {
    level: 'CORRECTIVO',
    hoursInterval: 0,
    title: 'Mantenimiento Correctivo / Reparación de Falla',
    description: 'Atención técnica ante anomalía imprevista, código de falla activo o paro de emergencia.',
    itemsToCheck: [
      'Conexión de herramienta electrónica de diagnóstico CAT ET (Electronic Technician)',
      'Descarga y análisis de informe de estado del producto (PSR - Product Status Report)',
      'Diagnóstico de códigos de diagnóstico activos y registrados (DTCs)',
      'Pruebas de presión hidráulica, combustible y compresión si aplica',
      'Reemplazo del componente o sensor dañado y pruebas de operatividad'
    ],
    recommendedParts: ['Según diagnóstico de falla y códigos activos en CAT ET'],
    fluidSamples: ['Muestra SOS del compartimiento afectado']
  },
  INSPECCION_TA1: {
    level: 'INSPECCION_TA1',
    hoursInterval: 250,
    title: 'Inspección Técnica de Inspección Visual TA1 CAT',
    description: 'Inspección visual estandarizada de caminata alrededor (Walk-Around Inspection) y seguridad.',
    itemsToCheck: [
      'Inspección de 50+ puntos visuales de seguridad, fugas, estructura y pernos flojos',
      'Inspección de mangueras, cableados eléctricos y protectores térmicos',
      'Verificación de niveles de fluidos y estado de indicadores de restricción'
    ],
    recommendedParts: ['Materiales menores de ajuste y limpieza'],
    fluidSamples: ['Opcional SOS']
  },
  INSPECCION_TA2: {
    level: 'INSPECCION_TA2',
    hoursInterval: 1000,
    title: 'Inspección Técnica Diagnóstica Avanzada TA2 CAT',
    description: 'Inspección técnica avanzada con instrumentación de precisión, presiones y CAT ET.',
    itemsToCheck: [
      'Prueba de corte de cilindros (Cylinder Cutout Test) con CAT ET',
      'Medición de presión de combustible a plena carga y en vacío',
      'Medición de presión de aceite de motor y soplado del cárter (Blow-by)',
      'Medición de contrapresión de escape y temperatura por puerto con pirómetro'
    ],
    recommendedParts: ['Insumos de instrumentación y diagnóstico'],
    fluidSamples: ['Aceite SOS', 'Refrigerante']
  },
  MUESTRAS_SOS: {
    level: 'MUESTRAS_SOS',
    hoursInterval: 250,
    title: 'Toma y Monitoreo de Muestras de Fluidos SOS',
    description: 'Programa de análisis preventivo de desgaste de fluidos y tendencias de metales.',
    itemsToCheck: [
      'Toma de muestra en caliente con sonda y válvula SOS instalada',
      'Etiquetado con horómetro exacto, modelo, serial y horas del aceite',
      'Envío a laboratorio certificado de fluidos Venequip / CAT SOS'
    ],
    recommendedParts: ['Kits de Botellas y Sondas de Muestra SOS 169-8373'],
    fluidSamples: ['Aceite Motor', 'Aceite Hidráulico', 'Refrigerante']
  }
};

/**
 * Detects the maintenance level from an activity description or report text
 */
export function detectMaintenanceLevelFromText(text: string): MaintenanceLevel {
  if (!text) return 'CORRECTIVO';
  const upper = text.toUpperCase();

  if (upper.includes('OVERHAUL') || upper.includes('RECONSTRUCCION') || upper.includes('REACONDICIONAMIENTO MAYOR')) {
    return 'OVERHAUL';
  }
  if (upper.includes('4000') || upper.includes('4.000') || upper.includes('6000') || upper.includes('PM5') || upper.includes('PM 5')) {
    return 'PM5';
  }
  if (upper.includes('2000') || upper.includes('2.000') || upper.includes('PM4') || upper.includes('PM 4') || upper.includes('ANUAL')) {
    return 'PM4';
  }
  if (upper.includes('1000') || upper.includes('1.000') || upper.includes('PM3') || upper.includes('PM 3')) {
    return 'PM3';
  }
  if (upper.includes('500') || upper.includes('PM2') || upper.includes('PM 2')) {
    return 'PM2';
  }
  if (upper.includes('250') || upper.includes('PM1') || upper.includes('PM 1') || upper.includes('MANTENIMIENTO PREVENTIVO') || upper.includes('CAMBIO DE ACEITE')) {
    return 'PM1';
  }
  if (upper.includes('TA2') || upper.includes('TA 2')) {
    return 'INSPECCION_TA2';
  }
  if (upper.includes('TA1') || upper.includes('TA 1') || upper.includes('INSPECCION')) {
    return 'INSPECCION_TA1';
  }
  if (upper.includes('SOS') || upper.includes('MUESTRA')) {
    return 'MUESTRAS_SOS';
  }
  return 'CORRECTIVO';
}

/**
 * Calculates the next preventive maintenance based on the current machine horometer
 * and the standard Caterpillar 250h / 500h / 1000h / 2000h / 4000h / 10000h cyclic scale.
 */
export function calculateNextCATMaintenance(
  currentHours: number,
  lastMaintenanceLevel?: MaintenanceLevel
): {
  level: MaintenanceLevel;
  targetHorometro: number;
  hoursRemaining: number;
  urgency: 'al_dia' | 'proximo' | 'vencido';
  recommendedKit: string[];
  fluidSamples: string[];
  suggestedDateProjection?: string;
  description: string;
} {
  const safeHours = Math.max(0, currentHours || 0);

  // Next standard 250h step
  const interval = 250;
  const next250Step = Math.ceil((safeHours + 1) / interval) * interval;
  const targetHorometro = next250Step === safeHours ? next250Step + interval : next250Step;
  const hoursRemaining = targetHorometro - safeHours;

  // Determine which PM level corresponds to this target horometer:
  // - Every 10,000 hrs -> OVERHAUL
  // - Every 4,000 hrs -> PM5
  // - Every 2,000 hrs -> PM4
  // - Every 1,000 hrs -> PM3
  // - Every 500 hrs -> PM2
  // - Every 250 hrs -> PM1
  let nextLevel: MaintenanceLevel = 'PM1';
  if (targetHorometro > 0 && targetHorometro % 10000 === 0) {
    nextLevel = 'OVERHAUL';
  } else if (targetHorometro > 0 && targetHorometro % 4000 === 0) {
    nextLevel = 'PM5';
  } else if (targetHorometro > 0 && targetHorometro % 2000 === 0) {
    nextLevel = 'PM4';
  } else if (targetHorometro > 0 && targetHorometro % 1000 === 0) {
    nextLevel = 'PM3';
  } else if (targetHorometro > 0 && targetHorometro % 500 === 0) {
    nextLevel = 'PM2';
  } else {
    nextLevel = 'PM1';
  }

  // Determine urgency
  let urgency: 'al_dia' | 'proximo' | 'vencido' = 'al_dia';
  if (hoursRemaining <= 0) {
    urgency = 'vencido';
  } else if (hoursRemaining <= 50) {
    urgency = 'proximo';
  } else {
    urgency = 'al_dia';
  }

  // Approximate date projection assuming average 8 hours/day operation
  const daysRemaining = Math.max(1, Math.round(hoursRemaining / 8));
  const projDate = new Date();
  projDate.setDate(projDate.getDate() + daysRemaining);
  const suggestedDateProjection = projDate.toLocaleDateString('es-VE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const config = CAT_MAINTENANCE_CONFIGS[nextLevel] || CAT_MAINTENANCE_CONFIGS.PM1;

  return {
    level: nextLevel,
    targetHorometro,
    hoursRemaining,
    urgency,
    recommendedKit: config.recommendedParts,
    fluidSamples: config.fluidSamples,
    suggestedDateProjection,
    description: config.description
  };
}

/**
 * Extracts and consolidates all equipment fleet records from a collection of technical reports.
 * Groups by equipment serial / model, computes the latest horometer, maintenance history,
 * and next recommended maintenance.
 */
export function buildFleetFromReports(reports: InformeTecnico[]): EquipmentFleetRecord[] {
  if (!reports || reports.length === 0) return [];

  const equipmentMap = new Map<string, EquipmentFleetRecord>();

  // Sort reports chronologically
  const sortedReports = [...reports].sort((a, b) => {
    const dateA = new Date(a.encabezado_venequip?.fecha || 0).getTime();
    const dateB = new Date(b.encabezado_venequip?.fecha || 0).getTime();
    return dateA - dateB;
  });

  for (const rep of sortedReports) {
    const enc = rep.encabezado_venequip || ({} as any);
    const sec = rep.secciones_informe || ({} as any);
    const firmas = rep.bloque_firmas || ({} as any);

    const rawSerial = (enc.serial_equipo || '').trim().toUpperCase();
    const rawModel = (enc.modelo || 'Caterpillar').trim().toUpperCase();
    const rawCliente = (enc.cliente || 'Cliente General').trim();
    
    // Generate a unique machine key
    const cleanSerial = rawSerial ? rawSerial.replace(/[^A-Z0-9_-]/g, '') : 'SIN_SERIAL';
    const cleanModel = rawModel.replace(/[^A-Z0-9_-]/g, '');
    const equipmentKey = `${cleanModel}_${cleanSerial}`;

    const horometroNum = parseFloat(String(enc.horas_motor || '0').replace(/[^0-9.]/g, '')) || 0;
    const actividadText = `${enc.actividad || ''} ${sec['3_actividades_efectuadas'] || ''} ${sec['1_solicitud_cliente'] || ''}`;
    const detectedType = detectMaintenanceLevelFromText(actividadText);

    const historyItem = {
      fecha: enc.fecha || new Date().toISOString().split('T')[0],
      numeroServicio: enc.numero_servicio || 'S/N',
      horometro: horometroNum,
      tipoServicio: detectedType,
      actividad: enc.actividad || sec['3_actividades_efectuadas'] || 'Servicio Técnico',
      tecnico: firmas.elaborado_por?.nombre || 'Técnico Especialista',
      reportId: enc.numero_servicio
    };

    if (!equipmentMap.has(equipmentKey)) {
      const nextMaint = calculateNextCATMaintenance(horometroNum, detectedType);
      equipmentMap.set(equipmentKey, {
        equipmentKey,
        cliente: rawCliente,
        modelo: enc.modelo || 'Caterpillar',
        serial_equipo: enc.serial_equipo || 'N/A',
        serial_motor: enc.serial_motor || '',
        fabricante: enc.fabricante || 'Caterpillar Inc.',
        sucursal: enc.sucursal || 'Los Ruices',
        localizacion: enc.localizacion || '',
        lastHorometro: horometroNum,
        lastHorometroDate: enc.fecha || new Date().toISOString(),
        lastMaintenanceType: detectedType,
        lastServiceNumber: enc.numero_servicio || '',
        totalReportsCount: 1,
        nextRecommendedMaintenance: nextMaint,
        maintenanceHistory: [historyItem],
        updatedAt: new Date().toISOString()
      });
    } else {
      const existing = equipmentMap.get(equipmentKey)!;
      existing.totalReportsCount += 1;
      existing.maintenanceHistory.push(historyItem);

      // If this report has a higher or more recent horometer, update it
      if (horometroNum >= existing.lastHorometro) {
        existing.lastHorometro = horometroNum;
        existing.lastHorometroDate = enc.fecha || existing.lastHorometroDate;
        existing.lastMaintenanceType = detectedType;
        existing.lastServiceNumber = enc.numero_servicio || existing.lastServiceNumber;
        existing.sucursal = enc.sucursal || existing.sucursal;
        existing.localizacion = enc.localizacion || existing.localizacion;
        existing.cliente = rawCliente || existing.cliente;
        existing.serial_motor = enc.serial_motor || existing.serial_motor;
        existing.nextRecommendedMaintenance = calculateNextCATMaintenance(horometroNum, detectedType);
      }
      existing.updatedAt = new Date().toISOString();
    }
  }

  return Array.from(equipmentMap.values());
}

export interface EncabezadoVenequip {
  empresa: string;
  rif: string;
  sucursal: string;
  fecha: string;
  numero_servicio: string;
  actividad: string;
  cliente: string;
  localizacion: string;
  fabricante: string;
  modelo: string;
  serial_equipo: string;
  serial_motor: string;
  horas_motor: string;
  horas_panel: string;
}

export interface Herramienta {
  nombre: string;
  numero_parte: string;
  cantidad: number;
}

export interface RegistroFotografico {
  imagen_id: string;
  descripcion: string;
  url_o_base64: string;
  imagenes?: string[]; // Multiple images in a single photographic block
}

export interface PersonaFirma {
  nombre: string;
  cargo: string;
  firma_image: string; // base64 string or URL
}

export interface BloqueFirmas {
  elaborado_por: PersonaFirma;
  revisado_por: PersonaFirma;
  aprobado_por: PersonaFirma;
}

export interface SeccionesInforme {
  "1_solicitud_cliente": string;
  "2_condiciones_fallas": string;
  "3_actividades_efectuadas": string;
  herramientas_utilizadas: Herramienta[];
  "4_fallas_detectadas": string;
  "5_causas_fallas": string;
  "6_conclusiones_recomendaciones": string;
  "7_registro_fotografico": RegistroFotografico[];
}

export interface InformeTecnico {
  id?: string;
  encabezado_venequip: EncabezadoVenequip;
  secciones_informe: SeccionesInforme;
  bloque_firmas: BloqueFirmas;
  updatedAt?: string;
}

export interface OnlineUserPresence {
  sessionId: string;
  uid?: string;
  email: string;
  name: string;
  role: 'admin' | 'technician' | 'supervisor' | 'manager' | 'guest';
  lastSeen: string; // ISO date
  ip?: string;
  currentView?: string;
  currentReportId?: string;
  device?: string;
  isOnline: boolean;
  avatarColor?: string;
}

export type MaintenanceLevel = 
  | 'PM1' 
  | 'PM2' 
  | 'PM3' 
  | 'PM4' 
  | 'PM5' 
  | 'OVERHAUL' 
  | 'CORRECTIVO' 
  | 'INSPECCION_TA1' 
  | 'INSPECCION_TA2' 
  | 'MUESTRAS_SOS';

export interface MaintenanceIntervalConfig {
  level: MaintenanceLevel;
  hoursInterval: number; // e.g., 250, 500, 1000, 2000, 3000, 4000, 6000, 10000
  title: string;
  description: string;
  itemsToCheck: string[];
  recommendedParts: string[];
  fluidSamples: string[]; // Aceite Motor SOS, Hidráulico, Transmisión, Refrigerante
}

export interface EquipmentFleetRecord {
  equipmentKey: string; // e.g. "C15_CAT00C15J9K01234"
  cliente: string;
  modelo: string;
  serial_equipo: string;
  serial_motor?: string;
  fabricante: string;
  sucursal: string;
  localizacion?: string;
  lastHorometro: number;
  lastHorometroDate: string;
  lastMaintenanceType: MaintenanceLevel;
  lastServiceNumber: string;
  totalReportsCount: number;
  nextRecommendedMaintenance: {
    level: MaintenanceLevel;
    targetHorometro: number;
    hoursRemaining: number;
    urgency: 'al_dia' | 'proximo' | 'vencido';
    recommendedKit: string[];
    fluidSamples: string[];
    suggestedDateProjection?: string;
    description: string;
  };
  maintenanceHistory: Array<{
    fecha: string;
    numeroServicio: string;
    horometro: number;
    tipoServicio: MaintenanceLevel;
    actividad: string;
    tecnico: string;
    reportId?: string;
  }>;
  updatedAt: string;
}

export interface AppDynamicState {
  key: string;
  value: any;
  updatedAt: string;
  updatedBy?: string;
}

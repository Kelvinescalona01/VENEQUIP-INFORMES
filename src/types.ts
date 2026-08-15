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

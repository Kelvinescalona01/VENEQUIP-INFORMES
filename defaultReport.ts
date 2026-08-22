import { InformeTecnico } from './types';
import { getDefaultSignatureDataUrl } from './logoUtils';
import { getSampleInspectionPhoto1, getSampleInspectionPhoto2 } from './sampleImages';

export const DEFAULT_REPORT: InformeTecnico = {
  id: 'RPT-VENEQUIP-NUEVO',
  updatedAt: new Date().toISOString(),
  encabezado_venequip: {
    empresa: 'CONSORCIO DE COGESTIÓN VENEQUIP',
    rif: 'J404644865',
    sucursal: 'LOS RUICES',
    fecha: new Date().toLocaleDateString('es-VE'),
    numero_servicio: '',
    actividad: '',
    cliente: '',
    localizacion: '',
    fabricante: '',
    modelo: '',
    serial_equipo: '',
    serial_motor: '',
    horas_motor: '',
    horas_panel: ''
  },
  secciones_informe: {
    "1_solicitud_cliente": '',
    "2_condiciones_fallas": '',
    "3_actividades_efectuadas": '',
    herramientas_utilizadas: [],
    "4_fallas_detectadas": '',
    "5_causas_fallas": '',
    "6_conclusiones_recomendaciones": '',
    "7_registro_fotografico": []
  },
  bloque_firmas: {
    elaborado_por: {
      nombre: '',
      cargo: '',
      firma_image: ''
    },
    revisado_por: {
      nombre: '',
      cargo: '',
      firma_image: ''
    },
    aprobado_por: {
      nombre: '',
      cargo: 'COORDINADOR DE SERVICIO',
      firma_image: ''
    }
  }
};

export const SAMPLE_REPORT: InformeTecnico = {
  id: 'RPT-S6318-2026',
  updatedAt: new Date().toISOString(),
  encabezado_venequip: {
    empresa: 'CONSORCIO DE COGESTIÓN VENEQUIP',
    rif: 'J404644865',
    sucursal: 'LOS RUICES',
    fecha: '04/08/2026',
    numero_servicio: 'S6318',
    actividad: 'INSPECCION POR PRESENCIA DE FUGAS EN EL EQUIPO',
    cliente: 'MEGALABS',
    localizacion: 'MACARAO, LAS ADJUNTAS',
    fabricante: 'CATERPILLAR',
    modelo: '350',
    serial_equipo: 'TC2Y1775',
    serial_motor: '1DZ2729',
    horas_motor: '2543.9hrs',
    horas_panel: '(Si aplica)'
  },
  secciones_informe: {
    "1_solicitud_cliente": "Realizar inspección técnica especializada por presencia de fugas de fluidos en el equipo.",
    "2_condiciones_fallas": "El equipo fue inspeccionado en sitio. Se detectó presencia de trazas de lubricante y refrigerante en la zona inferior del motor y conexiones de mangueras hidráulicas.",
    "3_actividades_efectuadas": "• Limpieza y desengrasado general del bloque de motor y líneas de presión.\n• Verificación de torques en abrazaderas y acoples de tubería.\n• Pruebas de hermeticidad y arranque a temperatura de operación.\n• Corrección de ajuste en sello de tapa de válvulas y sustitución de abrazaderas desgastadas.",
    herramientas_utilizadas: [
      { nombre: 'Torquímetro de Click 1/2"', numero_parte: 'TQ-500', cantidad: 1 },
      { nombre: 'Juego de Llaves Combinadas', numero_parte: 'JC-1032', cantidad: 1 },
      { nombre: 'Limpiador de Contactos y Desengrasante', numero_parte: 'CL-800', cantidad: 2 }
    ],
    "4_fallas_detectadas": "Perdida menor de fluido por aflojamiento térmico de abrazaderas en el sistema de enfriamiento y sello de empaque.",
    "5_causas_fallas": "Vibración acumulada por horas de servicio y ciclo térmico continuo de trabajo.",
    "6_conclusiones_recomendaciones": "Conclusión: Fugas eliminadas satisfactoriamente. El equipo Caterpillar 350 se encuentra en condición operativa segura.\n\nRecomendaciones:\n• Realizar inspección visual diaria de niveles de fluido antes del arranque.\n• Programar mantenimiento preventivo a las 250 horas de operación.",
    "7_registro_fotografico": [
      {
        imagen_id: "Imagen 1",
        descripcion: "Inspección inicial de zona de fugas en bloque y mangueras.",
        url_o_base64: getSampleInspectionPhoto1()
      },
      {
        imagen_id: "Imagen 2",
        descripcion: "Prueba de hermeticidad y ajuste de componentes electromecánicos.",
        url_o_base64: getSampleInspectionPhoto2()
      }
    ]
  },
  bloque_firmas: {
    elaborado_por: {
      nombre: 'KELVIN ESCALONA',
      cargo: 'TÉCNICO ELECTRICISTA',
      firma_image: getDefaultSignatureDataUrl('KELVIN ESCALONA')
    },
    revisado_por: {
      nombre: 'MAURICIO LINARES',
      cargo: 'INGENIERO DE SERVICIO',
      firma_image: getDefaultSignatureDataUrl('MAURICIO LINARES')
    },
    aprobado_por: {
      nombre: 'SIMON SANCHEZ',
      cargo: 'COORDINADOR DE SERVICIO',
      firma_image: getDefaultSignatureDataUrl('SIMON SANCHEZ')
    }
  }
};



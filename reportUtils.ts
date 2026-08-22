import { InformeTecnico } from './types';
import { DEFAULT_REPORT } from './defaultReport';

/**
 * Ensures any loaded or updated report object has all required properties
 * populated with safe fallbacks, preventing runtime errors like
 * "Cannot read properties of undefined (reading 'numero_servicio')"
 */
export function normalizeReport(data: any): InformeTecnico {
  if (!data || typeof data !== 'object') {
    return DEFAULT_REPORT;
  }

  const enc = data.encabezado_venequip || {};
  const sec = data.secciones_informe || {};
  const fir = data.bloque_firmas || {};

  return {
    id: data.id || DEFAULT_REPORT.id,
    updatedAt: data.updatedAt || new Date().toISOString(),
    encabezado_venequip: {
      empresa: enc.empresa || DEFAULT_REPORT.encabezado_venequip.empresa,
      rif: enc.rif || DEFAULT_REPORT.encabezado_venequip.rif,
      sucursal: enc.sucursal || DEFAULT_REPORT.encabezado_venequip.sucursal,
      fecha: enc.fecha || DEFAULT_REPORT.encabezado_venequip.fecha,
      numero_servicio: enc.numero_servicio || '',
      actividad: enc.actividad || '',
      cliente: enc.cliente || '',
      localizacion: enc.localizacion || '',
      fabricante: enc.fabricante || '',
      modelo: enc.modelo || '',
      serial_equipo: enc.serial_equipo || '',
      serial_motor: enc.serial_motor || '',
      horas_motor: enc.horas_motor || '',
      horas_panel: enc.horas_panel || ''
    },
    secciones_informe: {
      "1_solicitud_cliente": sec["1_solicitud_cliente"] || '',
      "2_condiciones_fallas": sec["2_condiciones_fallas"] || '',
      "3_actividades_efectuadas": sec["3_actividades_efectuadas"] || '',
      herramientas_utilizadas: Array.isArray(sec.herramientas_utilizadas)
        ? sec.herramientas_utilizadas.map((t: any) => ({
            nombre: t?.nombre || '',
            numero_parte: t?.numero_parte || '',
            cantidad: typeof t?.cantidad === 'number' ? t.cantidad : 1
          }))
        : [],
      "4_fallas_detectadas": sec["4_fallas_detectadas"] || '',
      "5_causas_fallas": sec["5_causas_fallas"] || '',
      "6_conclusiones_recomendaciones": sec["6_conclusiones_recomendaciones"] || '',
      "7_registro_fotografico": Array.isArray(sec["7_registro_fotografico"])
        ? sec["7_registro_fotografico"].map((p: any, i: number) => {
            const primaryUrl = p?.url_o_base64 || '';
            const imgs = Array.isArray(p?.imagenes) && p.imagenes.length > 0 
              ? p.imagenes.filter((im: any) => typeof im === 'string' && im.trim().length > 0)
              : (primaryUrl ? [primaryUrl] : []);

            return {
              imagen_id: p?.imagen_id || `Imagen ${i + 1}`,
              descripcion: p?.descripcion || '',
              url_o_base64: imgs[0] || primaryUrl,
              imagenes: imgs
            };
          })
        : []
    },
    bloque_firmas: {
      elaborado_por: {
        nombre: fir.elaborado_por?.nombre || '',
        cargo: fir.elaborado_por?.cargo || '',
        firma_image: fir.elaborado_por?.firma_image || ''
      },
      revisado_por: {
        nombre: fir.revisado_por?.nombre || '',
        cargo: fir.revisado_por?.cargo || '',
        firma_image: fir.revisado_por?.firma_image || ''
      },
      aprobado_por: {
        nombre: fir.aprobado_por?.nombre || '',
        cargo: fir.aprobado_por?.cargo || '',
        firma_image: fir.aprobado_por?.firma_image || ''
      }
    }
  };
}

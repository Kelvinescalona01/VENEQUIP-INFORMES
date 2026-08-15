import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { InformeTecnico } from './types';
import { getVenequipLogoDataUrl, getDefaultSignatureDataUrl } from './logoUtils';
import { normalizeReport } from './reportUtils';
import { convertUrlToBase64DataUrl } from './imageUtils';
import { exportToDocx } from './docxExporter';
import { generateExcelReportBuffer } from './googleWorkspace';

/**
 * Ensures an image source is converted to a high-quality Base64 Data URL.
 */
async function ensureBase64Image(url: string, title?: string): Promise<string> {
  if (!url) return '';
  return await convertUrlToBase64DataUrl(url, title);
}

/**
 * Preloads all images inside an HTML element to ensure html2canvas captures signatures and photos.
 */
const preloadElementImages = async (element: HTMLElement): Promise<void> => {
  const images = Array.from(element.querySelectorAll('img'));
  const promises = images.map((img) => {
    if (img.complete && img.naturalWidth !== 0) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      const timeout = setTimeout(() => resolve(), 3000);
      img.onload = () => {
        clearTimeout(timeout);
        resolve();
      };
      img.onerror = () => {
        clearTimeout(timeout);
        resolve();
      };
    });
  });
  await Promise.all(promises);
};

/**
 * 1. Export as High-Resolution A4 PDF Document
 */
export const exportToPDF = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('No se encontró el elemento del documento oficial para exportar a PDF.');
  }

  // Preload signatures & images
  await preloadElementImages(element);
  await new Promise((resolve) => setTimeout(resolve, 200));

  const canvas = await html2canvas(element, {
    scale: 2, // High DPI resolution
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: '#ffffff',
    imageTimeout: 15000,
    windowWidth: element.scrollWidth || 850
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.98);

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = canvas.width;
  const imgHeight = canvas.height;

  // Scale ratio based on A4 width
  const imgScaledWidth = pdfWidth;
  const imgScaledHeight = (imgHeight * pdfWidth) / imgWidth;

  let heightLeft = imgScaledHeight;
  let position = 0;

  // First page
  pdf.addImage(imgData, 'JPEG', 0, position, imgScaledWidth, imgScaledHeight);
  heightLeft -= pdfHeight;

  // Additional pages if document length exceeds A4 height
  while (heightLeft > 2) {
    position -= pdfHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, position, imgScaledWidth, imgScaledHeight);
    heightLeft -= pdfHeight;
  }

  pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
};
/**
 * 2. Export as Genuine Microsoft Word (.docx) Document
 * Embeds all images, logos, and digital signatures directly into the OpenXML binary media container
 * so Microsoft Word, Google Docs, and LibreOffice render them natively with 100% fidelity
 * without any "No se puede mostrar la imagen vinculada" security blocking errors.
 */
export const exportToWord = async (rawReport: InformeTecnico, filename: string): Promise<void> => {
  await exportToDocx(rawReport, filename);
};

/**
 * 3. Export as Structured JSON (.json)
 */
export const exportToJSON = (report: InformeTecnico, filename: string) => {
  const jsonStr = JSON.stringify(report, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.json') ? filename : `${filename}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * 4. Export as Standalone Web Document (.html) with 100% Embedded Base64 Images
 */
export const exportToHTML = async (rawReport: InformeTecnico, filename: string) => {
  const report = normalizeReport(rawReport);
  const enc = report.encabezado_venequip;
  const sec = report.secciones_informe;
  const fir = report.bloque_firmas;

  const logoDataUrl = getVenequipLogoDataUrl();
  const sigElaborado = (fir.elaborado_por?.firma_image || (fir.elaborado_por?.nombre ? getDefaultSignatureDataUrl(fir.elaborado_por.nombre) : ''));
  const sigRevisado = (fir.revisado_por?.firma_image || (fir.revisado_por?.nombre ? getDefaultSignatureDataUrl(fir.revisado_por.nombre) : ''));
  const sigAprobado = (fir.aprobado_por?.firma_image || (fir.aprobado_por?.nombre ? getDefaultSignatureDataUrl(fir.aprobado_por.nombre) : ''));

  const photosBase64 = await Promise.all(
    (sec["7_registro_fotografico"] || []).map(async (p) => {
      const rawImgs = p.imagenes && p.imagenes.length > 0 
        ? p.imagenes.filter(img => Boolean(img && img.trim()))
        : (p.url_o_base64 && p.url_o_base64.trim() ? [p.url_o_base64] : []);
      
      const convertedImgs = await Promise.all(
        rawImgs.map(img => ensureBase64Image(img, p.descripcion || p.imagen_id))
      );

      return {
        ...p,
        allImages: convertedImgs.filter(Boolean)
      };
    })
  );

  const fullHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Informe de Servicio Venequip #${enc.numero_servicio || '6305'}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #f3f4f6; margin: 0; padding: 20px; color: #000; }
    .page { background: #fff; max-width: 850px; margin: 0 auto; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 1px solid #ccc; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    td, th { border: 1px solid #000; padding: 6px 8px; text-align: left; vertical-align: middle; font-size: 12px; }
    .sec-header { font-size: 13px; font-weight: 800; text-transform: uppercase; background-color: #F3F4F6; padding: 8px; }
    .sub-header { text-align: center; font-weight: 800; font-size: 11px; background-color: #F9FAFB; padding: 4px; }
    .signature-box { border: 1px solid #000; padding: 8px; text-align: center; min-height: 140px; display: flex; flex-direction: column; justify-content: space-between; }
    @media print { body { background: #fff; padding: 0; } .page { box-shadow: none; border: none; padding: 0; } }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header Table -->
    <table>
      <tr>
        <td style="width: 38%; text-align: center; padding: 8px;">
          ${logoDataUrl ? `<img src="${logoDataUrl}" style="max-width: 200px; height: auto;" alt="Venequip" />` : '<b>VENEQUIP</b>'}
        </td>
        <td style="width: 62%; text-align: center; font-size: 20px; font-weight: 900; background: #fff; letter-spacing: 1px;">
          INFORME DE SERVICIO
        </td>
      </tr>
    </table>

    <!-- Meta Fields -->
    <table>
      <tr>
        <td style="width: 50%;"><b>Sucursal:</b> ${(enc.sucursal || 'LOS RUICES').toUpperCase()}</td>
        <td style="width: 50%;"><b>Fecha:</b> ${enc.fecha || ''}</td>
      </tr>
      <tr>
        <td><b>Actividad:</b> ${(enc.actividad || '').toUpperCase()}</td>
        <td><b>N° Servicio:</b> <b>${enc.numero_servicio || ''}</b></td>
      </tr>
      <tr>
        <td><b>Localización:</b> ${(enc.localizacion || '').toUpperCase()}</td>
        <td><b>Cliente:</b> ${(enc.cliente || '').toUpperCase()}</td>
      </tr>
      <tr>
        <td style="width: 33%;"><b>Modelo:</b> ${(enc.modelo || '').toUpperCase()}</td>
        <td style="width: 33%;"><b>Fabricante:</b> ${(enc.fabricante || '').toUpperCase()}</td>
        <td style="width: 34%;"><b>Serial Equipo:</b> ${enc.serial_equipo || ''}</td>
      </tr>
      <tr>
        <td><b>Serial Motor:</b> ${enc.serial_motor || ''}</td>
        <td><b>Horas Motor:</b> ${enc.horas_motor || ''}</td>
        <td><b>Horas Panel:</b> ${enc.horas_panel || 'N/A'}</td>
      </tr>
    </table>

    <!-- 1. Solicitud -->
    <table>
      <tr><td class="sec-header">1. Solicitud del Cliente</td></tr>
      <tr><td style="padding: 10px;">${(sec["1_solicitud_cliente"] || '').replace(/\n/g, '<br/>')}</td></tr>
    </table>

    <!-- 2. Condiciones -->
    <table>
      <tr><td class="sec-header">2. Condiciones o fallas encontradas</td></tr>
      <tr><td style="padding: 10px;">${(sec["2_condiciones_fallas"] || '').replace(/\n/g, '<br/>')}</td></tr>
    </table>

    <!-- 3. Actividades -->
    <table>
      <tr><td class="sec-header">3. Pruebas y/o actividades efectuadas</td></tr>
      <tr><td style="padding: 10px;">${(sec["3_actividades_efectuadas"] || '').replace(/\n/g, '<br/>')}</td></tr>
      ${sec.herramientas_utilizadas && sec.herramientas_utilizadas.length > 0 ? `
        <tr><td class="sub-header">HERRAMIENTAS UTILIZADAS</td></tr>
        <tr>
          <td style="padding: 0;">
            <table style="margin: 0; border: none;">
              <tr style="background-color: #F3F4F6;">
                <th>Herramienta</th><th>P/N</th><th style="text-align: center;">Cant.</th>
              </tr>
              ${sec.herramientas_utilizadas.map(t => `
                <tr><td>${t.nombre}</td><td>${t.numero_parte}</td><td style="text-align: center;">${t.cantidad}</td></tr>
              `).join('')}
            </table>
          </td>
        </tr>
      ` : ''}
    </table>

    <!-- 4. Fallas -->
    <table>
      <tr><td class="sec-header">4. Falla(s)</td></tr>
      <tr><td style="padding: 10px;">${(sec["4_fallas_detectadas"] || '').replace(/\n/g, '<br/>')}</td></tr>
    </table>

    <!-- 5. Causas -->
    <table>
      <tr><td class="sec-header">5. Causa(s) de la falla(s)</td></tr>
      <tr><td style="padding: 10px;">${(sec["5_causas_fallas"] || '').replace(/\n/g, '<br/>')}</td></tr>
    </table>

    <!-- 6. Conclusiones -->
    <table>
      <tr><td class="sec-header">6. Conclusiones y/o Recomendaciones</td></tr>
      <tr><td style="padding: 10px;">${(sec["6_conclusiones_recomendaciones"] || '').replace(/\n/g, '<br/>')}</td></tr>
    </table>

    <!-- 7. Registro Fotográfico -->
    <table>
      <tr><td class="sec-header">7. Registro fotográfico y Anexos</td></tr>
      <tr>
        <td style="padding: 10px;">
          ${photosBase64.map(p => `
            <div style="margin-bottom: 12px; border: 1px solid #000; padding: 8px; text-align: center; background: #fff;">
              <div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-bottom: 8px;">
                ${p.allImages.map(imgSrc => `
                  <div style="flex: 1 1 240px; max-width: 380px; border: 1px solid #ddd; padding: 4px; background: #fafafa; display: flex; align-items: center; justify-content: center;">
                    <img src="${imgSrc}" style="max-width: 100%; max-height: 220px; object-fit: contain;" alt="${p.imagen_id}"/>
                  </div>
                `).join('')}
              </div>
              <div style="font-weight: bold; font-size: 11px; border-top: 1px solid #000; padding-top: 6px;">${p.imagen_id}: ${p.descripcion}</div>
            </div>
          `).join('')}
        </td>
      </tr>
    </table>

    <!-- Firmas -->
    <table style="margin-top: 16px;">
      <tr>
        <td style="width: 33%; text-align: center; vertical-align: top; padding: 8px;">
          <b>ELABORADO POR:</b><br/>
          <div style="font-weight: 800; font-size: 11px; margin: 4px 0;">${fir.elaborado_por?.nombre || ''}</div>
          <div style="height: 60px; display: flex; align-items: center; justify-content: center;">
            ${sigElaborado ? `<img src="${sigElaborado}" style="max-height: 50px; max-width: 140px;" alt="Firma Elaborado"/>` : ''}
          </div>
          <div style="border-top: 1px solid #000; padding-top: 4px; font-size: 10px;"><b>Cargo:</b> ${fir.elaborado_por?.cargo || ''}</div>
        </td>
        <td style="width: 33%; text-align: center; vertical-align: top; padding: 8px;">
          <b>REVISADO Y CORREGIDO POR:</b><br/>
          <div style="font-weight: 800; font-size: 11px; margin: 4px 0;">${fir.revisado_por?.nombre || ''}</div>
          <div style="height: 60px; display: flex; align-items: center; justify-content: center;">
            ${sigRevisado ? `<img src="${sigRevisado}" style="max-height: 50px; max-width: 140px;" alt="Firma Revisado"/>` : ''}
          </div>
          <div style="border-top: 1px solid #000; padding-top: 4px; font-size: 10px;"><b>Cargo:</b> ${fir.revisado_por?.cargo || ''}</div>
        </td>
        <td style="width: 34%; text-align: center; vertical-align: top; padding: 8px;">
          <b>APROBADO POR:</b><br/>
          <div style="font-weight: 800; font-size: 11px; margin: 4px 0;">${fir.aprobado_por?.nombre || ''}</div>
          <div style="height: 60px; display: flex; align-items: center; justify-content: center;">
            ${sigAprobado ? `<img src="${sigAprobado}" style="max-height: 50px; max-width: 140px;" alt="Firma Aprobado"/>` : ''}
          </div>
          <div style="border-top: 1px solid #000; padding-top: 4px; font-size: 10px;"><b>Cargo:</b> ${fir.aprobado_por?.cargo || ''}</div>
        </td>
      </tr>
    </table>

    <div style="text-align: center; font-size: 10px; color: #666; margin-top: 20px;">
      CONSORCIO DE COGESTIÓN VENEQUIP, S.A. • RIF J404644865 • DOCUMENTO TÉCNICO OFICIAL DE SERVICIO
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.html') ? filename : `${filename}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * 5. Export as Plain Text / Markdown Technical Report (.txt)
 */
export const exportToText = (rawReport: InformeTecnico, filename: string) => {
  const report = normalizeReport(rawReport);
  const enc = report.encabezado_venequip;
  const sec = report.secciones_informe;
  const fir = report.bloque_firmas;

  const textContent = `================================================================================
CONSORCIO DE COGESTIÓN VENEQUIP, S.A. - RIF: J404644865
INFORME TÉCNICO DE SERVICIO EN CAMPO
================================================================================

DATOS DEL ENCABEZADO:
--------------------------------------------------------------------------------
Sucursal: ${enc.sucursal}                     Fecha: ${enc.fecha}
N° de Servicio: ${enc.numero_servicio}               Actividad: ${enc.actividad}
Cliente: ${enc.cliente}                      Ubicación: ${enc.localizacion}
Fabricante: ${enc.fabricante}                 Modelo: ${enc.modelo}
Serial Equipo: ${enc.serial_equipo}           Serial Motor: ${enc.serial_motor}
Horas Motor: ${enc.horas_motor}               Horas Panel: ${enc.horas_panel}

1. SOLICITUD DEL CLIENTE:
--------------------------------------------------------------------------------
${sec["1_solicitud_cliente"]}

2. CONDICIONES O FALLAS ENCONTRADAS:
--------------------------------------------------------------------------------
${sec["2_condiciones_fallas"]}

3. PRUEBAS Y/O ACTIVIDADES EFECTUADAS:
--------------------------------------------------------------------------------
${sec["3_actividades_efectuadas"]}

HERRAMIENTAS NECESARIAS / EMPLEADAS:
${(sec.herramientas_utilizadas || []).map(t => `- ${t.nombre} [P/N: ${t.numero_parte}] (Cantidad: ${t.cantidad})`).join('\n')}

4. FALLA(S):
--------------------------------------------------------------------------------
${sec["4_fallas_detectadas"]}

5. CAUSA(S) DE LA FALLA(S):
--------------------------------------------------------------------------------
${sec["5_causas_fallas"]}

6. CONCLUSIONES Y/O RECOMENDACIONES:
--------------------------------------------------------------------------------
${sec["6_conclusiones_recomendaciones"]}

7. REGISTRO FOTOGRÁFICO Y ANEXOS:
--------------------------------------------------------------------------------
${(sec["7_registro_fotografico"] || []).map(p => `[${p.imagen_id}]: ${p.descripcion}`).join('\n')}

BLOQUE DE FIRMAS:
--------------------------------------------------------------------------------
ELABORADO POR: ${fir.elaborado_por?.nombre} (${fir.elaborado_por?.cargo})
REVISADO POR:  ${fir.revisado_por?.nombre} (${fir.revisado_por?.cargo})
APROBADO POR:  ${fir.aprobado_por?.nombre} (${fir.aprobado_por?.cargo})

================================================================================
CONSORCIO DE COGESTIÓN VENEQUIP, S.A. - TODOS LOS DERECHOS RESERVADOS
================================================================================
`;

  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.txt') ? filename : `${filename}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * 6. Export as Native Microsoft Excel Spreadsheet (.xlsx)
 */
export const exportToExcel = (rawReport: InformeTecnico, filename: string) => {
  const report = normalizeReport(rawReport);
  const buffer = generateExcelReportBuffer(report);
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

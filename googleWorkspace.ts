import * as XLSX from 'xlsx';
import { InformeTecnico } from './types';
import { 
  buildExcelDatabaseWorkbook, 
  getLinkedSpreadsheetId, 
  DEFAULT_LINKED_SPREADSHEET_ID,
  recordSessionAuditLog,
  getLocalUsers,
  saveLocalUsers,
  LocalUser
} from './databaseManager';

export interface DriveFolderInfo {
  id: string;
  name: string;
  webViewLink?: string;
}

export interface DriveFileInfo {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  iconLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
}

const MAIN_FOLDER_NAME = 'VENEQUIP - Informes Técnicos y Registros';

/**
 * Searches for or creates the official Venequip Google Drive main folder.
 */
export async function ensureVenequipDriveFolder(accessToken: string): Promise<DriveFolderInfo> {
  try {
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(
      MAIN_FOLDER_NAME
    )}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name,webViewLink)`;

    const searchRes = await fetch(searchUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!searchRes.ok) {
      const err = await searchRes.text();
      throw new Error(`Error buscando carpeta en Google Drive: ${err}`);
    }

    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      return {
        id: searchData.files[0].id,
        name: searchData.files[0].name,
        webViewLink: searchData.files[0].webViewLink,
      };
    }

    // Create folder if not found
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: MAIN_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
        description: 'Carpeta centralizada de informes técnicos y base de usuarios de Venequip',
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      throw new Error(`Error creando carpeta en Google Drive: ${err}`);
    }

    const folderData = await createRes.json();
    return {
      id: folderData.id,
      name: folderData.name,
      webViewLink: folderData.webViewLink,
    };
  } catch (error: any) {
    console.error('Error in ensureVenequipDriveFolder:', error);
    throw error;
  }
}

/**
 * Generates an Excel workbook (.xlsx) binary Uint8Array from an InformeTecnico object.
 */
export function generateExcelReportBuffer(report: InformeTecnico): Uint8Array {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Encabezado y Datos del Equipo
  const enc = report.encabezado_venequip || ({} as any);
  const dataGeneral = [
    ['CONSORCIO DE COGESTIÓN VENEQUIP S.A.', ''],
    ['RIF', enc.rif || 'J404644865'],
    ['INFORME TÉCNICO DE SERVICIO', ''],
    ['----------------------------------------', '----------------------------------------'],
    ['N° de Servicio / Orden', enc.numero_servicio || ''],
    ['Fecha del Servicio', enc.fecha || ''],
    ['Sucursal Venequip', enc.sucursal || ''],
    ['Tipo de Actividad', enc.actividad || ''],
    ['Cliente', enc.cliente || ''],
    ['Ubicación / Localización', enc.localizacion || ''],
    ['----------------------------------------', '----------------------------------------'],
    ['Fabricante del Equipo', enc.fabricante || ''],
    ['Modelo del Equipo', enc.modelo || ''],
    ['Serial del Equipo (Chasis/Gen)', enc.serial_equipo || ''],
    ['Serial del Motor', enc.serial_motor || ''],
    ['Horómetro Motor', enc.horas_motor || ''],
    ['Horómetro Panel', enc.horas_panel || ''],
  ];
  const wsGeneral = XLSX.utils.aoa_to_sheet(dataGeneral);
  XLSX.utils.book_append_sheet(wb, wsGeneral, 'Datos Generales');

  // Sheet 2: Secciones Técnicas y Diagnóstico
  const sec = report.secciones_informe || ({} as any);
  const dataSecciones = [
    ['SECCIÓN', 'DETALLE TÉCNICO Y DIAGNÓSTICO AUDITADO'],
    ['1. Solicitud del Cliente', sec['1_solicitud_cliente'] || ''],
    ['2. Condiciones o Fallas Encontradas', sec['2_condiciones_fallas'] || ''],
    ['3. Pruebas y/o Actividades Efectuadas', sec['3_actividades_efectuadas'] || ''],
    ['4. Falla(s) Detectada(s)', sec['4_fallas_detectadas'] || ''],
    ['5. Causa(s) de la Falla', sec['5_causas_fallas'] || ''],
    ['6. Conclusiones y/o Recomendaciones', sec['6_conclusiones_recomendaciones'] || ''],
  ];
  const wsSecciones = XLSX.utils.aoa_to_sheet(dataSecciones);
  XLSX.utils.book_append_sheet(wb, wsSecciones, 'Secciones Técnicas');

  // Sheet 3: Herramientas Necesarias / Repuestos
  const herramientas = sec.herramientas_utilizadas || [];
  const dataHerramientas = [
    ['Ítem', 'Número de Parte', 'Descripción / Nombre de la Herramienta o Repuesto', 'Cantidad Utilizada'],
    ...herramientas.map((h: any, idx: number) => [
      idx + 1,
      h.numero_parte || 'N/A',
      h.nombre || '',
      h.cantidad || 1,
    ]),
  ];
  const wsHerramientas = XLSX.utils.aoa_to_sheet(dataHerramientas);
  XLSX.utils.book_append_sheet(wb, wsHerramientas, 'Herramientas y Repuestos');

  // Sheet 4: Bloque de Firmas y Validación
  const firmas = report.bloque_firmas || ({} as any);
  const dataFirmas = [
    ['RESPONSABILIDAD', 'NOMBRE COMPLETO', 'CARGO OFICIAL', 'ESTADO DE FIRMA'],
    [
      'Elaborado por (Técnico)',
      firmas.elaborado_por?.nombre || '',
      firmas.elaborado_por?.cargo || '',
      firmas.elaborado_por?.firma_image ? 'Firmado Digitalmente' : 'Pendiente',
    ],
    [
      'Revisado por (Supervisor)',
      firmas.revisado_por?.nombre || '',
      firmas.revisado_por?.cargo || '',
      firmas.revisado_por?.firma_image ? 'Firmado Digitalmente' : 'Pendiente',
    ],
    [
      'Aprobado por (Gerencia/Cliente)',
      firmas.aprobado_por?.nombre || '',
      firmas.aprobado_por?.cargo || '',
      firmas.aprobado_por?.firma_image ? 'Firmado Digitalmente' : 'Pendiente',
    ],
  ];
  const wsFirmas = XLSX.utils.aoa_to_sheet(dataFirmas);
  XLSX.utils.book_append_sheet(wb, wsFirmas, 'Registro de Firmas');

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(wbout);
}

/**
 * Uploads an Excel file to the official Venequip Google Drive folder.
 */
export async function uploadExcelReportToDrive(
  accessToken: string,
  report: InformeTecnico,
  customFolderId?: string
): Promise<{ fileId: string; name: string; webViewLink: string }> {
  try {
    let folderId = customFolderId;
    if (!folderId) {
      const folder = await ensureVenequipDriveFolder(accessToken);
      folderId = folder.id;
    }

    const enc = report.encabezado_venequip || ({} as any);
    const numServ = (enc.numero_servicio || '000').replace(/[^a-zA-Z0-9_-]/g, '_');
    const cliente = (enc.cliente || 'General').replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `Informe_Venequip_${numServ}_${cliente}.xlsx`;

    const excelBuffer = generateExcelReportBuffer(report);

    // Google Drive Multipart Upload
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: fileName,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      parents: [folderId],
      description: `Informe Técnico Venequip N° ${enc.numero_servicio || ''} para ${enc.cliente || ''}`,
    };

    // Convert Uint8Array to binary string
    let binaryData = '';
    const bytes = excelBuffer;
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binaryData += String.fromCharCode(bytes[i]);
    }

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n' +
      'Content-Transfer-Encoding: binary\r\n\r\n' +
      binaryData +
      closeDelimiter;

    const uploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      throw new Error(`Error al subir Excel a Google Drive: ${err}`);
    }

    const result = await uploadRes.json();
    return {
      fileId: result.id,
      name: result.name,
      webViewLink: result.webViewLink || `https://drive.google.com/file/d/${result.id}/view`,
    };
  } catch (error: any) {
    console.error('Error in uploadExcelReportToDrive:', error);
    throw error;
  }
}

/**
 * Generates an Excel file for all users and uploads to Google Drive.
 */
export async function uploadUsersRosterToDrive(
  accessToken: string,
  usersList: any[],
  customFolderId?: string
): Promise<{ fileId: string; name: string; webViewLink: string }> {
  try {
    let folderId = customFolderId;
    if (!folderId) {
      const folder = await ensureVenequipDriveFolder(accessToken);
      folderId = folder.id;
    }

    const fileName = `VENEQUIP_Base_Usuarios_Perfiles_${new Date().toISOString().split('T')[0]}.xlsx`;

    const wb = XLSX.utils.book_new();
    const dataUsers = [
      ['CONSORCIO DE COGESTIÓN VENEQUIP - REGISTRO OFICIAL DE USUARIOS Y PERFILES', '', '', '', '', '', ''],
      ['Fecha de Sincronización:', new Date().toLocaleString(), '', '', '', '', ''],
      ['-------------------------------------------------------------------------------------------------'],
      ['ID', 'Nombre Completo', 'Correo Electrónico', 'Rol Asignado', 'Estado', 'Especialidad / Cargo', 'Teléfono'],
      ...usersList.map((u, i) => [
        u.id || i + 1,
        u.name || 'Sin Nombre',
        u.email,
        u.role === 'admin'
          ? 'Administrador'
          : u.role === 'supervisor'
          ? 'Supervisor'
          : u.role === 'manager'
          ? 'Gerente'
          : 'Técnico Especialista',
        u.status === 'active' ? 'Activo' : 'Inactivo',
        u.specialty || 'Servicio Técnico',
        u.phone || 'N/A',
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(dataUsers);
    XLSX.utils.book_append_sheet(wb, ws, 'Usuarios Venequip');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const excelBuffer = new Uint8Array(wbout);

    // Google Drive Multipart Upload
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: fileName,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      parents: [folderId],
      description: 'Listado actualizado de usuarios autorizados del sistema de informes Venequip',
    };

    let binaryData = '';
    const bytes = excelBuffer;
    for (let i = 0; i < bytes.byteLength; i++) {
      binaryData += String.fromCharCode(bytes[i]);
    }

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n' +
      'Content-Transfer-Encoding: binary\r\n\r\n' +
      binaryData +
      closeDelimiter;

    const uploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      throw new Error(`Error al subir Usuarios a Google Drive: ${err}`);
    }

    const result = await uploadRes.json();
    return {
      fileId: result.id,
      name: result.name,
      webViewLink: result.webViewLink || `https://drive.google.com/file/d/${result.id}/view`,
    };
  } catch (error: any) {
    console.error('Error in uploadUsersRosterToDrive:', error);
    throw error;
  }
}

/**
 * Downloads users roster as Excel file directly to client browser
 */
export function downloadUsersRosterExcel(usersList: any[]): void {
  const fileName = `VENEQUIP_Base_Usuarios_Perfiles_${new Date().toISOString().split('T')[0]}.xlsx`;
  const wb = XLSX.utils.book_new();
  const dataUsers = [
    ['CONSORCIO DE COGESTIÓN VENEQUIP - REGISTRO OFICIAL DE USUARIOS Y PERFILES', '', '', '', '', '', ''],
    ['Fecha de Generación:', new Date().toLocaleString(), '', '', '', '', ''],
    ['-------------------------------------------------------------------------------------------------'],
    ['ID', 'Nombre Completo', 'Correo Electrónico', 'Rol Asignado', 'Estado', 'Especialidad / Cargo', 'Teléfono'],
    ...usersList.map((u, i) => [
      u.id || i + 1,
      u.name || 'Sin Nombre',
      u.email,
      u.role === 'admin'
        ? 'Administrador'
        : u.role === 'supervisor'
        ? 'Supervisor'
        : u.role === 'manager'
        ? 'Gerente'
        : 'Técnico Especialista',
      u.status === 'active' ? 'Activo' : 'Inactivo',
      u.specialty || 'Servicio Técnico',
      u.phone || 'N/A',
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(dataUsers);
  XLSX.utils.book_append_sheet(wb, ws, 'Usuarios Venequip');
  XLSX.writeFile(wb, fileName);
}

/**
 * Creates a formatted Google Doc in Google Drive with report content.
 */
export async function exportToGoogleDocs(
  accessToken: string,
  report: InformeTecnico,
  customFolderId?: string
): Promise<{ documentId: string; webViewLink: string }> {
  try {
    let folderId = customFolderId;
    if (!folderId) {
      const folder = await ensureVenequipDriveFolder(accessToken);
      folderId = folder.id;
    }

    const enc = report.encabezado_venequip || ({} as any);
    const sec = report.secciones_informe || ({} as any);
    const docTitle = `Informe Técnico Venequip - N° ${enc.numero_servicio || 'S/N'} - ${enc.cliente || 'Cliente'}`;

    // 1. Create blank Google Doc in Google Drive
    const createDocRes = await fetch('https://docs.googleapis.com/v1/documents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: docTitle,
      }),
    });

    if (!createDocRes.ok) {
      const err = await createDocRes.text();
      throw new Error(`Error creando documento Google Docs: ${err}`);
    }

    const docData = await createDocRes.json();
    const docId = docData.documentId;

    // 2. Move file into Venequip Drive Folder
    await fetch(
      `https://www.googleapis.com/drive/v3/files/${docId}?addParents=${folderId}&fields=id,parents`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    // 3. Build comprehensive text content for Google Docs
    const docBodyText = `CONSORCIO DE COGESTIÓN VENEQUIP S.A.
RIF: ${enc.rif || 'J404644865'}
INFORME TÉCNICO DE SERVICIO

1. DATOS GENERALES Y EQUIPO
• Sucursal: ${enc.sucursal || 'N/A'}
• Fecha: ${enc.fecha || 'N/A'}
• N° de Servicio: ${enc.numero_servicio || 'N/A'}
• Actividad: ${enc.actividad || 'N/A'}
• Cliente: ${enc.cliente || 'N/A'}
• Ubicación: ${enc.localizacion || 'N/A'}
• Fabricante: ${enc.fabricante || 'N/A'} | Modelo: ${enc.modelo || 'N/A'}
• Serial Equipo: ${enc.serial_equipo || 'N/A'} | Serial Motor: ${enc.serial_motor || 'N/A'}
• Horómetro Motor: ${enc.horas_motor || 'N/A'} | Horómetro Panel: ${enc.horas_panel || 'N/A'}

2. DESARROLLO DEL INFORME TÉCNICO

[1. Solicitud del Cliente]
${sec['1_solicitud_cliente'] || 'N/A'}

[2. Condiciones o Fallas Encontradas]
${sec['2_condiciones_fallas'] || 'N/A'}

[3. Pruebas y/o Actividades Efectuadas]
${sec['3_actividades_efectuadas'] || 'N/A'}

[4. Falla(s) Detectada(s)]
${sec['4_fallas_detectadas'] || 'N/A'}

[5. Causa(s) de la Falla]
${sec['5_causas_fallas'] || 'N/A'}

[6. Conclusiones y/o Recomendaciones]
${sec['6_conclusiones_recomendaciones'] || 'N/A'}

3. HERRAMIENTAS Y REPUESTOS UTILIZADOS
${
  (sec.herramientas_utilizadas || [])
    .map((h: any, i: number) => `${i + 1}. [${h.numero_parte || 'N/A'}] ${h.nombre} (Cant: ${h.cantidad})`)
    .join('\n') || 'No se registraron herramientas especiales.'
}

4. REGISTRO DE VALIDACIÓN Y FIRMAS
• Elaborado por: ${report.bloque_firmas?.elaborado_por?.nombre || 'Técnico Especialista'} (${report.bloque_firmas?.elaborado_por?.cargo || 'Técnico'})
• Revisado por: ${report.bloque_firmas?.revisado_por?.nombre || 'Supervisor'} (${report.bloque_firmas?.revisado_por?.cargo || 'Supervisor'})
• Aprobado por: ${report.bloque_firmas?.aprobado_por?.nombre || 'Gerente / Cliente'} (${report.bloque_firmas?.aprobado_por?.cargo || 'Gerencia'})

Documento generado y archivado automáticamente por el Sistema Integral Venequip.
`;

    // 4. Batch update text into document
    await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: docBodyText,
            },
          },
        ],
      }),
    });

    return {
      documentId: docId,
      webViewLink: `https://docs.google.com/document/d/${docId}/edit`,
    };
  } catch (error: any) {
    console.error('Error in exportToGoogleDocs:', error);
    throw error;
  }
}

/**
 * List files in the Venequip Google Drive folder.
 */
export async function listVenequipDriveFiles(
  accessToken: string,
  folderId?: string
): Promise<DriveFileInfo[]> {
  try {
    let targetFolderId = folderId;
    if (!targetFolderId) {
      const folder = await ensureVenequipDriveFolder(accessToken);
      targetFolderId = folder.id;
    }

    const query = `'${targetFolderId}' in parents and trashed=false`;
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        query
      )}&fields=files(id,name,mimeType,webViewLink,iconLink,createdTime,modifiedTime,size)&orderBy=modifiedTime desc`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Error consultando archivos en Google Drive: ${err}`);
    }

    const data = await res.json();
    return data.files || [];
  } catch (error: any) {
    console.error('Error listing drive files:', error);
    throw error;
  }
}

/**
 * Sends a technical report email via Gmail API with formatted HTML layout.
 */
export async function sendReportEmailViaGmail(
  accessToken: string,
  options: {
    to: string;
    cc?: string;
    subject: string;
    report: InformeTecnico;
    customNote?: string;
    senderEmail?: string;
  }
): Promise<{ messageId: string }> {
  try {
    const { to, cc, subject, report, customNote, senderEmail } = options;
    const enc = report.encabezado_venequip || ({} as any);
    const sec = report.secciones_informe || ({} as any);

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 20px; }
    .container { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #0f172a; padding: 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
    .header p { margin: 4px 0 0 0; font-size: 13px; color: #cbd5e1; }
    .badge { display: inline-block; background: #f59e0b; color: #78350f; font-weight: 700; font-size: 12px; padding: 4px 12px; border-radius: 20px; margin-top: 12px; }
    .content { padding: 24px; font-size: 14px; line-height: 1.6; }
    .table-info { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
    .table-info td { padding: 8px 12px; border: 1px solid #e2e8f0; }
    .table-info td.label { background: #f1f5f9; font-weight: 600; width: 35%; color: #334155; }
    .section-title { font-size: 15px; font-weight: 700; color: #0f172a; border-bottom: 2px solid #f59e0b; padding-bottom: 4px; margin-top: 20px; }
    .footer { background: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>CONSORCIO DE COGESTIÓN VENEQUIP S.A.</h1>
      <p>RIF: J404644865 • Sistema Integral de Informes Técnicos</p>
      <div class="badge">N° Servicio: ${enc.numero_servicio || 'S/N'}</div>
    </div>
    <div class="content">
      <p>Estimado(s),</p>
      <p>Se remite el resumen ejecutivo del <strong>Informe Técnico de Inspección y Servicio</strong> correspondiente al equipo auditado.</p>
      
      ${customNote ? `<div style="background:#fef3c7; border-left:4px solid #f59e0b; padding:12px 16px; margin:16px 0; border-radius:4px; font-size:13px;"><strong>Nota del Especialista:</strong><br>${customNote}</div>` : ''}

      <div class="section-title">DATOS DEL EQUIPO Y SERVICIO</div>
      <table class="table-info">
        <tr><td class="label">Cliente</td><td>${enc.cliente || 'N/A'}</td></tr>
        <tr><td class="label">Sucursal / Fecha</td><td>${enc.sucursal || 'N/A'} • ${enc.fecha || 'N/A'}</td></tr>
        <tr><td class="label">Modelo / Fabricante</td><td>${enc.modelo || 'N/A'} (${enc.fabricante || 'Venequip'})</td></tr>
        <tr><td class="label">Serial Equipo / Motor</td><td>${enc.serial_equipo || 'N/A'} / ${enc.serial_motor || 'N/A'}</td></tr>
        <tr><td class="label">Horómetros</td><td>Motor: ${enc.horas_motor || 'N/A'} | Panel: ${enc.horas_panel || 'N/A'}</td></tr>
      </table>

      <div class="section-title">DIAGNÓSTICO Y CONCLUSIONES</div>
      <p><strong>1. Falla(s) Detectada(s):</strong><br>${sec['4_fallas_detectadas'] || 'Sin fallas críticas detectadas.'}</p>
      <p><strong>2. Conclusiones y Recomendaciones:</strong><br>${sec['6_conclusiones_recomendaciones'] || 'Ver informe completo adjunto o en Google Drive.'}</p>

      <div class="section-title">RESPONSABLES</div>
      <p style="font-size:13px; color:#475569;">
        • <strong>Elaborado por:</strong> ${report.bloque_firmas?.elaborado_por?.nombre || 'Técnico Especialista'} (${report.bloque_firmas?.elaborado_por?.cargo || 'Técnico'})<br>
        • <strong>Revisado por:</strong> ${report.bloque_firmas?.revisado_por?.nombre || 'Supervisor de Servicio'}<br>
        • <strong>Aprobado por:</strong> ${report.bloque_firmas?.aprobado_por?.nombre || 'Gerencia de Operaciones'}
      </p>
    </div>
    <div class="footer">
      Este correo ha sido generado y certificado por la plataforma técnica de Venequip.<br>
      © ${new Date().getFullYear()} Consorcio de Cogestión Venequip S.A.
    </div>
  </div>
</body>
</html>
`;

    // Construct RFC 2822 email
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      `From: ${senderEmail || 'me'}`,
      `To: ${to}`,
      ...(cc ? [`Cc: ${cc}`] : []),
      `Subject: ${utf8Subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      htmlBody,
    ];

    const message = messageParts.join('\r\n');
    // Base64url encode
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encodedMessage,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Error enviando correo por Gmail: ${err}`);
    }

    const data = await res.json();
    return { messageId: data.id };
  } catch (error: any) {
    console.error('Error in sendReportEmailViaGmail:', error);
    throw error;
  }
}

/**
 * Uploads/Overwrites the official Venequip database workbook directly to the linked Google Drive file.
 */
export async function syncFullDatabaseToLinkedGoogleSpreadsheet(
  accessToken: string,
  customSpreadsheetId?: string
): Promise<{ success: boolean; webViewLink: string; fileId: string; timestamp: string }> {
  try {
    const fileId = customSpreadsheetId || getLinkedSpreadsheetId() || DEFAULT_LINKED_SPREADSHEET_ID;
    const wb = buildExcelDatabaseWorkbook();
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const excelBuffer = new Uint8Array(wbout);

    // Update the file in Google Drive via media PATCH
    const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;

    const res = await fetch(uploadUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      body: excelBuffer,
    });

    if (!res.ok) {
      // If direct PATCH failed (e.g. native sheet or permissions), try multipart or sheets API fallback
      const errorText = await res.text();
      console.warn('Drive PATCH media upload warning:', errorText);

      // Attempt multipart update
      const boundary = '-------314159265358979323846';
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;
      const metadata = {
        name: `Venequip_Base_de_Datos_Oficial_${new Date().toISOString().split('T')[0]}.xlsx`,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      };

      let binaryData = '';
      for (let i = 0; i < excelBuffer.byteLength; i++) {
        binaryData += String.fromCharCode(excelBuffer[i]);
      }

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n' +
        'Content-Transfer-Encoding: binary\r\n\r\n' +
        binaryData +
        closeDelimiter;

      const multiRes = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody,
        }
      );

      if (!multiRes.ok) {
        const multiErr = await multiRes.text();
        throw new Error(`Error actualizando archivo en Google Drive (ID: ${fileId}): ${multiErr}`);
      }
    }

    const timestamp = new Date().toLocaleString('es-VE');
    const webViewLink = `https://docs.google.com/spreadsheets/d/${fileId}/edit?usp=drive_link`;

    // Record session audit log
    recordSessionAuditLog({
      email: 'Sincronización en la Nube',
      role: 'SISTEMA',
      event: 'DRIVE_SPREADSHEET_SYNC_SUCCESS',
      status: 'ACTUALIZADO'
    });

    return {
      success: true,
      fileId,
      webViewLink,
      timestamp,
    };
  } catch (error: any) {
    console.error('Error syncing full database to linked Google Spreadsheet:', error);
    throw error;
  }
}

/**
 * Downloads and imports all data from the linked Google Drive/Sheets Excel file into the applet state.
 */
export async function importFullDatabaseFromLinkedGoogleSpreadsheet(
  accessToken: string,
  customSpreadsheetId?: string
): Promise<{ success: boolean; reportsCount: number; usersCount: number; message: string }> {
  try {
    const fileId = customSpreadsheetId || getLinkedSpreadsheetId() || DEFAULT_LINKED_SPREADSHEET_ID;

    // Fetch binary content
    let downloadRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // If it is a native Google Sheet rather than binary xlsx, export as xlsx
    if (!downloadRes.ok) {
      downloadRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
    }

    if (!downloadRes.ok) {
      const errText = await downloadRes.text();
      throw new Error(`Error descargando base de datos desde Google Drive: ${errText}`);
    }

    const arrayBuffer = await downloadRes.arrayBuffer();
    const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });

    let importedReportsCount = 0;
    let importedUsersCount = 0;

    // Sheet 7: Personal y Técnicos
    const usersSheetName = workbook.SheetNames.find(n => n.includes('Personal') || n.includes('Usuarios') || n.includes('7_'));
    if (usersSheetName) {
      const usersSheet = workbook.Sheets[usersSheetName];
      const parsedUsers: any[] = XLSX.utils.sheet_to_json(usersSheet);
      if (Array.isArray(parsedUsers) && parsedUsers.length > 0) {
        const currentUsers = getLocalUsers();
        parsedUsers.forEach((row, i) => {
          const email = (row['Correo Electrónico'] || row['email'] || row['Correo'] || '').trim().toLowerCase();
          const name = (row['Nombre y Apellido'] || row['Nombre Completo'] || row['name'] || '').trim();
          const roleRaw = (row['Nivel de Rol'] || row['Rol'] || row['role'] || 'technician').toLowerCase();
          const role = roleRaw.includes('admin') ? 'admin' : roleRaw.includes('super') ? 'supervisor' : roleRaw.includes('geren') ? 'manager' : 'technician';
          const status = (row['Estatus Operativo'] || row['Estado'] || 'active').toLowerCase().includes('inact') ? 'inactive' : 'active';
          const specialty = row['Especialidad Técnica'] || row['Especialidad'] || 'General';
          const phone = row['Teléfono Móvil'] || row['Teléfono'] || '';

          if (email) {
            const existingIdx = currentUsers.findIndex(u => u.email.toLowerCase() === email);
            if (existingIdx >= 0) {
              currentUsers[existingIdx].name = name || currentUsers[existingIdx].name;
              currentUsers[existingIdx].role = role as any;
              currentUsers[existingIdx].status = status as any;
              currentUsers[existingIdx].specialty = specialty;
              currentUsers[existingIdx].phone = phone;
            } else {
              currentUsers.push({
                id: currentUsers.length + 1,
                uid: `google_sync_${Date.now()}_${i}`,
                email,
                name: name || email.split('@')[0],
                password: 'admin',
                role: role as any,
                status: status as any,
                specialty,
                phone,
                createdAt: new Date().toISOString().split('T')[0],
              });
            }
            importedUsersCount++;
          }
        });
        saveLocalUsers(currentUsers);
      }
    }

    return {
      success: true,
      reportsCount: importedReportsCount,
      usersCount: importedUsersCount,
      message: `Sincronización completada exitosamente desde Google Drive.`
    };
  } catch (error: any) {
    console.error('Error importing from linked Google Spreadsheet:', error);
    throw error;
  }
}

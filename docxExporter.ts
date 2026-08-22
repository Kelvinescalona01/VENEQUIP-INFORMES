import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ImageRun,
  AlignmentType,
  HeadingLevel,
  ShadingType,
  VerticalAlign
} from 'docx';
import { saveAs } from 'file-saver';
import { InformeTecnico } from './types';
import { normalizeReport } from './reportUtils';
import { getVenequipLogoDataUrl, getDefaultSignatureDataUrl } from './logoUtils';
import { convertUrlToBase64DataUrl } from './imageUtils';

/**
 * Converts a base64 or Data URL string into a Uint8Array for docx ImageRun.
 */
function base64ToUint8Array(dataUrlOrBase64: string): Uint8Array | null {
  try {
    if (!dataUrlOrBase64) return null;
    let base64 = dataUrlOrBase64;
    if (base64.includes(',')) {
      base64 = base64.split(',')[1];
    }
    const cleanBase64 = base64.replace(/[\r\n\s]/g, '');
    const binaryString = window.atob(cleanBase64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (err) {
    console.warn('Failed to convert base64 to Uint8Array for docx:', err);
    return null;
  }
}

const standardTableBorders = {
  top: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
  bottom: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
  left: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
  right: { style: BorderStyle.SINGLE, size: 8, color: '000000' },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
  insideVertical: { style: BorderStyle.SINGLE, size: 6, color: '000000' }
};

const cellPadding = {
  top: 100,
  bottom: 100,
  left: 140,
  right: 140
};

/**
 * Exports the technical report as a genuine Microsoft Word (.docx) file
 * with ALL images (logo, signatures, and inspection photos) embedded directly
 * as OpenXML binary media to prevent any "No se puede mostrar la imagen vinculada" errors.
 */
export async function exportToDocx(rawReport: InformeTecnico, filename: string): Promise<void> {
  const report = normalizeReport(rawReport);
  const enc = report.encabezado_venequip;
  const sec = report.secciones_informe;
  const fir = report.bloque_firmas;

  // 1. Prepare Logo Image bytes
  const logoDataUrl = getVenequipLogoDataUrl();
  const logoBytes = base64ToUint8Array(logoDataUrl);

  // 2. Prepare Signatures bytes
  let sigElaboradoUrl = fir.elaborado_por?.firma_image || '';
  if (!sigElaboradoUrl && fir.elaborado_por?.nombre) {
    sigElaboradoUrl = getDefaultSignatureDataUrl(fir.elaborado_por.nombre);
  }
  if (sigElaboradoUrl && !sigElaboradoUrl.startsWith('data:image/')) {
    sigElaboradoUrl = await convertUrlToBase64DataUrl(sigElaboradoUrl, 'Firma Elaborado');
  }
  const sigElaboradoBytes = base64ToUint8Array(sigElaboradoUrl);

  let sigRevisadoUrl = fir.revisado_por?.firma_image || '';
  if (!sigRevisadoUrl && fir.revisado_por?.nombre) {
    sigRevisadoUrl = getDefaultSignatureDataUrl(fir.revisado_por.nombre);
  }
  if (sigRevisadoUrl && !sigRevisadoUrl.startsWith('data:image/')) {
    sigRevisadoUrl = await convertUrlToBase64DataUrl(sigRevisadoUrl, 'Firma Revisado');
  }
  const sigRevisadoBytes = base64ToUint8Array(sigRevisadoUrl);

  let sigAprobadoUrl = fir.aprobado_por?.firma_image || '';
  if (!sigAprobadoUrl && fir.aprobado_por?.nombre) {
    sigAprobadoUrl = getDefaultSignatureDataUrl(fir.aprobado_por.nombre);
  }
  if (sigAprobadoUrl && !sigAprobadoUrl.startsWith('data:image/')) {
    sigAprobadoUrl = await convertUrlToBase64DataUrl(sigAprobadoUrl, 'Firma Aprobado');
  }
  const sigAprobadoBytes = base64ToUint8Array(sigAprobadoUrl);

  // 3. Prepare Photos bytes
  const photosData = await Promise.all(
    (sec["7_registro_fotografico"] || []).map(async (photo, idx) => {
      const rawImages: string[] = photo.imagenes && photo.imagenes.length > 0
        ? photo.imagenes.filter(img => Boolean(img && img.trim()))
        : (photo.url_o_base64 && photo.url_o_base64.trim() ? [photo.url_o_base64] : []);

      const imagesWithBytes = await Promise.all(
        rawImages.map(async (imgUrl, imgI) => {
          let b64 = imgUrl;
          if (b64 && !b64.startsWith('data:image/')) {
            b64 = await convertUrlToBase64DataUrl(b64, `${photo.descripcion || 'Foto'} ${imgI + 1}`);
          }
          return base64ToUint8Array(b64);
        })
      );

      return {
        ...photo,
        allImagesBytes: imagesWithBytes.filter((b): b is Uint8Array => b !== null)
      };
    })
  );

  // Build Sections and Children for DOCX
  const children: (Paragraph | Table)[] = [];

  // ==========================================
  // 1. HEADER TABLE (Logo + Title)
  // ==========================================
  const logoCellChildren: Paragraph[] = [];
  if (logoBytes) {
    logoCellChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            data: logoBytes,
            transformation: {
              width: 190,
              height: 60
            },
            type: 'png'
          })
        ]
      })
    );
  } else {
    logoCellChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: 'CONSORCIO DE COGESTIÓN\nVENEQUIP', bold: true, size: 22 })
        ]
      })
    );
  }

  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: standardTableBorders,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 38, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            margins: cellPadding,
            children: logoCellChildren
          }),
          new TableCell({
            width: { size: 62, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            shading: { fill: 'F3F4F6', type: ShadingType.CLEAR },
            margins: cellPadding,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'INFORME DE SERVICIO',
                    bold: true,
                    size: 28,
                    font: 'Arial Black'
                  })
                ]
              })
            ]
          })
        ]
      })
    ]
  });

  children.push(headerTable);
  children.push(new Paragraph({ spacing: { after: 120 } }));

  // ==========================================
  // 2. METADATA TABLE
  // ==========================================
  const metaTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: standardTableBorders,
    rows: [
      // Row 1
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            margins: cellPadding,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'Sucursal: ', bold: true, size: 19 }),
                  new TextRun({ text: (enc.sucursal || 'LOS RUICES').toUpperCase(), size: 19 })
                ]
              })
            ]
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            margins: cellPadding,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'Fecha: ', bold: true, size: 19 }),
                  new TextRun({ text: enc.fecha || '', size: 19 })
                ]
              })
            ]
          })
        ]
      }),
      // Row 2
      new TableRow({
        children: [
          new TableCell({
            margins: cellPadding,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'Actividad: ', bold: true, size: 19 }),
                  new TextRun({ text: (enc.actividad || '').toUpperCase(), size: 19 })
                ]
              })
            ]
          }),
          new TableCell({
            margins: cellPadding,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'N° Servicio: ', bold: true, size: 19 }),
                  new TextRun({ text: enc.numero_servicio || '', bold: true, size: 20, color: '000000' })
                ]
              })
            ]
          })
        ]
      }),
      // Row 3
      new TableRow({
        children: [
          new TableCell({
            margins: cellPadding,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'Localización del Equipo: ', bold: true, size: 19 }),
                  new TextRun({ text: (enc.localizacion || '').toUpperCase(), size: 19 })
                ]
              })
            ]
          }),
          new TableCell({
            margins: cellPadding,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'Cliente: ', bold: true, size: 19 }),
                  new TextRun({ text: (enc.cliente || '').toUpperCase(), size: 19 })
                ]
              })
            ]
          })
        ]
      }),
      // Row 4
      new TableRow({
        children: [
          new TableCell({
            margins: cellPadding,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'Modelo: ', bold: true, size: 19 }),
                  new TextRun({ text: (enc.modelo || '').toUpperCase(), size: 19 }),
                  new TextRun({ text: '    |    Fabricante: ', bold: true, size: 19 }),
                  new TextRun({ text: (enc.fabricante || '').toUpperCase(), size: 19 })
                ]
              })
            ]
          }),
          new TableCell({
            margins: cellPadding,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'Serial Equipo: ', bold: true, size: 19 }),
                  new TextRun({ text: enc.serial_equipo || '', size: 19 })
                ]
              })
            ]
          })
        ]
      }),
      // Row 5
      new TableRow({
        children: [
          new TableCell({
            margins: cellPadding,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'Serial Motor: ', bold: true, size: 19 }),
                  new TextRun({ text: enc.serial_motor || '', size: 19 })
                ]
              })
            ]
          }),
          new TableCell({
            margins: cellPadding,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'Horas Motor: ', bold: true, size: 19 }),
                  new TextRun({ text: `${enc.horas_motor || ''}`, size: 19 }),
                  new TextRun({ text: '    |    Horas Panel: ', bold: true, size: 19 }),
                  new TextRun({ text: `${enc.horas_panel || 'N/A'}`, size: 19 })
                ]
              })
            ]
          })
        ]
      })
    ]
  });

  children.push(metaTable);
  children.push(new Paragraph({ spacing: { after: 120 } }));

  // Helper to create standard section tables
  const createSectionBlock = (title: string, content: string): Table => {
    const paragraphs = content
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map(
        (line) =>
          new Paragraph({
            spacing: { before: 40, after: 40 },
            children: [new TextRun({ text: line, size: 19 })]
          })
      );

    if (paragraphs.length === 0) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: 'Sin información registrada.', size: 19, italics: true, color: '666666' })]
        })
      );
    }

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: standardTableBorders,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { fill: 'F3F4F6', type: ShadingType.CLEAR },
              margins: cellPadding,
              children: [
                new Paragraph({
                  children: [new TextRun({ text: title, bold: true, size: 20 })]
                })
              ]
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              margins: cellPadding,
              children: paragraphs
            })
          ]
        })
      ]
    });
  };

  // Section 1
  children.push(createSectionBlock('1. Solicitud del Cliente', sec["1_solicitud_cliente"] || ''));
  children.push(new Paragraph({ spacing: { after: 120 } }));

  // Section 2
  children.push(createSectionBlock('2. Condiciones o fallas encontradas', sec["2_condiciones_fallas"] || ''));
  children.push(new Paragraph({ spacing: { after: 120 } }));

  // Section 3 (with tools)
  const sec3Paragraphs = (sec["3_actividades_efectuadas"] || '')
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map(
      (line) =>
        new Paragraph({
          spacing: { before: 40, after: 40 },
          children: [new TextRun({ text: line, size: 19 })]
        })
    );

  const toolsRows: TableRow[] = [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          shading: { fill: 'E5E7EB', type: ShadingType.CLEAR },
          margins: cellPadding,
          children: [new Paragraph({ children: [new TextRun({ text: 'Nombre de la Herramienta', bold: true, size: 18 })] })]
        }),
        new TableCell({
          width: { size: 35, type: WidthType.PERCENTAGE },
          shading: { fill: 'E5E7EB', type: ShadingType.CLEAR },
          margins: cellPadding,
          children: [new Paragraph({ children: [new TextRun({ text: 'Número de Parte', bold: true, size: 18 })] })]
        }),
        new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          shading: { fill: 'E5E7EB', type: ShadingType.CLEAR },
          margins: cellPadding,
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Cant.', bold: true, size: 18 })] })]
        })
      ]
    })
  ];

  if (sec.herramientas_utilizadas && sec.herramientas_utilizadas.length > 0) {
    sec.herramientas_utilizadas.forEach((tool) => {
      toolsRows.push(
        new TableRow({
          children: [
            new TableCell({
              margins: cellPadding,
              children: [new Paragraph({ children: [new TextRun({ text: tool.nombre, size: 18 })] })]
            }),
            new TableCell({
              margins: cellPadding,
              children: [new Paragraph({ children: [new TextRun({ text: tool.numero_parte, size: 18 })] })]
            }),
            new TableCell({
              margins: cellPadding,
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${tool.cantidad}`, size: 18 })] })]
            })
          ]
        })
      );
    });
  } else {
    toolsRows.push(
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 3,
            margins: cellPadding,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'No se requirieron herramientas especiales.', italics: true, size: 18, color: '666666' })]
              })
            ]
          })
        ]
      })
    );
  }

  const sec3Table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: standardTableBorders,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: 'F3F4F6', type: ShadingType.CLEAR },
            margins: cellPadding,
            children: [
              new Paragraph({
                children: [new TextRun({ text: '3. Pruebas y/o actividades efectuadas', bold: true, size: 20 })]
              })
            ]
          })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({
            margins: cellPadding,
            children: sec3Paragraphs
          })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: 'F9FAFB', type: ShadingType.CLEAR },
            margins: cellPadding,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'HERRAMIENTAS NECESARIAS', bold: true, size: 18 })]
              })
            ]
          })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({
            margins: { top: 60, bottom: 60, left: 60, right: 60 },
            children: [
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: standardTableBorders,
                rows: toolsRows
              })
            ]
          })
        ]
      })
    ]
  });

  children.push(sec3Table);
  children.push(new Paragraph({ spacing: { after: 120 } }));

  // Section 4
  children.push(createSectionBlock('4. Falla(s)', sec["4_fallas_detectadas"] || ''));
  children.push(new Paragraph({ spacing: { after: 120 } }));

  // Section 5
  children.push(createSectionBlock('5. Causa(s) de la falla(s)', sec["5_causas_fallas"] || ''));
  children.push(new Paragraph({ spacing: { after: 120 } }));

  // Section 6
  children.push(createSectionBlock('6. Conclusiones y/o Recomendaciones', sec["6_conclusiones_recomendaciones"] || ''));
  children.push(new Paragraph({ spacing: { after: 120 } }));

  // ==========================================
  // 7. REGISTRO FOTOGRÁFICO Y ANEXOS
  // ==========================================
  const photoCellChildren: Paragraph[] = [];
  if (photosData.length > 0) {
    photosData.forEach((p, idx) => {
      if (p.allImagesBytes && p.allImagesBytes.length > 0) {
        if (p.allImagesBytes.length === 1) {
          photoCellChildren.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 80, after: 60 },
              children: [
                new ImageRun({
                  data: p.allImagesBytes[0],
                  transformation: {
                    width: 380,
                    height: 230
                  },
                  type: 'jpg'
                })
              ]
            })
          );
        } else {
          // Multiple images in this block: render each in sequence or pairs
          p.allImagesBytes.forEach((imgBytes) => {
            photoCellChildren.push(
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 40, after: 40 },
                children: [
                  new ImageRun({
                    data: imgBytes,
                    transformation: {
                      width: 320,
                      height: 195
                    },
                    type: 'jpg'
                  })
                ]
              })
            );
          });
        }
      }
      photoCellChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 40, after: 140 },
          children: [
            new TextRun({ text: `${p.imagen_id || `Imagen ${idx + 1}`}: `, bold: true, size: 19 }),
            new TextRun({ text: p.descripcion || '', size: 19 })
          ]
        })
      );
    });
  } else {
    photoCellChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 60, after: 60 },
        children: [
          new TextRun({ text: 'Sin registro fotográfico adjunto.', italics: true, size: 19, color: '666666' })
        ]
      })
    );
  }

  const sec7Table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: standardTableBorders,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: 'F3F4F6', type: ShadingType.CLEAR },
            margins: cellPadding,
            children: [
              new Paragraph({
                children: [new TextRun({ text: '7. Registro fotográfico y Anexos :', bold: true, size: 20 })]
              })
            ]
          })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({
            margins: cellPadding,
            children: photoCellChildren
          })
        ]
      })
    ]
  });

  children.push(sec7Table);
  children.push(new Paragraph({ spacing: { after: 120 } }));

  // ==========================================
  // BLOQUE DE FIRMAS
  // ==========================================
  const makeSignatureCell = (
    header: string,
    nombre: string,
    cargo: string,
    sigBytes: Uint8Array | null
  ): TableCell => {
    const cellChildren: Paragraph[] = [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 40 },
        children: [new TextRun({ text: header, bold: true, size: 18 })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 20, after: 40 },
        children: [new TextRun({ text: nombre, bold: true, size: 19 })]
      })
    ];

    if (sigBytes) {
      cellChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 40, after: 40 },
          children: [
            new ImageRun({
              data: sigBytes,
              transformation: {
                width: 140,
                height: 48
              },
              type: 'png'
            })
          ]
        })
      );
    } else {
      cellChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 80, after: 80 },
          children: [new TextRun({ text: '[ Firma ]', italics: true, size: 18, color: '888888' })]
        })
      );
    }

    cellChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 20 },
        children: [
          new TextRun({ text: 'Cargo: ', bold: true, size: 17 }),
          new TextRun({ text: cargo, size: 17 })
        ]
      })
    );

    return new TableCell({
      width: { size: 33, type: WidthType.PERCENTAGE },
      verticalAlign: VerticalAlign.TOP,
      margins: cellPadding,
      children: cellChildren
    });
  };

  const signaturesTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: standardTableBorders,
    rows: [
      new TableRow({
        children: [
          makeSignatureCell(
            'ELABORADO POR:',
            fir.elaborado_por?.nombre || 'Técnico Especialista',
            fir.elaborado_por?.cargo || 'Técnico de Servicio',
            sigElaboradoBytes
          ),
          makeSignatureCell(
            'REVISADO Y CORREGIDO POR:',
            fir.revisado_por?.nombre || 'Supervisor de Servicio',
            fir.revisado_por?.cargo || 'Supervisor de Servicio',
            sigRevisadoBytes
          ),
          makeSignatureCell(
            'APROBADO POR:',
            fir.aprobado_por?.nombre || 'Gerente de Sucursal',
            fir.aprobado_por?.cargo || 'Gerente de Operaciones',
            sigAprobadoBytes
          )
        ]
      })
    ]
  });

  children.push(signaturesTable);
  children.push(new Paragraph({ spacing: { after: 120 } }));

  // Corporate Footer Note
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120 },
      children: [
        new TextRun({
          text: 'CONSORCIO DE COGESTIÓN VENEQUIP, S.A. • RIF J404644865 • DOCUMENTO TÉCNICO OFICIAL DE SERVICIO',
          size: 16,
          color: '666666',
          bold: true
        })
      ]
    })
  );

  // Generate Document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 800,
              bottom: 800,
              left: 900,
              right: 900
            }
          }
        },
        children
      }
    ]
  });

  // Pack and Save
  const blob = await Packer.toBlob(doc);
  const outFilename = filename.endsWith('.docx')
    ? filename
    : filename.endsWith('.doc')
    ? filename.replace(/\.doc$/, '.docx')
    : `${filename}.docx`;

  saveAs(blob, outFilename);
}

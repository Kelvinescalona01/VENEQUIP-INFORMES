import { InformeTecnico } from './types';
import { normalizeReport } from './reportUtils';

// Working Gemini API Key provided by user
const GEMINI_API_KEY_DEFAULT = 'AQ.Ab8RN6LJaVCQbUBAcO61nesXjbDsMZu6UA2dMlZj8ASk2UVYEA';

// Prioritized models
const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.5-pro'
];

/**
 * Extracts and cleans JSON from AI output
 */
export function safeExtractJson(text: string): any {
  if (!text || typeof text !== 'string') {
    throw new Error('Respuesta vacía recibida del motor de IA.');
  }
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  }

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return JSON.parse(cleaned);
}

/**
 * Direct REST caller to Google Generative Language API
 * Works directly in any browser (Chrome, Safari, Edge, Firefox, Mobile) and static hosts (Vercel)
 */
export async function callGeminiRestDirect(
  parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>,
  systemInstructionText?: string,
  responseSchema?: any
): Promise<string> {
  const apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || GEMINI_API_KEY_DEFAULT;
  let lastError: any = null;

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

      const requestBody: any = {
        contents: [
          {
            parts: parts.map(p => {
              if (p.inlineData) {
                return {
                  inline_data: {
                    mime_type: p.inlineData.mimeType,
                    data: p.inlineData.data
                  }
                };
              }
              return { text: p.text || '' };
            })
          }
        ],
        generationConfig: {
          temperature: 0.2,
        }
      };

      if (responseSchema) {
        requestBody.generationConfig.responseMimeType = 'application/json';
        requestBody.generationConfig.responseSchema = responseSchema;
      }

      if (systemInstructionText) {
        requestBody.systemInstruction = {
          parts: [{ text: systemInstructionText }]
        };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`[Gemini REST direct] Error con modelo ${model} (${response.status}):`, errText);
        lastError = new Error(`Error API (${response.status}): ${errText}`);
        continue;
      }

      const data = await response.json();
      const textOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (textOutput) {
        return textOutput;
      }
    } catch (e: any) {
      console.warn(`[Gemini REST direct] Excepción con modelo ${model}:`, e);
      lastError = e;
    }
  }

  throw lastError || new Error('No se pudo conectar con el servicio de Inteligencia Artificial Gemini.');
}

/**
 * Universal Multimodal Report Analyzer:
 * 1. Tries backend proxy `/api/analyze-report`
 * 2. Falls back to direct browser REST call with `X-goog-api-key`
 */
export async function analyzeReportUniversal(
  files: { data: string; mimeType: string; name: string }[],
  rawNotes: string,
  instructions: string,
  currentReport?: InformeTecnico
): Promise<InformeTecnico> {
  // 1. Try Backend Proxy first
  try {
    const res = await fetch('/api/analyze-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        files,
        rawText: rawNotes,
        userInstructions: instructions,
        currentReport,
      }),
    });

    const contentType = res.headers.get('content-type');
    if (res.ok && contentType && contentType.includes('application/json')) {
      const json = await res.json();
      if (json.success && json.data) {
        return normalizeReport(json.data);
      }
    }
  } catch (backendErr) {
    console.log('Backend proxy unavailable, falling back to direct browser Gemini REST API');
  }

  // 2. Direct Browser REST Call (Vercel & Multiplatform Support)
  const systemInstruction = `
Eres el Motor de Inteligencia Artificial para el Sistema de Mantenimiento e Informes Técnicos del Consorcio de Cogestión Venequip (RIF: J404644865).
Tu rol es actuar como un Ingeniero Electromecánico Senior y Auditor de Servicios Industriales especializado en maquinaria pesada y sistemas de generación de energía (Caterpillar, Generac, Perkins, Cummins, etc.).

Tu objetivo es procesar datos de entrada heterogéneos (fotos de constancias, placas de motor, mediciones de multímetro/telurómetro, archivos o notas de campo), transformar y elevar la calidad de la redacción técnica al estándar corporativo de Venequip, extraer metadatos y firmas, y estructurar el informe en las 7 secciones reglamentarias:

1. Solicitud del Cliente
2. Condiciones o Fallas Encontradas
3. Pruebas y/o Actividades Efectuadas (con tabla de Herramientas Necesarias)
4. Falla(s)
5. Causa(s) de la Falla(s)
6. Conclusiones y/o Recomendaciones
7. Registro Fotográfico y Anexos

REGLAS DE ORO:
- Redacción estrictamente en voz pasiva o impersonal ("Se realizó la medición", "Se constató el parámetro", NUNCA "yo revisé" o "nosotros medimos").
- Prohibido inventar valores numéricos de voltaje (V AC/DC), frecuencia (Hz), velocidad (RPM), presión (inH2O/PSI) o resistencia (Ω). Si una medición no está visible, marca como "[Dato pendiente de verificación en sitio]".
- Mantener la precisión de los números de parte, marcas de equipos (Generac, Caterpillar) y seriales.
- Retornar un objeto JSON estructurado válido según el esquema oficial de Venequip.
  `.trim();

  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

  let promptText = `Analiza los siguientes insumos técnicos y genera el informe oficial de servicio Venequip en formato JSON estructurado.\n`;
  if (rawNotes) {
    promptText += `\n--- NOTAS / TEXTO DE CAMPO BRUTO ---\n${rawNotes}\n`;
  }
  if (instructions) {
    promptText += `\n--- INSTRUCCIONES ADICIONALES DEL USUARIO ---\n${instructions}\n`;
  }
  if (currentReport) {
    promptText += `\n--- INFORME ACTUAL BASE ---\n${JSON.stringify(currentReport)}\n`;
  }

  promptText += `\nDebes responder EXCLUSIVAMENTE con el objeto JSON con la estructura:
{
  "encabezado_venequip": {
    "empresa": "CONSORCIO DE COGESTIÓN VENEQUIP, S.A.",
    "rif": "J404644865",
    "sucursal": "LOS RUICES",
    "fecha": "DD/MM/AAAA",
    "numero_servicio": "S-XXXX",
    "actividad": "DIAGNÓSTICO Y EVALUACIÓN TÉCNICA",
    "cliente": "NOMBRE CLIENTE",
    "localizacion": "UBICACIÓN",
    "fabricante": "CATERPILLAR",
    "modelo": "CAT C15",
    "serial_equipo": "SERIAL",
    "serial_motor": "SERIAL",
    "horas_motor": "0",
    "horas_panel": ""
  },
  "secciones_informe": {
    "1_solicitud_cliente": "Texto...",
    "2_condiciones_fallas": "Texto...",
    "3_actividades_efectuadas": "Texto...",
    "herramientas_utilizadas": [
      { "nombre": "LapTop CAT ET", "numero_parte": "466-6258", "cantidad": 1 }
    ],
    "4_fallas_detectadas": "Texto...",
    "5_causas_fallas": "Texto...",
    "6_conclusiones_recomendaciones": "Texto...",
    "7_registro_fotografico": [
      { "imagen_id": "Foto 1", "descripcion": "Descripción...", "url_o_base64": "" }
    ]
  },
  "bloque_firmas": {
    "elaborado_por": { "nombre": "KELVIN ESCALONA", "cargo": "Técnico Electricista" },
    "revisado_por": { "nombre": "Supervisor de Taller", "cargo": "Supervisor de Servicio" },
    "aprobado_por": { "nombre": "Gerente de Operaciones", "cargo": "Gerente de Sucursal" }
  }
}`;

  parts.push({ text: promptText });

  if (Array.isArray(files) && files.length > 0) {
    for (const f of files) {
      if (f.data && f.mimeType) {
        const cleanBase64 = f.data.includes(',') ? f.data.split(',')[1] : f.data;
        parts.push({
          inlineData: {
            mimeType: f.mimeType,
            data: cleanBase64,
          },
        });
      }
    }
  }

  const rawResult = await callGeminiRestDirect(parts, systemInstruction);
  const parsed = safeExtractJson(rawResult);
  return normalizeReport(parsed);
}

/**
 * Universal Section Polishing:
 * Elevates technical terminology and tone for a specific report section
 */
export async function polishSectionUniversal(
  sectionName: string,
  currentText: string,
  context?: any
): Promise<string> {
  // 1. Try Backend Proxy first
  try {
    const res = await fetch('/api/polish-section', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sectionName,
        currentText,
        context,
      }),
    });

    const contentType = res.headers.get('content-type');
    if (res.ok && contentType && contentType.includes('application/json')) {
      const json = await res.json();
      if (json.success && json.polishedText) {
        return json.polishedText;
      }
    }
  } catch (e) {
    console.log('Backend proxy unavailable for polishing, using direct browser REST');
  }

  // 2. Direct Browser REST Call
  const systemInstruction = `Eres un Ingeniero Redactor Técnico Senior del Consorcio de Cogestión Venequip S.A.
Tu tarea es perfeccionar el siguiente texto técnico de la sección "${sectionName}".
Normas:
- Redacción impecable en voz pasiva/impersonal.
- Claridad técnica industrial de alto nivel (Caterpillar / Maquinaria Pesada).
- Mantener los datos reales sin inventar cifras.
- Retornar ÚNICAMENTE el texto perfeccionado sin introducciones ni etiquetas.`;

  const prompt = `Texto original a mejorar:
"${currentText}"

Contexto del equipo:
${context ? JSON.stringify(context) : 'Generador / Motor Caterpillar'}

Por favor reelabora este texto al estándar de informe técnico Venequip:`;

  const result = await callGeminiRestDirect([{ text: prompt }], systemInstruction);
  return result.trim();
}

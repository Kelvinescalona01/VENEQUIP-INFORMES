/**
 * Generates a crisp, high-resolution Base64 PNG data URL for the official
 * Consorcio de Cogestión Venequip corporate logo (RIF J404644865).
 * 
 * Matches the official provided branding image:
 * - Outer black frame with slight corner radius
 * - Top text: "CONSORCIO DE COGESTIÓN"
 * - Amber/Orange bracketed frame: [ Venequip ]
 * - Central heavy typography: "Venequip"
 * - Bottom RIF number: "J404644865"
 * 
 * This ensures Microsoft Word, PDF exporters, preview, and external HTML viewers
 * render the exact official logo with 100% crisp fidelity.
 */
export const getVenequipLogoDataUrl = (): string => {
  if (typeof document === 'undefined') return '';
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 560;
    canvas.height = 192;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // 1. Solid White Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Outer Black Frame
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 7;
    const pad = 6;
    const radius = 10;
    const w = canvas.width - pad * 2;
    const h = canvas.height - pad * 2;
    
    // Draw rounded outer rectangle
    ctx.beginPath();
    ctx.moveTo(pad + radius, pad);
    ctx.lineTo(pad + w - radius, pad);
    ctx.quadraticCurveTo(pad + w, pad, pad + w, pad + radius);
    ctx.lineTo(pad + w, pad + h - radius);
    ctx.quadraticCurveTo(pad + w, pad + h, pad + w - radius, pad + h);
    ctx.lineTo(pad + radius, pad + h);
    ctx.quadraticCurveTo(pad, pad + h, pad, pad + h - radius);
    ctx.lineTo(pad, pad + radius);
    ctx.quadraticCurveTo(pad, pad, pad + radius, pad);
    ctx.closePath();
    ctx.stroke();

    // 3. Top Header: CONSORCIO DE COGESTIÓN
    ctx.fillStyle = '#000000';
    ctx.font = '900 25px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CONSORCIO DE COGESTIÓN', canvas.width / 2, 34);

    // 4. Orange Continuous Border with Gap for 'V' (#E68000)
    const orangeLeft = 24;
    const orangeRight = canvas.width - 24;
    const orangeTop = 52;
    const orangeBottom = 136;
    const vGapStart = 62;
    const vGapEnd = 136;

    ctx.strokeStyle = '#E68000';
    ctx.lineWidth = 7;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';

    // 4a. Left segment (from left of V, around corner down to bottom)
    ctx.beginPath();
    ctx.moveTo(vGapStart, orangeTop);
    ctx.lineTo(orangeLeft, orangeTop);
    ctx.lineTo(orangeLeft, orangeBottom);
    ctx.stroke();

    // 4b. Main segment (from right edge of V across enequip, down right edge, and along the entire bottom)
    ctx.beginPath();
    ctx.moveTo(vGapEnd, orangeTop);
    ctx.lineTo(orangeRight, orangeTop);
    ctx.lineTo(orangeRight, orangeBottom);
    ctx.lineTo(orangeLeft, orangeBottom);
    ctx.stroke();

    // 5. Central Brand Typography: 'V' and 'enequip'
    // Capital 'V' that stands taller and crosses the top orange line
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = '900 96px "Arial Black", "Trebuchet MS", "Segoe UI Black", sans-serif';
    ctx.fillText('V', 60, 128);

    // Lowercase 'enequip' inside the orange frame
    ctx.font = '900 82px "Arial Black", "Trebuchet MS", "Segoe UI Black", sans-serif';
    ctx.fillText('enequip', 136, 124);

    // 6. Bottom RIF: J404644865
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 25px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    ctx.fillText('J404644865', canvas.width / 2, canvas.height - 25);

    return canvas.toDataURL('image/png');
  } catch (err) {
    console.error('Error generating Venequip logo data URL:', err);
    return '';
  }
};

/**
 * Creates a clean default handwritten-style PNG signature image on a solid white background.
 */
export const getDefaultSignatureDataUrl = (name: string): string => {
  if (typeof document === 'undefined') return '';
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Solid white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw stylized handwritten signature stroke
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Cursive stroke curve
    ctx.beginPath();
    ctx.moveTo(30, 60);
    ctx.bezierCurveTo(60, 20, 90, 80, 130, 45);
    ctx.bezierCurveTo(160, 20, 190, 75, 230, 40);
    ctx.bezierCurveTo(250, 20, 270, 70, 290, 50);
    ctx.stroke();

    // Underline flourish
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(25, 75);
    ctx.quadraticCurveTo(160, 90, 295, 70);
    ctx.stroke();

    return canvas.toDataURL('image/png');
  } catch (e) {
    return '';
  }
};

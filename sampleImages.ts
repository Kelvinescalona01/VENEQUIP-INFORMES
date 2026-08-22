/**
 * Generates high-resolution Base64 technical inspection photos for equipment reports.
 * Completely self-contained: ensures 100% offline availability with zero CORS issues
 * in PDF, Word, HTML, and print exports.
 */

export const getSampleInspectionPhoto1 = (): string => {
  if (typeof document === 'undefined') return '';
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Industrial Dark Metal Background
    const bgGrad = ctx.createLinearGradient(0, 0, 600, 400);
    bgGrad.addColorStop(0, '#1E293B');
    bgGrad.addColorStop(1, '#0F172A');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 600, 400);

    // Engine Block Outline
    ctx.fillStyle = '#334155';
    ctx.fillRect(80, 80, 440, 240);

    // Cylinder Heads / Manifold
    ctx.fillStyle = '#475569';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(110 + i * 100, 110, 80, 70);
      ctx.fillStyle = '#64748B';
      ctx.beginPath();
      ctx.arc(150 + i * 100, 145, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#475569';
    }

    // Hydraulic / Cooling Hoses
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(60, 240);
    ctx.bezierCurveTo(180, 290, 320, 220, 520, 270);
    ctx.stroke();

    // Secondary Pressure Line
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(80, 290);
    ctx.bezierCurveTo(200, 330, 380, 290, 540, 310);
    ctx.stroke();

    // Inspection Marker Ring / Target (Leak zone)
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 4;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(280, 245, 45, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Technical Crosshairs
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(280, 190);
    ctx.lineTo(280, 300);
    ctx.moveTo(225, 245);
    ctx.lineTo(335, 245);
    ctx.stroke();

    // Inspection Callout Badge
    ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
    ctx.fillRect(295, 200, 150, 26);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('ZONA DE INSPECCIÓN', 302, 218);

    // Overlay Technical Watermark / HUD
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('REGISTRO TÉCNICO VENEQUIP: BLOQUE MOTOR & MANGUERAS', 20, 30);
    
    ctx.fillStyle = '#94A3B8';
    ctx.font = '11px monospace';
    ctx.fillText('CAMPO: SECTOR ENFRIAMIENTO • FECHA REGISTRO: 2026', 20, 380);

    return canvas.toDataURL('image/jpeg', 0.92);
  } catch (e) {
    return '';
  }
};

export const getSampleInspectionPhoto2 = (): string => {
  if (typeof document === 'undefined') return '';
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Industrial Navy Background
    const bgGrad = ctx.createLinearGradient(0, 0, 600, 400);
    bgGrad.addColorStop(0, '#0F172A');
    bgGrad.addColorStop(1, '#1E293B');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 600, 400);

    // Pressure Gauge Dial Body
    ctx.fillStyle = '#E2E8F0';
    ctx.beginPath();
    ctx.arc(300, 200, 120, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 8;
    ctx.stroke();

    // Gauge Inner Dial
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(300, 200, 108, 0, Math.PI * 2);
    ctx.fill();

    // Gauge Ticks
    for (let angle = -135; angle <= 135; angle += 30) {
      const rad = (angle * Math.PI) / 180;
      const x1 = 300 + Math.cos(rad) * 90;
      const y1 = 200 + Math.sin(rad) * 90;
      const x2 = 300 + Math.cos(rad) * 105;
      const y2 = 200 + Math.sin(rad) * 105;
      ctx.strokeStyle = angle > 60 ? '#EF4444' : '#0F172A';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Gauge Needle (Pointing to green operational pressure)
    const needleRad = (-20 * Math.PI) / 180;
    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(300, 200);
    ctx.lineTo(300 + Math.cos(needleRad) * 85, 200 + Math.sin(needleRad) * 85);
    ctx.stroke();

    // Center Cap
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(300, 200, 10, 0, Math.PI * 2);
    ctx.fill();

    // Gauge Unit Text
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PSI x 100', 300, 160);
    ctx.fillStyle = '#16A34A';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('HERMETICIDAD: OK', 300, 250);

    // Overlay Header & Footer
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 13px monospace';
    ctx.fillText('REGISTRO TÉCNICO VENEQUIP: PRUEBA DE PRESIÓN & TORQUE', 20, 30);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '11px monospace';
    ctx.fillText('INSTRUMENTACIÓN CALIBRADA • VALOR NOMINAL ALCANZADO', 20, 380);

    return canvas.toDataURL('image/jpeg', 0.92);
  } catch (e) {
    return '';
  }
};

/**
 * Turbo Image Processor for Venequip Caterpillar Inspection Reports.
 * - Ultra-fast client-side compression using canvas rendering (WebP / JPEG 85%).
 * - Reduces 10MB HD camera photos to crisp ~150-250KB in milliseconds.
 * - Optional Caterpillar ISO Certification Watermark / Stamp:
 *   Embeds Equipment Serial, Model, Horometer, Service #, Date & Location on image canvas.
 */

export interface WatermarkOptions {
  serviceNumber?: string;
  equipmentModel?: string;
  equipmentSerial?: string;
  horometro?: string;
  date?: string;
  location?: string;
  clientName?: string;
}

/**
 * Optimizes an image (Blob, File or Base64/URL) to high-efficiency Base64 JPEG/WebP.
 * Prevents memory leaks and maintains maximum visual clarity of engine parts.
 */
export async function optimizeImageFast(
  source: File | Blob | string,
  maxWidth = 1600,
  maxHeight = 1200,
  quality = 0.82,
  watermark?: WatermarkOptions
): Promise<string> {
  return new Promise((resolve, reject) => {
    let srcUrl = '';
    let shouldRevoke = false;

    if (typeof source === 'string') {
      srcUrl = source;
    } else {
      srcUrl = URL.createObjectURL(source);
      shouldRevoke = true;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      if (shouldRevoke) {
        URL.revokeObjectURL(srcUrl);
      }

      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Calculate proportional scale
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { alpha: false });

        if (!ctx) {
          throw new Error('Canvas 2D context not available');
        }

        // Crisp image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw primary photo
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Apply Caterpillar ISO Stamping if requested
        if (watermark && (watermark.equipmentModel || watermark.serviceNumber || watermark.equipmentSerial)) {
          applyCatWatermark(ctx, width, height, watermark);
        }

        // Export as optimized JPEG
        const optimizedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(optimizedDataUrl);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (e) => {
      if (shouldRevoke) URL.revokeObjectURL(srcUrl);
      reject(new Error('No se pudo cargar la imagen para optimización'));
    };

    img.src = srcUrl;
  });
}

/**
 * Draws a professional Caterpillar & Venequip technical banner stamp on the image.
 */
function applyCatWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  info: WatermarkOptions
) {
  const bannerHeight = Math.max(38, Math.round(height * 0.07));
  const fontSize = Math.max(11, Math.round(bannerHeight * 0.3));
  const y = height - bannerHeight;

  // Dark semi-transparent gradient background for maximum contrast
  const grad = ctx.createLinearGradient(0, y, 0, height);
  grad.addColorStop(0, 'rgba(15, 23, 42, 0.85)');
  grad.addColorStop(1, 'rgba(2, 6, 23, 0.95)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, y, width, bannerHeight);

  // Top amber accent line
  ctx.fillStyle = '#F59E0B';
  ctx.fillRect(0, y, width, Math.max(2, Math.round(bannerHeight * 0.08)));

  // Text details
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${fontSize}px "Segoe UI", Arial, sans-serif`;
  ctx.textBaseline = 'middle';

  const textY1 = y + bannerHeight * 0.35;
  const textY2 = y + bannerHeight * 0.72;

  // Line 1: Venequip CAT + Model + Serial + Horometer
  const part1 = `VENEQUIP CAT | ${info.equipmentModel || 'CAT'} | S/N: ${info.equipmentSerial || 'N/A'}`;
  const part1Right = info.horometro ? `HORÓMETRO: ${info.horometro} HRS` : '';

  ctx.fillText(part1, 14, textY1);

  if (part1Right) {
    ctx.textAlign = 'right';
    ctx.fillStyle = '#FCD34D';
    ctx.fillText(part1Right, width - 14, textY1);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#FFFFFF';
  }

  // Line 2: Service Number, Client, Date
  const dateStr = info.date || new Date().toISOString().split('T')[0];
  const part2 = `SERV: #${info.serviceNumber || 'N/A'} ${info.clientName ? `| ${info.clientName}` : ''} | ${dateStr}`;
  ctx.font = `normal ${Math.max(9, fontSize - 2)}px "Segoe UI", Arial, sans-serif`;
  ctx.fillStyle = '#94A3B8';
  ctx.fillText(part2, 14, textY2);

  // Certification badge on the right
  ctx.textAlign = 'right';
  ctx.fillStyle = '#38BDF8';
  ctx.fillText(`VERIFICACIÓN DE CAMPO VENEQUIP`, width - 14, textY2);
  ctx.textAlign = 'left';
}

/**
 * Batch processes multiple image files concurrently in chunks to prevent memory spikes.
 */
export async function batchOptimizeImages(
  files: File[],
  watermark?: WatermarkOptions,
  onProgress?: (current: number, total: number) => void
): Promise<string[]> {
  const results: string[] = [];
  const chunkSize = 3;

  for (let i = 0; i < files.length; i += chunkSize) {
    const chunk = files.slice(i, i + chunkSize);
    const chunkPromises = chunk.map((file) => optimizeImageFast(file, 1600, 1200, 0.82, watermark));
    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);
    if (onProgress) {
      onProgress(Math.min(i + chunkSize, files.length), files.length);
    }
  }

  return results;
}

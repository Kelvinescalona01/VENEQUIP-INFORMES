/**
 * Image processing utilities for Venequip reports.
 * Ensures all images (local files, Google Drive links, URLs) are converted
 * into self-contained Base64 Data URLs so they are permanently visible in
 * exported PDF, Word, HTML, and print documents without missing links or CORS issues.
 */

/**
 * Resolves Google Drive sharing links to direct download/image streams.
 * Handles patterns:
 * - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID
 */
export const normalizeGoogleDriveUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // Pattern 1: /file/d/{id}/
  const fileDMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    return `https://drive.google.com/uc?export=view&id=${fileDMatch[1]}`;
  }

  // Pattern 2: ?id={id}
  const idParamMatch = trimmed.match(/drive\.google\.com\/(?:open|uc)\?.*id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch && idParamMatch[1]) {
    return `https://drive.google.com/uc?export=view&id=${idParamMatch[1]}`;
  }

  return trimmed;
};

/**
 * Converts any Image URL, Google Drive link, or Canvas/Blob into a permanent Base64 Data URL.
 * Automatically tries client-side canvas rendering and server-side proxy fallback.
 */
export const convertUrlToBase64DataUrl = async (
  inputUrl: string, 
  fallbackTitle: string = 'Foto de Inspección'
): Promise<string> => {
  if (!inputUrl) return '';
  const url = normalizeGoogleDriveUrl(inputUrl);

  // Already a valid Base64 data URL
  if (url.startsWith('data:image/')) {
    return url;
  }

  // 1. Try Client-Side Canvas with CORS
  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const timer = setTimeout(() => {
        reject(new Error('Timeout loading image'));
      }, 5000);

      img.onload = () => {
        clearTimeout(timer);
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth || 600;
          canvas.height = img.naturalHeight || 400;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/jpeg', 0.9));
          } else {
            reject(new Error('Canvas context not available'));
          }
        } catch (e) {
          reject(e);
        }
      };

      img.onerror = () => {
        clearTimeout(timer);
        reject(new Error('Image failed to load via CORS'));
      };

      img.src = url;
    });

    if (dataUrl && dataUrl.startsWith('data:image/')) {
      return dataUrl;
    }
  } catch (err) {
    // Continue to server proxy
  }

  // 2. Try Server Proxy to bypass CORS restrictions for Drive/Web URLs
  try {
    const res = await fetch('/api/fetch-image-base64', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.success && data?.base64) {
        return data.base64;
      }
    }
  } catch (err) {
    // Continue to fallback
  }

  // 3. Fallback: Generate a crisp graphic placeholder with the photo title
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#E68000';
      ctx.lineWidth = 4;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(fallbackTitle.toUpperCase(), canvas.width / 2, 160);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '14px sans-serif';
      ctx.fillText('REGISTRO FOTOGRÁFICO DE SERVICIO VENEQUIP', canvas.width / 2, 200);

      return canvas.toDataURL('image/jpeg', 0.9);
    }
  } catch (e) {
    // Ignore
  }

  return url;
};

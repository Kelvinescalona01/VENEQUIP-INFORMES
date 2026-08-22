import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Preloads all images inside an HTML element to ensure html2canvas captures them completely.
 */
const preloadElementImages = async (element: HTMLElement): Promise<void> => {
  const images = Array.from(element.querySelectorAll('img'));
  const promises = images.map((img) => {
    if (img.complete && img.naturalWidth !== 0) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      const timeout = setTimeout(() => resolve(), 3000); // 3s safety fallback
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

export const exportDocumentToPDF = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('No se encontró el elemento del documento para PDF.');
  }

  // Preload all signatures and images
  await preloadElementImages(element);

  // Give a small delay for DOM layout stabilization
  await new Promise((resolve) => setTimeout(resolve, 150));

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // High resolution crisp text rendering
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      imageTimeout: 15000,
      windowWidth: element.scrollWidth || 850
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    // Create A4 PDF portrait
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210 mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297 mm

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // Scale to fill page width
    const imgScaledWidth = pdfWidth;
    const imgScaledHeight = (imgHeight * pdfWidth) / imgWidth;

    let heightLeft = imgScaledHeight;
    let position = 0;

    // Page 1
    pdf.addImage(imgData, 'JPEG', 0, position, imgScaledWidth, imgScaledHeight);
    heightLeft -= pdfHeight;

    // Subsequent pages if long document
    while (heightLeft > 2) {
      position -= pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgScaledWidth, imgScaledHeight);
      heightLeft -= pdfHeight;
    }

    const finalName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    pdf.save(finalName);
  } catch (err: any) {
    console.error('Error en exportDocumentToPDF:', err);
    throw new Error(`Falló la generación del PDF: ${err.message || 'Error de renderizado'}`);
  }
};


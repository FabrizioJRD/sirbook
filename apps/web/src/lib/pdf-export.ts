import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { DigitalNotebook, NotebookPage } from '@/types/notebook-engine';

/**
 * Exporta el contenedor visual de la hoja de cuaderno activa a un archivo PDF descargable
 */
export async function exportCurrentSheetToPdf(
  sheetElement: HTMLElement,
  notebookTitle: string,
  pageNumber: number,
  pageFormat?: string
): Promise<void> {
  try {
    const canvas = await html2canvas(sheetElement, {
      scale: 2, // Calidad Retina / alta resolución
      useCORS: true,
      logging: false,
      backgroundColor: '#FAF8F2',
      ignoreElements: (element) => {
        // Ignorar botones de edición interactiva o menús flotantes
        return (
          element.classList.contains('group/cell') &&
          element.querySelector('button[title*="Dividir"]') !== null
        );
      },
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const formatNormalized = (pageFormat === 'infinite' ? 'a3' : pageFormat) || 'a4';
    const validFormats = ['a1', 'a2', 'a3', 'a4', 'letter', 'legal'];
    const chosenFormat = validFormats.includes(formatNormalized) ? formatNormalized : 'a4';

    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'mm',
      format: chosenFormat as any,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const ratio = canvas.width / canvas.height;
    let imgWidth = pdfWidth;
    let imgHeight = pdfWidth / ratio;

    if (imgHeight > pdfHeight) {
      imgHeight = pdfHeight;
      imgWidth = pdfHeight * ratio;
    }

    const xOffset = (pdfWidth - imgWidth) / 2;
    const yOffset = (pdfHeight - imgHeight) / 2;

    pdf.addImage(imgData, 'JPEG', xOffset, yOffset, imgWidth, imgHeight);
    const sanitizedTitle = notebookTitle.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_ -]/g, '').trim();
    pdf.save(`${sanitizedTitle || 'cuaderno'}-hoja-${pageNumber}.pdf`);
  } catch (error) {
    console.error('[PDF Export] Error al exportar hoja individual:', error);
    throw error;
  }
}

/**
 * Exporta todas las páginas del cuaderno en un único archivo PDF estructurado
 */
export async function exportFullNotebookToPdf(
  notebook: DigitalNotebook,
  activeSheetElement?: HTMLElement | null
): Promise<void> {
  try {
    const firstPageFormat = notebook.pages[0]?.pageFormat || 'a4';
    const formatNormalized = (firstPageFormat === 'infinite' ? 'a3' : firstPageFormat) || 'a4';
    const validFormats = ['a1', 'a2', 'a3', 'a4', 'letter', 'legal'];
    const chosenFormat = validFormats.includes(formatNormalized) ? formatNormalized : 'a4';

    const pdf = new jsPDF({
      orientation: notebook.orientation === 'horizontal' ? 'landscape' : 'portrait',
      unit: 'mm',
      format: chosenFormat as any,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // 1. Portada del Cuaderno
    pdf.setFillColor(notebook.coverColor || '#8C4A2F');
    pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');

    // Lomo de encuadernación
    pdf.setFillColor(20, 15, 10);
    pdf.rect(0, 0, 14, pdfHeight, 'F');

    // Título y Materia en la carátula
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(26);
    pdf.text(notebook.title, 26, 60, { maxWidth: pdfWidth - 45 });

    if (notebook.subject) {
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.text(notebook.subject.toUpperCase(), 26, 75);
    }

    if (notebook.description) {
      pdf.setFontSize(11);
      pdf.text(notebook.description, 26, 90, { maxWidth: pdfWidth - 45 });
    }

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'italic');
    pdf.text(`Sirbook · Cuaderno Inteligente · ${notebook.pages.length} páginas`, 26, pdfHeight - 20);

    // 2. Si hay hoja visible en DOM capturarla en alta fidelidad
    if (activeSheetElement) {
      const canvas = await html2canvas(activeSheetElement, {
        scale: 1.8,
        useCORS: true,
        logging: false,
        backgroundColor: '#FDFBF7',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      const ratio = canvas.width / canvas.height;
      let imgWidth = pdfWidth - 20;
      let imgHeight = (pdfWidth - 20) / ratio;

      if (imgHeight > pdfHeight - 20) {
        imgHeight = pdfHeight - 20;
        imgWidth = (pdfHeight - 20) * ratio;
      }

      pdf.addPage();
      pdf.setFillColor(239, 234, 226); // Fondo lino
      pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
      pdf.addImage(imgData, 'JPEG', (pdfWidth - imgWidth) / 2, (pdfHeight - imgHeight) / 2, imgWidth, imgHeight);
    }

    // 3. Páginas restantes del cuaderno con formateo vectorial limpio
    for (let i = 0; i < notebook.pages.length; i++) {
      // Si ya capturamos la página 0 visualmente y solo hay 1, no duplicar
      if (activeSheetElement && i === 0 && notebook.pages.length === 1) continue;

      const page = notebook.pages[i];
      const pageFormat = page.pageFormat || 'a4';
      const pgFormatNormalized = (pageFormat === 'infinite' ? 'a3' : pageFormat) || 'a4';
      const pgChosenFormat = validFormats.includes(pgFormatNormalized) ? pgFormatNormalized : 'a4';
      pdf.addPage(pgChosenFormat as any, notebook.orientation === 'horizontal' ? 'landscape' : 'portrait');
      pdf.setFillColor(253, 251, 247); // Marfil
      pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');

      // Borde de hoja de cuaderno
      pdf.setDrawColor(223, 216, 203);
      pdf.setLineWidth(0.5);
      pdf.rect(10, 10, pdfWidth - 20, pdfHeight - 20);

      // Cabecera de la hoja
      pdf.setTextColor(46, 40, 34);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.text(page.subjectTopic || `Hoja #${page.pageNumber}`, 18, 22);

      // Línea divisoria
      pdf.setDrawColor(216, 208, 192);
      pdf.line(18, 26, pdfWidth - 18, 26);

      // Contenido de los bloques
      let currentY = 36;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');

      const blocks: any[] = Object.values(page.blocks || {});
      for (const blk of blocks) {
        if (currentY > pdfHeight - 35) break;

        // Título del bloque
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.setTextColor(46, 40, 34);
        pdf.text(blk.title || 'Apunte', 18, currentY);
        currentY += 6;

        // Contenido
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(74, 66, 57);

        let bodyText = '';
        if (blk.type === 'concept') {
          bodyText = blk.content?.definicion_corta || '';
          if (Array.isArray(blk.content?.puntos_clave)) {
            bodyText += '\n• ' + blk.content.puntos_clave.join('\n• ');
          }
        } else if (blk.type === 'curiosity') {
          bodyText = `${blk.content?.cifra_destacada || ''} - ${blk.content?.explicacion || ''}`;
        } else if (typeof blk.content === 'string') {
          bodyText = blk.content;
        } else if (blk.content?.texto || blk.content?.markdown) {
          bodyText = blk.content.texto || blk.content.markdown;
        } else if (blk.type === 'graphic') {
          bodyText = `[Diagrama de Flujo / Mermaid]: ${blk.content?.titulo || blk.title}\n${blk.content?.descripcion_corta || ''}`;
        }

        const lines = pdf.splitTextToSize(bodyText, pdfWidth - 36);
        pdf.text(lines, 18, currentY);
        currentY += lines.length * 5 + 8;
      }

      // Pie de página
      pdf.setFontSize(8);
      pdf.setTextColor(140, 125, 105);
      pdf.text(`Sirbook · ${notebook.title}`, 18, pdfHeight - 14);
      pdf.text(`HOJA ${page.pageNumber} DE ${notebook.pages.length}`, pdfWidth - 38, pdfHeight - 14);
    }

    const sanitizedTitle = notebook.title.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_ -]/g, '').trim();
    pdf.save(`${sanitizedTitle || 'cuaderno'}.pdf`);
  } catch (err) {
    console.error('[PDF Export] Error al exportar cuaderno:', err);
    throw err;
  }
}

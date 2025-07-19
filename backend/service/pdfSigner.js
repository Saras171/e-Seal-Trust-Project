// Service to embed signature images or texts onto a PDF using pdf-lib
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fetch from 'node-fetch';

export async function signPdfWithSignatures({ originalPdfBuffer, signatures }) {
const pdfDoc = await PDFDocument.load(originalPdfBuffer, {
   ignoreEncryption: true // Allow processing encrypted PDFs
  });

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Loop through each signature and apply to the correct page and position
  for (const sig of signatures) {
    const page = pdfDoc.getPage(sig.page_number - 1);
    const { width, height } = page.getSize();

    // Convert normalized coordinates to absolute values
    const x = sig.x * width;
    const y = sig.y * height;

    const sigWidth = (sig.width || 0.2) * width;   // Scale width by page width (default 20%)
    const sigHeight = (sig.height || 0.1) * height; // Scale height by page height (default 10%)

    if (sig.signature_url) {
      // Fetch signature image from URL
      const imageBytes = await fetch(sig.signature_url).then(res => res.arrayBuffer());
      const ext = sig.signature_url.split('.').pop().toLowerCase();

      let image;
       // Embed image (JPG or PNG or JPEG)
      if (ext === 'jpg' || ext === 'jpeg') {
        image = await pdfDoc.embedJpg(imageBytes);
      } else {
        image = await pdfDoc.embedPng(imageBytes);
      }

      
      // Draw image on the page
      page.drawImage(image, {
        x,
        y,
        width: sigWidth,
        height: sigHeight,
      });
    } else {
        // Fallback: Add signer's name as text if image not available
      page.drawText(sig.name || 'Signed by user', {
        x,
        y,
        size: 12,
        font,
        color: rgb(0.1, 0.5, 0.1),  // Greenish color
      });
    }
  }

  
  // Return the modified PDF as a byte array
  return await pdfDoc.save();
}



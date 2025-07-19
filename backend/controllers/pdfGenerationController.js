// controllers/pdfGenerationController.js
import { signPdfWithSignatures } from '../service/pdfSigner.js';
import { supabase } from '../config/supabaseConfig.js';

// Controller to handle the final step in the document signing process
// Embeds signatures into the uploaded PDF and stores the final version
export const finalizePDF = async (req, res) => {
  try {
 // Ensure user is authenticated
    if (!req.user || !req.user.id) {
      console.error('❌ finalizePDF: no req.user');
      return res.status(401).json({ error: 'Unauthorized: No user context available' });
    }
  const userId = req.user.id;
    const { docId } = req.body;
    const pdfFile = req.file; // ✅ the uploaded PDF


  // Validate input
    if (!pdfFile || !docId) {
      return res.status(400).json({ error: "Missing file or document ID",  details: 'docId or pdf file missing' });
    }

    const originalPdfBuffer = pdfFile.buffer;

   
    // Fetch all saved signature positions for this document
    const { data: signatures, error: sigErr } = await supabase
      .from("signatures")
      .select("*")
      .eq("document_id", docId);

    if (sigErr || !signatures.length) {
      return res.status(400).json({ error: "No signatures to embed",   details: sigErr?.message || "Signatures missing", });
    }

    
    // Embed signatures onto the original PDF
    const finalPdfBytes = await signPdfWithSignatures({
      originalPdfBuffer,
      signatures,
    });

    const fileName = `signed_${Date.now()}.pdf`;

    // Upload finalized PDF to Supabase Storage
    const { error: uploadErr } = await supabase.storage
      .from("documents")
      .upload(`signed/${fileName}`, finalPdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadErr) throw uploadErr;

    // Get public URL of the uploaded signed PDF
    const { data: urlData, error: publicUrlError  } = supabase.storage
      .from("documents")
      .getPublicUrl(`signed/${fileName}`);

      if (publicUrlError || !urlData?.publicUrl) {
  return res.status(500).json({ error: 'Failed to retrieve final PDF URL', details: publicUrlError?.message });
}

// Store metadata in supabase 'documents' table
await supabase
  .from("documents")
  .insert([{
    user_id: userId,
    file_name: fileName,
    file_url: urlData.publicUrl,
    status: 'signed',
    created_at: new Date()
  }]);

    return res.status(200).json({
      message: "PDF finalized",
      finalUrl: urlData.publicUrl,
    });

  } catch (err) {
    console.error("❌ Finalize PDF Error:", err.message);
    res.status(500).json({ error: "Failed to finalize PDF", details: err.message });
  }
};



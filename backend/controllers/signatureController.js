import { supabase } from "../config/supabaseConfig.js";
import { saveSignature, getSignatures } from "../models/signature.model.js";


/**
 * Create a new signature entry in the DB
 * Types supported: typed, drawn, uploaded image
 */
export const createSignature = async (req, res) => {
  try {
    const {
      documentId, x, y, page_number,
      signature_url, name, font, color,
      width, height, type
    } = req.body;
    const signerId = req.user.id;

    const saved = await saveSignature({
      documentId, signerId, x, y, page_number,
      signature_url, name, font, color, width, height, type
    });

    res.status(201).json({ message: "Signature saved", signature: saved });
  } catch (err) {
    console.error("❌ Signature Save Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

//Fetch all signatures for a specific document ID
export const fetchSignatures = async (req, res) => {
  try {
    const { docId } = req.params;
    const signatures = await getSignatures(docId);
    res.json({ signatures });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update properties of an existing signature (position, size, style, etc.)
export const updateSignature = async (req, res) => {
  const { id } = req.params;
  const {
    x, y, width, height, name, font,
    color, signature_url, type, locked
  } = req.body;

  try {
    // Only update provided fields (preserve existing ones)
    const updateFields = {
      ...(x !== undefined && { x }),
      ...(y !== undefined && { y }),
      ...(width !== undefined && { width }),
      ...(height !== undefined && { height }),
      ...(name && { name }),
      ...(font && { font }),
      ...(color && { color }),
      ...(signature_url && { signature_url }),
      ...(type && { type }),
      ...(locked !== undefined && { locked }),
    };

    const { data, error } = await supabase
      .from("signatures")
      .update(updateFields)
      .eq("id", id)
      .select();

    if (error || !data || data.length === 0) {
      return res.status(404).json({ message: "Signature not found" });
    }

    res.status(200).json({ message: "Signature updated", signature: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a signature entry, and remove uploaded file from storage if applicable
export const deleteSignature = async (req, res) => {
  const { id } = req.params;

  try {
       // First fetch signature metadata
    const { data: signatureData, error: fetchError } = await supabase
      .from("signatures")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !signatureData) {
      return res.status(404).json({ message: "Signature not found" });
    }

    const { signature_url, type } = signatureData;

    // Remove file from Supabase Storage if it’s an image or drawn signature
    if ((type === 'drawn' || type === 'upload') && signature_url) {
      const filePath = decodeURIComponent(
        new URL(signature_url).pathname.split("/storage/v1/object/public/")[1]
      );

      const { error: storageErr } = await supabase
        .from("signatures")
        .remove([filePath]);

      if (storageErr) {
        console.warn("⚠️ Storage delete failed:", storageErr.message);
      }
    }

        // Delete signature metadata from DB
    const { error: deleteError } = await supabase
      .from("signatures")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    res.status(200).json({ message: "Signature deleted" });
  } catch (err) {
    console.error("❌ Delete Signature Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// Upload signature image file to Supabase Storage and save its metadata in DB
export const uploadSignatureImage = async (req, res) => {
  try {
      // Validate authentication
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userId = req.user.id;
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    // Generate unique file name
    const fileExt = file.originalname.split(".").pop();
    const fileName = `signatures/${userId}-${Date.now()}.${fileExt}`;

      // Upload image to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("signatures")
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      return res.status(500).json({ error: 'Upload to storage failed', details: uploadError.message });
    }

     // Get public URL for signature image
    const { data, error: publicUrlError } = supabase.storage
      .from("signatures")
      .getPublicUrl(fileName);

    if (publicUrlError || !data?.publicUrl) {
      return res.status(500).json({ error: 'Failed to retrieve public URL' });
    }

    const signature_url = data.publicUrl;

     // Validate signature metadata
    const {
      documentId, x, y, page_number,
      width = 160, height = 64,
      name = null, font = null,
      color = null, type = 'upload',
    } = req.body;

    if (!documentId || !x || !y || !page_number) {
      return res.status(400).json({ error: 'Missing required metadata' });
    }

    
    // Save signature record in the database
    const { data: inserted, error: insertError } = await supabase
      .from("signatures")
      .insert([{
        document_id: documentId,
        signer_id: userId,
        x: parseFloat(x),
        y: parseFloat(y),
        page_number: parseInt(page_number),
        width: parseInt(width),
        height: parseInt(height),
        font,
        color,
        name,
        signature_url,
        type,
      }])
      .select();

    if (insertError) {
      return res.status(500).json({ error: 'Failed to save signature to DB', details: insertError.message });
    }

    return res.status(200).json({
      message: 'Signature uploaded and saved',
      signature: inserted[0],
    });
  } catch (err) {
    console.error("❌ Server Error:", err.message);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
};

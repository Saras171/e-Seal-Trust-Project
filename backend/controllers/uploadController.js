import { supabase } from '../config/supabaseConfig.js';



//Upload a PDF document to Supabase storage and store metadata in the database
export const uploadDocument = async (req, res) => {
  try {
    const file = req.file;
    const userId = req.user?.id;

        // Ensure user is authenticated
    if (!userId) return res.status(401).json({ error: 'User authentication required' });

        // Ensure file is present
    if (!file) return res.status(400).json({ error: 'No file uploaded.' });

    const fileName = `${Date.now()}_${file.originalname}`;
    const bucket = 'documents';

    // Upload file buffer to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file.buffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      return res.status(500).json({
        error: 'Upload to Supabase Storage failed',
        details: uploadError.message,
      });
    }

        // Get public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);
    const fileUrl = publicUrlData.publicUrl;

      // Insert file metadata into Supabase DB
    const { data, error } = await supabase
      .from('documents')
      .insert([
        {
          user_id: userId,
          file_name: file.originalname,
          file_url: fileUrl,
          uploaded_at: new Date(),
          status: 'uploaded',
        },
      ])
      .select();

      
    // Rollback: remove file from storage if DB insert fails
    if (error) {
      await supabase.storage.from(bucket).remove([fileName]);
      return res.status(500).json({
        error: 'Database error while saving metadata',
        details: error.message,
      });
    }

        // Success response
    return res.status(200).json({
      message: 'PDF uploaded successfully',
      fileUrl,
      documentId: data[0]?.id,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};


//List documents of a specific user (excluding deleted ones if needed)
export const listDocuments = async (req, res) => {
  const { userId } = req.query;

  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('uploaded_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch documents', details: error.message });
  }

  return res.status(200).json({ documents: data });
};


 // Soft delete: mark a document as deleted (does not remove it from storage)
export const softDeleteDocument = async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('documents')
    .update({ deleted_at: new Date() })
    .eq('id', id);

  if (error) {
    return res.status(500).json({ error: 'Soft delete failed', details: error.message });
  }

  return res.status(200).json({ message: 'Document soft deleted successfully' });
};

//  Restore a previously soft-deleted document
export const restoreDocument = async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('documents')
    .update({ deleted_at: null })
    .eq('id', id);

  if (error) {
    return res.status(500).json({ error: 'Restore failed', details: error.message });
  }

  return res.status(200).json({ message: 'Document restored successfully' });
};

//  Permanently delete a document from both Supabase Storage and Database
export const deleteDocument = async (req, res) => {
  const { id } = req.params;

  const { data: docData, error: fetchErr } = await supabase
    .from('documents')
    .select('file_url')
    .eq('id', id)
    .single();

  if (fetchErr || !docData?.file_url) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const url = new URL(docData.file_url);
  const filePath = decodeURIComponent(url.pathname.split('/storage/v1/object/public/documents/')[1]);

  const { error: storageErr } = await supabase.storage
    .from('documents')
    .remove([filePath]);

  if (storageErr) {
    return res.status(500).json({ error: 'Failed to delete file from storage', details: storageErr.message });
  }

  const { error: deleteErr } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);

  if (deleteErr) {
    return res.status(500).json({ error: 'Failed to delete metadata', details: deleteErr.message });
  }

  return res.status(200).json({ message: 'Document permanently deleted' });
};

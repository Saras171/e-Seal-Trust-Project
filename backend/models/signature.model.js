import { supabase } from "../config/supabaseConfig.js";


/**
 * Save a new signature record in the database.
 * Can be typed, drawn, or image-based.
 */
export async function saveSignature({ documentId, signerId, x, y, page_number, signature_url=null,name = null,
  font = null,
  color = null, width = 160,
  height = 64, type = 'upload', locked = false }) {

  const { data, error } = await supabase
    .from("signatures")
    .insert([{ document_id: documentId, signer_id: signerId, x, y, page_number, signature_url,name,
        font,
        color, width,
        height, type,  locked,}])
    .select();
  if (error) throw error;
  return data[0];
}

//Retrieve all signatures associated with a given document ID
export async function getSignatures(documentId) {
  const { data, error } = await supabase
    .from("signatures")
    .select("*")
    .eq("document_id", documentId);
  if (error) throw error;
  return data;
}

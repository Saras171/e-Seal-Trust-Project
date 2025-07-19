import express from "express";
import {
  createSignature,
  fetchSignatures,
  updateSignature,
  deleteSignature,
  uploadSignatureImage
} from "../controllers/signatureController.js";
import imageUpload from "../middleware/imageUploadMulter.js";

const signatureRouter = express.Router();

signatureRouter.post("/", createSignature); // Create a new signature entry (typed, drawn, or uploaded)
signatureRouter.get("/:docId", fetchSignatures); // Get all signatures for a given document
signatureRouter.put("/:id", updateSignature); // Update signature properties like position, size, appearance
signatureRouter.delete("/:id", deleteSignature);  // Delete a signature 
signatureRouter.post("/upload-image", imageUpload.single("file"), uploadSignatureImage); // Upload an image signature (file) and save its metadata

export default signatureRouter;

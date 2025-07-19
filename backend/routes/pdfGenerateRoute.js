import express from 'express';
import { finalizePDF } from '../controllers/pdfGenerationController.js';
import upload from "../middleware/multer.js";

const pdfRouter = express.Router();

// Finalize a PDF by embedding collected signatures
// Expects: multipart/form-data with 'pdf' file and 'docId' in body
pdfRouter.post('/finalize',upload.single('pdf'), finalizePDF); 
export default pdfRouter;

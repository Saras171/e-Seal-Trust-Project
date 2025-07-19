import express from 'express';
import upload from '../middleware/multer.js';
import {
  uploadDocument,
  listDocuments,
  softDeleteDocument,
  restoreDocument,
  deleteDocument,
} from '../controllers/uploadController.js';

const uploadRouter = express.Router();

uploadRouter.post('/upload', upload.single('file'), uploadDocument); // Route for uploading a single PDF file
uploadRouter.get('/list', listDocuments); // Route to list all documents of a user
uploadRouter.put('/soft-delete/:id', softDeleteDocument); // Route to soft-delete a document (mark as deleted without removing from storage)
uploadRouter.put('/restore/:id', restoreDocument); // Route to restore a soft-deleted document
uploadRouter.delete('/permanent-delete/:id', deleteDocument); // Route to permanently delete a document (remove from both DB and storage)

export default uploadRouter;

// middleware/imageUploadMulter.js
import multer from 'multer';

// Use in-memory storage (file remains in memory buffer, not disk)
const memoryStorage = multer.memoryStorage();

// Multer configuration to accept files up to 5MB (used for signature uploads)
const imageUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

export default imageUpload;

import multer from 'multer';

const storage = multer.memoryStorage(); // Use in-memory storage to temporarily hold uploaded files before processing

// Only allow PDF files for upload
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

// Configure multer with max file size of 5MB and validation rule
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

export default upload;

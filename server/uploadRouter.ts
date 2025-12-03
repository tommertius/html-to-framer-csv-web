import { Router } from 'express';
import multer from 'multer';
import { storagePut } from './storage';

const router = Router();

// Configure multer to store files in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Sanitize filename to remove special characters and spaces
function sanitizeFilename(filename: string): string {
  // Get file extension
  const lastDot = filename.lastIndexOf('.');
  const name = lastDot !== -1 ? filename.substring(0, lastDot) : filename;
  const ext = lastDot !== -1 ? filename.substring(lastDot) : '';
  
  // Replace spaces with hyphens, remove special characters, keep only alphanumeric and hyphens
  const sanitized = name
    .toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, '')     // Remove all non-alphanumeric except hyphens
    .replace(/-+/g, '-')            // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '');         // Remove leading/trailing hyphens
  
  return sanitized + ext.toLowerCase();
}

// Handle file uploads
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    
    const file = req.file;
    const sanitizedName = sanitizeFilename(file.originalname);
    const fileKey = `uploads/${Date.now()}-${sanitizedName}`;
    
    // Upload to S3
    const { url } = await storagePut(
      fileKey,
      file.buffer,
      file.mimetype
    );
    
    res.json({ 
      url, 
      fileName: file.originalname 
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Upload failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

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

// Handle file uploads
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    
    const file = req.file;
    const fileKey = `uploads/${Date.now()}-${file.originalname}`;
    
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

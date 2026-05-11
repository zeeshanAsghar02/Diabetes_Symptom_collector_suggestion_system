import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { verifyAccessTokenMiddleware } from '../middlewares/authMiddleware.js';
import { superAdminMiddleware } from '../middlewares/superAdminMiddleware.js';
import {
    uploadDocument,
    getAllDocuments,
    getDocumentById,
    deleteDocument,
} from '../controllers/documentController.js';

const router = express.Router();

// Configure multer for file uploads
const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const originalFilesDir = path.join(uploadDir, 'original_files');

// Ensure upload directories exist
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(originalFilesDir)) {
    fs.mkdirSync(originalFilesDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, originalFilesDir);
    },
    filename: (req, file, cb) => {
        // Use timestamp + original filename to avoid conflicts
        const timestamp = Date.now();
        const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, `${timestamp}_${sanitizedFilename}`);
    },
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedExtensions = ['.pdf', '.docx', '.doc', '.txt', '.md', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`), false);
    }
};

// Configure multer
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max file size
    },
});

// Routes
// POST /api/v1/admin/docs/upload - Upload and ingest document (super_admin only)
router.post(
    '/upload',
    verifyAccessTokenMiddleware,
    superAdminMiddleware,
    upload.single('file'),
    uploadDocument
);

// GET /api/v1/admin/docs - Get all documents (super_admin only)
router.get(
    '/',
    verifyAccessTokenMiddleware,
    superAdminMiddleware,
    getAllDocuments
);

// GET /api/v1/admin/docs/:docId - Get document by ID (super_admin only)
router.get(
    '/:docId',
    verifyAccessTokenMiddleware,
    superAdminMiddleware,
    getDocumentById
);

// DELETE /api/v1/admin/docs/:docId - Delete document (super_admin only)
router.delete(
    '/:docId',
    verifyAccessTokenMiddleware,
    superAdminMiddleware,
    deleteDocument
);

export default router;

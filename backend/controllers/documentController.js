import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Document } from '../models/Document.js';
import {
    calculateChecksum,
    extractText,
    chunkText,
    saveTextToFile,
    isValidFileType,
    getFileExtension,
} from '../services/documentService.js';
import {
    generateEmbeddingsBatch,
    initializeEmbeddingModel,
} from '../services/embeddingService.js';
import {
    upsertChunks,
    initializeQdrantDB as initializeChromaDB,
} from '../services/qdrantService.js';

/**
 * Upload and ingest document
 * POST /api/v1/admin/docs/upload
 */
export const uploadDocument = async (req, res) => {
    let uploadedFilePath = null;
    let textFilePath = null;
    
    try {
        // Validate file upload
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded',
                code: 'FILE_MISSING',
            });
        }
        
        // Validate metadata
        const { title, source, country, doc_type, version, force } = req.body;
        
        if (!title || !source || !country || !doc_type) {
            // Clean up uploaded file
            if (req.file.path) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: title, source, country, doc_type',
                code: 'VALIDATION_ERROR',
            });
        }
        
        // Validate doc_type
        const validDocTypes = ['guideline', 'research_paper', 'diet_chart', 'exercise_recommendation', 'clinical_material', 'other'];
        if (!validDocTypes.includes(doc_type)) {
            if (req.file.path) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({
                success: false,
                message: `Invalid doc_type. Must be one of: ${validDocTypes.join(', ')}`,
                code: 'VALIDATION_ERROR',
            });
        }
        
        uploadedFilePath = req.file.path;
        const originalFilename = req.file.originalname;
        
        // Validate file type
        if (!isValidFileType(originalFilename)) {
            fs.unlinkSync(uploadedFilePath);
            return res.status(400).json({
                success: false,
                message: 'Invalid file type. Supported types: PDF, DOCX, DOC, TXT, MD, CSV',
                code: 'INVALID_FILE_TYPE',
            });
        }
        
        console.log(`Processing document upload: ${originalFilename}`);
        
        // Calculate checksum
        const checksum = await calculateChecksum(uploadedFilePath);
        console.log(`File checksum: ${checksum}`);
        
        // Check for duplicate
        const existingDoc = await Document.findOne({ checksum });
        if (existingDoc && force !== 'true') {
            fs.unlinkSync(uploadedFilePath);
            return res.status(409).json({
                success: false,
                message: 'Document already exists (duplicate checksum). Use force=true to override.',
                code: 'DUPLICATE_DOCUMENT',
                existing_doc_id: existingDoc.doc_id,
            });
        }
        
        // Generate unique document ID
        const docId = uuidv4();
        
        // Extract text from document
        console.log('Extracting text from document...');
        const fileExt = getFileExtension(originalFilename);
        const { text, pageCount } = await extractText(uploadedFilePath, fileExt);
        console.log(`Extracted ${text.length} characters, ${pageCount} pages`);
        
        // Save extracted text
        const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
        const textDir = path.join(uploadDir, 'extracted_text');
        textFilePath = path.join(textDir, `${docId}.txt`);
        await saveTextToFile(text, textFilePath);
        console.log(`Saved extracted text to: ${textFilePath}`);
        
        // Chunk text
        console.log('Chunking text...');
        const chunkSize = parseInt(process.env.CHUNK_SIZE || '350');
        const chunkOverlap = parseInt(process.env.CHUNK_OVERLAP || '80');
        const chunks = chunkText(text, chunkSize, chunkOverlap);
        console.log(`Created ${chunks.length} chunks`);
        
        // Initialize embedding model and ChromaDB
        await initializeEmbeddingModel();
        const chromaDbPath = process.env.CHROMA_DB_PATH || path.join(process.cwd(), 'chroma_db');
        await initializeChromaDB(chromaDbPath);
        
        // Generate embeddings for chunks
        console.log('Generating embeddings...');
        const chunkTexts = chunks.map(c => c.text);
        const embeddings = await generateEmbeddingsBatch(chunkTexts, 10);
        console.log(`Generated ${embeddings.length} embeddings`);
        
        // Prepare chunks for ChromaDB
        const chromaChunks = chunks.map((chunk, idx) => ({
            id: `${docId}_chunk_${chunk.index}`,
            text: chunk.text,
            embedding: embeddings[idx],
            metadata: {
                document_id: docId,
                chunk_index: chunk.index,
                title,
                source,
                country,
                doc_type,
                version: version || '1.0',
                original_filename: originalFilename,
                checksum,
                ingested_on: new Date().toISOString(),
                page_no: Math.floor(chunk.index / (chunks.length / pageCount)) + 1,
            },
        }));
        
        // Upsert chunks to ChromaDB
        console.log('Upserting chunks to ChromaDB...');
        await upsertChunks(chromaChunks);
        
        // Save document metadata to MongoDB
        const document = new Document({
            doc_id: docId,
            original_filename: originalFilename,
            checksum,
            title,
            source,
            country,
            doc_type,
            version: version || '1.0',
            original_path: uploadedFilePath,
            text_path: textFilePath,
            page_count: pageCount,
            chunk_count: chunks.length,
            ingested_by: req.user._id,
            ingested_on: new Date(),
            status: 'ingested',
        });
        
        await document.save();
        console.log(`Document saved to MongoDB with ID: ${docId}`);
        
        // Return success response
        return res.status(200).json({
            success: true,
            doc_id: docId,
            status: 'ingested',
            chunks_created: chunks.length,
            warnings: [],
            message: 'Document ingested successfully',
        });
        
    } catch (error) {
        console.error('Error uploading document:', error);
        
        // Clean up files on error
        if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
            try {
                fs.unlinkSync(uploadedFilePath);
            } catch (e) {
                console.error('Error deleting uploaded file:', e);
            }
        }
        if (textFilePath && fs.existsSync(textFilePath)) {
            try {
                fs.unlinkSync(textFilePath);
            } catch (e) {
                console.error('Error deleting text file:', e);
            }
        }
        
        // Handle OCR-required PDFs differently
        if (error.code === 'OCR_REQUIRED') {
            return res.status(400).json({
                success: false,
                message: 'Cannot process scanned PDF',
                error: error.message,
                code: 'OCR_REQUIRED',
                suggestion: 'Please convert this PDF to a text-searchable format using OCR software, or provide a different version of the document.',
            });
        }
        
        return res.status(500).json({
            success: false,
            message: 'Failed to ingest document',
            error: error.message,
            code: error.code || 'INGESTION_ERROR',
        });
    }
};

/**
 * Get all documents
 * GET /api/v1/admin/docs
 */
export const getAllDocuments = async (req, res) => {
    try {
        const documents = await Document.find()
            .populate('ingested_by', 'fullName email')
            .sort({ ingested_on: -1 });
        
        return res.status(200).json({
            success: true,
            count: documents.length,
            documents,
        });
    } catch (error) {
        console.error('Error fetching documents:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch documents',
            error: error.message,
        });
    }
};

/**
 * Get document by ID
 * GET /api/v1/admin/docs/:docId
 */
export const getDocumentById = async (req, res) => {
    try {
        const { docId } = req.params;
        
        const document = await Document.findOne({ doc_id: docId })
            .populate('ingested_by', 'fullName email');
        
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found',
                code: 'DOCUMENT_NOT_FOUND',
            });
        }
        
        return res.status(200).json({
            success: true,
            document,
        });
    } catch (error) {
        console.error('Error fetching document:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch document',
            error: error.message,
        });
    }
};

/**
 * Delete document
 * DELETE /api/v1/admin/docs/:docId
 */
export const deleteDocument = async (req, res) => {
    try {
        const { docId } = req.params;
        
        const document = await Document.findOne({ doc_id: docId });
        
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found',
                code: 'DOCUMENT_NOT_FOUND',
            });
        }
        
        // Delete from ChromaDB
        const { deleteDocumentChunks, initializeChromaDB } = await import('../services/chromaService.js');
        const chromaDbPath = process.env.CHROMA_DB_PATH || path.join(process.cwd(), 'chroma_db');
        await initializeChromaDB(chromaDbPath);
        await deleteDocumentChunks(docId);
        
        // Delete files
        if (fs.existsSync(document.original_path)) {
            fs.unlinkSync(document.original_path);
        }
        if (fs.existsSync(document.text_path)) {
            fs.unlinkSync(document.text_path);
        }
        
        // Delete from MongoDB
        await Document.deleteOne({ doc_id: docId });
        
        return res.status(200).json({
            success: true,
            message: 'Document deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting document:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete document',
            error: error.message,
        });
    }
};

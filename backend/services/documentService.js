import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mammoth from 'mammoth';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load pdf-parse using createRequire for CommonJS compatibility
const require = createRequire(import.meta.url);

// Lazy-load pdf-parse function
async function getPdfParser() {
    if (!getPdfParser._instance) {
        try {
            const pdfParseModule = require('pdf-parse');
            // pdf-parse exports as object, but version 2.x uses default export as function
            // Try multiple patterns: direct function, .default, or .PDFParse
            if (typeof pdfParseModule === 'function') {
                getPdfParser._instance = pdfParseModule;
            } else if (typeof pdfParseModule.default === 'function') {
                getPdfParser._instance = pdfParseModule.default;
            } else if (typeof pdfParseModule.PDFParse === 'function') {
                getPdfParser._instance = pdfParseModule.PDFParse;
            } else {
                // For pdf-parse v2.x, the module itself might be callable
                getPdfParser._instance = pdfParseModule;
            }
            console.log('✅ pdf-parse loaded successfully');
        } catch (err) {
            console.error('❌ Failed to load pdf-parse:', err);
            throw new Error('pdf-parse module could not be loaded');
        }
    }
    return getPdfParser._instance;
}

/**
 * Calculate SHA-256 checksum of a file
 * @param {string} filePath - Path to the file
 * @returns {Promise<string>} - Hex string of checksum
 */
export const calculateChecksum = async (filePath) => {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);
        
        stream.on('data', (data) => hash.update(data));
        stream.on('end', () => resolve(hash.digest('hex')));
        stream.on('error', (err) => reject(err));
    });
};

/**
 * Extract text from PDF file
 * @param {string} filePath - Path to PDF file
 * @returns {Promise<{text: string, pageCount: number}>}
 */
export const extractTextFromPDF = async (filePath) => {
    try {
        const pdfParse = await getPdfParser();
        const dataBuffer = fs.readFileSync(filePath);
        const originalWarn = console.warn;
        console.warn = (...args) => {
            const msg = args?.[0]?.toString?.() ?? '';
            if (msg.includes('Ran out of space in font private use area')) return;
            return originalWarn(...args);
        };

        let data;
        try {
            data = await pdfParse(dataBuffer);
        } finally {
            console.warn = originalWarn;
        }
        
        const text = data.text.trim();
        const pageCount = data.numpages;
        
        if (!text || text.length < 10) {
            const error = new Error('This PDF appears to be a scanned document (image-based) with no extractable text. Please use a PDF with selectable text, or convert this PDF using OCR tools first.');
            error.code = 'OCR_REQUIRED';
            throw error;
        }
        
        return {
            text: cleanText(text),
            pageCount,
        };
    } catch (error) {
        console.error('PDF extraction error:', error);
        throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
};

/**
 * Extract text from DOCX file
 * @param {string} filePath - Path to DOCX file
 * @returns {Promise<{text: string, pageCount: number}>}
 */
export const extractTextFromDOCX = async (filePath) => {
    try {
        const result = await mammoth.extractRawText({ path: filePath });
        const text = result.value.trim();
        
        if (!text || text.length < 10) {
            throw new Error('DOCX appears to be empty or contains no extractable text.');
        }
        
        // Estimate page count (rough estimate: 500 words per page)
        const wordCount = text.split(/\s+/).length;
        const pageCount = Math.ceil(wordCount / 500);
        
        return {
            text: cleanText(text),
            pageCount,
        };
    } catch (error) {
        console.error('DOCX extraction error:', error);
        throw new Error(`Failed to extract text from DOCX: ${error.message}`);
    }
};

/**
 * Extract text from TXT, MD, or CSV file
 * @param {string} filePath - Path to text file
 * @returns {Promise<{text: string, pageCount: number}>}
 */
export const extractTextFromPlainText = async (filePath) => {
    try {
        const text = fs.readFileSync(filePath, 'utf-8').trim();
        
        if (!text || text.length < 10) {
            throw new Error('File appears to be empty.');
        }
        
        // Estimate page count (rough estimate: 3000 characters per page)
        const pageCount = Math.ceil(text.length / 3000);
        
        return {
            text: cleanText(text),
            pageCount,
        };
    } catch (error) {
        console.error('Plain text extraction error:', error);
        throw new Error(`Failed to extract text from plain text file: ${error.message}`);
    }
};

/**
 * Clean extracted text - remove extra whitespace, special characters
 * @param {string} text - Raw text
 * @returns {string} - Cleaned text
 */
export const cleanText = (text) => {
    return text
        .replace(/\r\n/g, '\n') // Normalize line endings
        .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newline
        .replace(/\t/g, ' ') // Replace tabs with spaces
        .replace(/ {2,}/g, ' ') // Replace multiple spaces with single space
        .replace(/^\s+|\s+$/gm, '') // Trim each line
        .trim();
};

/**
 * Chunk text into smaller segments with overlap
 * @param {string} text - Text to chunk
 * @param {number} chunkSize - Target chunk size in tokens (approximated as words)
 * @param {number} overlap - Overlap size in tokens
 * @returns {Array<{text: string, index: number}>}
 */
export const chunkText = (text, chunkSize = 350, overlap = 80) => {
    // Split text into words (tokens approximation)
    const words = text.split(/\s+/);
    const chunks = [];
    let index = 0;
    
    for (let i = 0; i < words.length; i += (chunkSize - overlap)) {
        const chunk = words.slice(i, i + chunkSize).join(' ');
        if (chunk.trim().length > 0) {
            chunks.push({
                text: chunk.trim(),
                index: index++,
            });
        }
    }
    
    return chunks;
};

/**
 * Save extracted text to file
 * @param {string} text - Text to save
 * @param {string} outputPath - Path where text should be saved
 * @returns {Promise<void>}
 */
export const saveTextToFile = async (text, outputPath) => {
    try {
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(outputPath, text, 'utf-8');
    } catch (error) {
        console.error('Error saving text to file:', error);
        throw new Error(`Failed to save text: ${error.message}`);
    }
};

/**
 * Extract text from any supported file type
 * @param {string} filePath - Path to file
 * @param {string} fileType - File extension (pdf, docx, txt, md, csv)
 * @returns {Promise<{text: string, pageCount: number}>}
 */
export const extractText = async (filePath, fileType) => {
    const ext = fileType.toLowerCase().replace('.', '');
    
    switch (ext) {
        case 'pdf':
            return await extractTextFromPDF(filePath);
        case 'docx':
        case 'doc':
            return await extractTextFromDOCX(filePath);
        case 'txt':
        case 'md':
        case 'csv':
            return await extractTextFromPlainText(filePath);
        default:
            throw new Error(`Unsupported file type: ${fileType}`);
    }
};

/**
 * Validate file type
 * @param {string} filename - Original filename
 * @returns {boolean}
 */
export const isValidFileType = (filename) => {
    const validExtensions = ['.pdf', '.docx', '.doc', '.txt', '.md', '.csv'];
    const ext = path.extname(filename).toLowerCase();
    return validExtensions.includes(ext);
};

/**
 * Get file extension
 * @param {string} filename - Original filename
 * @returns {string}
 */
export const getFileExtension = (filename) => {
    return path.extname(filename).toLowerCase();
};

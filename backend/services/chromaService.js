import { ChromaClient } from 'chromadb';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Global ChromaDB client and collection
let chromaClient = null;
let collection = null;

/**
 * Resolve Chroma base URL from env or fallback.
 * Accepts CHROMA_DB_URL or legacy CHROMA_DB_PATH (if it looks like a URL).
 */
const resolveChromaBaseUrl = () => {
    const urlFromEnv = process.env.CHROMA_DB_URL || process.env.CHROMA_DB_PATH || '';
    if (/^https?:\/\//i.test(urlFromEnv)) {
        return urlFromEnv.trim();
    }
    // Default local server
    return 'http://127.0.0.1:8000';
};

/**
 * Initialize ChromaDB client and collection
 * @param {string} dbPath - Path to ChromaDB storage directory
 * @param {string} collectionName - Name of the collection
 * @returns {Promise<void>}
 */
export const initializeChromaDB = async (_legacyPathIgnored, collectionName = 'diabetes_docs') => {
    try {
        if (chromaClient && collection) {
            return; // already ready
        }

        const baseUrl = resolveChromaBaseUrl();
        console.log(`Initializing ChromaDB client (baseUrl=${baseUrl})...`);

        // NOTE: JS ChromaClient currently only supports HTTP server mode; no embedded persistence.
        chromaClient = new ChromaClient({ path: baseUrl });

        // Connectivity check: list collections (lightweight) or heartbeat if available.
        try {
            if (typeof chromaClient.listCollections === 'function') {
                await chromaClient.listCollections();
            } else if (typeof chromaClient.heartbeat === 'function') {
                await chromaClient.heartbeat();
            }
        } catch (connErr) {
            console.error('ChromaDB connectivity failed:', connErr.message);
            throw new Error(`Cannot reach ChromaDB server at ${baseUrl}. Start it with: python -m chromadb run --host 127.0.0.1 --port 8000 --path ./chroma_db`);
        }

        // Get or create collection WITHOUT embedding function (we provide embeddings ourselves)
        try {
            // Try to get existing collection first
            collection = await chromaClient.getCollection({ name: collectionName });
            console.log(`Retrieved existing collection '${collectionName}' with ${await collection.count()} chunks`);
        } catch (getErr) {
            // Collection doesn't exist, create it
            console.log(`Collection '${collectionName}' not found, creating new one...`);
            collection = await chromaClient.createCollection({
                name: collectionName,
                metadata: {
                    description: 'Diabetes-related documents for personalized suggestion system',
                    'hnsw:space': 'cosine',
                },
                embeddingFunction: undefined, // Explicitly no embedding function - we provide embeddings
            });
            console.log(`ChromaDB collection '${collectionName}' created.`);
        }
    } catch (error) {
        console.error('Failed to initialize ChromaDB:', error);
        throw new Error(`ChromaDB initialization failed: ${error.message}`);
    }
};

/**
 * Upsert document chunks into ChromaDB
 * @param {Array<Object>} chunks - Array of chunk objects with text, embeddings, and metadata
 * @returns {Promise<number>} - Number of chunks upserted
 */
export const upsertChunks = async (chunks) => {
    try {
        if (!collection) {
            throw new Error('ChromaDB collection not initialized. Ensure ChromaDB server is running and initializeChromaDB was called.');
        }
        
        if (!chunks || chunks.length === 0) {
            throw new Error('No chunks provided for upserting');
        }
        
        console.log(`Upserting ${chunks.length} chunks to ChromaDB...`);
        
        // Prepare data for ChromaDB
        const ids = chunks.map(chunk => chunk.id);
        const embeddings = chunks.map(chunk => chunk.embedding);
        const documents = chunks.map(chunk => chunk.text);
        const metadatas = chunks.map(chunk => chunk.metadata);
        
        // Validate data
        if (ids.length !== embeddings.length || ids.length !== documents.length || ids.length !== metadatas.length) {
            throw new Error('Mismatch in chunk data lengths');
        }
        
        // Upsert to ChromaDB
        await collection.upsert({
            ids,
            embeddings,
            documents,
            metadatas,
        });
        
        console.log(`Successfully upserted ${chunks.length} chunks to ChromaDB`);
        return chunks.length;
    } catch (error) {
        console.error('Error upserting chunks to ChromaDB:', error);
        throw new Error(`Failed to upsert chunks: ${error.message}`);
    }
};

/**
 * Query ChromaDB for similar chunks
 * @param {Array<number>} queryEmbedding - Query embedding vector
 * @param {number} nResults - Number of results to return
 * @param {Object} filter - Metadata filter
 * @returns {Promise<Object>} - Query results
 */
export const queryChunks = async (queryEmbedding, nResults = 5, filter = null) => {
    try {
        if (!collection) {
            throw new Error('ChromaDB collection not initialized. Ensure ChromaDB server is running and initializeChromaDB was called.');
        }
        
        const queryParams = {
            queryEmbeddings: [queryEmbedding],
            nResults,
        };
        
        if (filter) {
            // Handle multiple filter conditions with $and operator
            const filterKeys = Object.keys(filter);
            if (filterKeys.length > 1) {
                // Multiple conditions - use $and
                queryParams.where = {
                    $and: filterKeys.map(key => ({ [key]: filter[key] }))
                };
            } else {
                // Single condition - use directly
                queryParams.where = filter;
            }
        }
        
        const results = await collection.query(queryParams);
        return results;
    } catch (error) {
        console.error('Error querying ChromaDB:', error);
        throw new Error(`Failed to query chunks: ${error.message}`);
    }
};

/**
 * Delete document chunks from ChromaDB by document ID
 * @param {string} docId - Document ID
 * @returns {Promise<void>}
 */
export const deleteDocumentChunks = async (docId) => {
    try {
        if (!collection) {
            throw new Error('ChromaDB collection not initialized. Ensure ChromaDB server is running and initializeChromaDB was called.');
        }
        
        console.log(`Deleting chunks for document: ${docId}`);
        
        // Delete all chunks with matching document_id
        await collection.delete({
            where: { document_id: docId },
        });
        
        console.log(`Successfully deleted chunks for document: ${docId}`);
    } catch (error) {
        console.error('Error deleting chunks from ChromaDB:', error);
        throw new Error(`Failed to delete chunks: ${error.message}`);
    }
};

/**
 * Get collection statistics
 * @returns {Promise<Object>} - Collection stats
 */
export const getCollectionStats = async () => {
    try {
        if (!collection) {
            throw new Error('ChromaDB collection not initialized. Call initializeChromaDB first.');
        }
        
        const count = await collection.count();
        return {
            name: collection.name,
            count,
        };
    } catch (error) {
        console.error('Error getting collection stats:', error);
        throw new Error(`Failed to get collection stats: ${error.message}`);
    }
};

/**
 * Check if ChromaDB is initialized
 * @returns {boolean}
 */
export const isChromaDBInitialized = () => {
    return chromaClient !== null && collection !== null;
};

/**
 * Get the ChromaDB collection
 * @returns {Object} - ChromaDB collection
 */
export const getCollection = () => {
    if (!collection) {
        throw new Error('ChromaDB collection not initialized. Call initializeChromaDB first.');
    }
    return collection;
};

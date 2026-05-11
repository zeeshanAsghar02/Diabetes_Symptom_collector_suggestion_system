import { QdrantClient } from '@qdrant/js-client-rest';
import { v4 as uuidv4, v5 as uuidv5, validate as uuidValidate } from 'uuid';
import { getEmbeddingDimension } from './embeddingService.js';

// Global Qdrant client
let qdrantClient = null;
const DEFAULT_COLLECTION_NAME = 'diabetes_docs';

function normalizePointId(id) {
    if (typeof id === 'number' && Number.isInteger(id) && id >= 0) return id;
    if (typeof id === 'string' && id.trim().length > 0) {
        const trimmed = id.trim();
        if (uuidValidate(trimmed)) return trimmed;
        // Qdrant only accepts unsigned integers or UUIDs.
        // Use a deterministic UUID so reruns are idempotent.
        return uuidv5(trimmed, uuidv5.DNS);
    }
    return uuidv4();
}

function getQdrantUrl() {
    const url = process.env.QDRANT_URL;
    if (!url) {
        throw new Error('QDRANT_URL is not set. Create a new cluster at https://cloud.qdrant.io and set QDRANT_URL + QDRANT_API_KEY');
    }
    return url;
}

function getQdrantApiKey() {
    // API key is required for Qdrant Cloud. For local Qdrant, it can be omitted.
    return process.env.QDRANT_API_KEY || undefined;
}

function getCollectionName() {
    return process.env.QDRANT_COLLECTION || DEFAULT_COLLECTION_NAME;
}

function safeHost(url) {
    try {
        return new URL(url).host;
    } catch {
        return 'invalid-url';
    }
}

/**
 * Initialize Qdrant client and collection
 */
export const initializeQdrantDB = async () => {
    try {
        if (qdrantClient) return qdrantClient;

        const url = getQdrantUrl();
        const apiKey = getQdrantApiKey();
        const collectionName = getCollectionName();
        const vectorSize = Number.parseInt(process.env.QDRANT_VECTOR_SIZE || String(getEmbeddingDimension()), 10);

        console.log(`Initializing Qdrant client (host=${safeHost(url)}, collection=${collectionName}, dim=${vectorSize})...`);
        
        qdrantClient = new QdrantClient({
            url: url,
            apiKey: apiKey,
        });

        // Check if collection exists
        const collections = await qdrantClient.getCollections();
        const exists = collections.collections.some(c => c.name === collectionName);

        if (!exists) {
            console.log(`Collection '${collectionName}' not found, creating new one (${vectorSize}D, Cosine)...`);
            await qdrantClient.createCollection(collectionName, {
                vectors: {
                    size: vectorSize,
                    distance: 'Cosine',
                },
            });
            console.log(`Qdrant collection '${collectionName}' created.`);
        } else {
            console.log(`Connected to existing Qdrant collection '${collectionName}'`);
        }

        // Ensure payload indexes exist for filterable fields.
        // Qdrant REQUIRES keyword indexes before any filter query works.
        // These calls are idempotent — safe to run every startup.
        const indexFields = ['country', 'doc_type', 'documentId', 'document_id', 'title', 'source'];
        for (const field of indexFields) {
            try {
                await qdrantClient.createPayloadIndex(collectionName, {
                    field_name: field,
                    field_schema: 'keyword',
                    wait: true,
                });
                console.log(`   ✅ Payload index ensured: "${field}"`);
            } catch (idxErr) {
                // Ignore "already exists" errors; log others
                if (!idxErr.message?.includes('already exists') && idxErr.status !== 400) {
                    console.warn(`   ⚠️  Could not create index for "${field}":`, idxErr.message);
                }
            }
        }
        console.log('✅ Qdrant payload indexes verified.');

        return qdrantClient;
    } catch (error) {
        console.error('Failed to initialize Qdrant:', error);
        throw new Error(`Qdrant initialization failed: ${error.message}`);
    }
};

/**
 * Upsert document chunks into Qdrant
 * @param {Array<Object>} chunks - Array of chunk objects with text, embeddings, and metadata
 */
export const upsertChunks = async (chunks) => {
    try {
        await initializeQdrantDB();
        const collectionName = getCollectionName();
        
        if (!chunks || chunks.length === 0) return 0;
        
        console.log(`Upserting ${chunks.length} chunks to Qdrant in batches of 50...`);
        
        const batchSize = 50;
        for (let i = 0; i < chunks.length; i += batchSize) {
            const batch = chunks.slice(i, i + batchSize);
            const points = batch.map(chunk => ({
                id: normalizePointId(chunk.id),
                vector: chunk.embedding,
                payload: {
                    text: chunk.text,
                    ...chunk.metadata
                }
            }));

            await qdrantClient.upsert(collectionName, {
                wait: true,
                points: points
            });
            console.log(`   Uploaded points ${i + 1} to ${Math.min(i + batchSize, chunks.length)}`);
        }

        return chunks.length;
    } catch (error) {
        console.error('Error upserting to Qdrant:', error);
        throw error;
    }
};

/**
 * Query Qdrant for similar chunks
 * @param {Array<number>} queryEmbedding - Query vector
 * @param {number} topK - Number of results
 * @param {Object} filter - Metadata filters
 */
export const queryChunks = async (queryEmbedding, topK = 5, filter = null) => {
    try {
        await initializeQdrantDB();
        const collectionName = getCollectionName();
        
        console.log(`Searching Qdrant (topK=${topK})...`);

        // Convert common MongoDB-style filters to Qdrant filters if needed (basic implementation)
        const qdrantFilter = filter ? formatFilter(filter) : undefined;

        const results = await qdrantClient.search(collectionName, {
            vector: queryEmbedding,
            limit: topK,
            filter: qdrantFilter,
            with_payload: true,
            with_vector: false
        });

        // Format results to match what the rest of the app expects (same as Chroma)
        return {
            ids: [results.map(r => r.id)],
            distances: [results.map(r => 1 - r.score)], // Qdrant score is similarity, Chroma uses distance
            metadatas: [results.map(r => r.payload)],
            documents: [results.map(r => r.payload.text)]
        };
    } catch (error) {
        console.error('Error querying Qdrant:', error);
        throw error;
    }
};

/**
 * Delete documents by metadata filter
 */
export const deleteDocumentChunks = async (documentId) => {
    try {
        await initializeQdrantDB();
        const collectionName = getCollectionName();
        console.log(`Deleting chunks for document: ${documentId}`);
        
        await qdrantClient.delete(collectionName, {
            filter: {
                should: [
                    { key: 'documentId', match: { value: documentId } },
                    { key: 'document_id', match: { value: documentId } },
                ],
            }
        });
    } catch (error) {
        console.error('Error deleting from Qdrant:', error);
        throw error;
    }
};

/**
 * Get collection statistics
 */
export const getStats = async () => {
    try {
        await initializeQdrantDB();
        const collectionInfo = await qdrantClient.getCollection(getCollectionName());
        return {
            count: collectionInfo.points_count,
            status: collectionInfo.status
        };
    } catch (error) {
        console.error('Error getting Qdrant stats:', error);
        return { count: 0, status: 'error' };
    }
};

/**
 * Check if at least one point exists for a given document id.
 * This is used to skip re-embedding documents on ingestion reruns.
 */
export const hasAnyPointForDocument = async (documentId) => {
    try {
        await initializeQdrantDB();
        const collectionName = getCollectionName();
        const page = await qdrantClient.scroll(collectionName, {
            limit: 1,
            with_payload: false,
            with_vector: false,
            filter: {
                should: [
                    { key: 'documentId', match: { value: documentId } },
                    { key: 'document_id', match: { value: documentId } },
                ],
            },
        });
        return (page.points || []).length > 0;
    } catch (error) {
        console.warn('Qdrant document existence check failed:', error?.message || error);
        return false;
    }
};

/**
 * Convert MongoDB-style filter to Qdrant native filter format.
 * Supports: $and, $or, $in, and plain equality { key: value }.
 */
function formatFilter(filter) {
    if (!filter || typeof filter !== 'object') return undefined;

    // $and → must
    if (filter.$and) {
        const must = filter.$and.map(f => formatFilter(f)).filter(Boolean);
        return must.length > 0 ? { must } : undefined;
    }

    // $or → should
    if (filter.$or) {
        const should = filter.$or.map(f => formatFilter(f)).filter(Boolean);
        return should.length > 0 ? { should } : undefined;
    }

    // Plain field conditions
    const must = [];
    for (const [key, value] of Object.entries(filter)) {
        if (value === null || value === undefined) continue;

        if (typeof value === 'object' && value.$in) {
            // { field: { $in: [...] } }
            must.push({ key, match: { any: value.$in } });
        } else if (typeof value !== 'object') {
            // { field: 'value' }
            must.push({ key, match: { value } });
        }
    }

    return must.length > 0 ? { must } : undefined;
}

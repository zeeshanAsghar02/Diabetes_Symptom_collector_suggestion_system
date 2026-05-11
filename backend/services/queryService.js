import { generateEmbedding, initializeEmbeddingModel } from './embeddingService.js';
import { queryChunks, initializeQdrantDB } from './qdrantService.js';
import { Document } from '../models/Document.js';
import path from 'path';

/**
 * Process a natural language query and retrieve relevant chunks
 * @param {string} query - Natural language query
 * @param {Object} options - Query options
 * @param {number} options.topK - Number of results to return (default: 5)
 * @param {Object} options.filter - Metadata filters (e.g., { country: 'Pakistan', doc_type: 'guideline' })
 * @param {number} options.minScore - Minimum similarity score threshold (0-1, default: 0.0)
 * @returns {Promise<Object>} - Query results with chunks and metadata
 */
export const processQuery = async (query, options = {}) => {
    try {
        // Validate query
        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            throw new Error('Query must be a non-empty string');
        }

        const {
            topK = 5,
            filter = null,
            minScore = 0.0,
        } = options;

        console.log(`\n=== Processing Query ===`);
        console.log(`Query: "${query}"`);
        console.log(`Top K: ${topK}`);
        console.log(`Filter: ${filter ? JSON.stringify(filter) : 'None'}`);
        console.log(`Min Score: ${minScore}`);

        // Initialize services if needed
        await initializeEmbeddingModel();
        await initializeQdrantDB();

        // Preprocess query (basic cleaning)
        const cleanedQuery = preprocessQuery(query);
        console.log(`Cleaned Query: "${cleanedQuery}"`);

        // Generate embedding for query
        console.log('Generating query embedding...');
        const queryEmbedding = await generateEmbedding(cleanedQuery);
        console.log(`Query embedding generated (${queryEmbedding.length}D)`);

        // Query Qdrant Cloud
        console.log('Searching Qdrant Cloud...');
        const chromaResults = await queryChunks(queryEmbedding, topK, filter);

        // Parse and enrich results
        const results = await parseChromaResults(chromaResults, minScore);
        
        console.log(`Retrieved ${results.length} relevant chunks (after filtering)`);
        console.log(`=== Query Processing Complete ===\n`);

        return {
            query: query,
            cleaned_query: cleanedQuery,
            total_results: results.length,
            results: results,
            filters_applied: filter,
            timestamp: new Date().toISOString(),
        };

    } catch (error) {
        console.error('Error processing query:', error);
        throw new Error(`Query processing failed: ${error.message}`);
    }
};

/**
 * Preprocess query text (cleaning, normalization)
 * @param {string} query - Raw query string
 * @returns {string} - Cleaned query
 */
const preprocessQuery = (query) => {
    // Basic preprocessing
    let cleaned = query.trim();
    
    // Remove extra whitespace
    cleaned = cleaned.replace(/\s+/g, ' ');
    
    // Remove special characters that might interfere (keep alphanumeric, spaces, and basic punctuation)
    cleaned = cleaned.replace(/[^\w\s\-.,?!]/g, '');
    
    // Convert to lowercase for consistency (optional - depends on embedding model)
    // For all-MiniLM-L6-v2, case doesn't matter much but keeping original for now
    
    return cleaned;
};

/**
 * Parse ChromaDB results and enrich with metadata
 * @param {Object} chromaResults - Raw results from ChromaDB
 * @param {number} minScore - Minimum similarity score threshold
 * @returns {Promise<Array>} - Enriched results array
 */
const parseChromaResults = async (chromaResults, minScore = 0.0) => {
    try {
        const enrichedResults = [];

        if (!chromaResults || !chromaResults.ids || chromaResults.ids.length === 0) {
            console.warn('No results returned from ChromaDB');
            return enrichedResults;
        }

        // ChromaDB returns arrays of arrays (one array per query)
        const ids = chromaResults.ids[0] || [];
        const distances = chromaResults.distances[0] || [];
        const documents = chromaResults.documents[0] || [];
        const metadatas = chromaResults.metadatas[0] || [];

        console.log(`Parsing ${ids.length} raw results from ChromaDB...`);

        for (let i = 0; i < ids.length; i++) {
            const distance = distances[i];
            
            // Convert distance to similarity score (for cosine distance: similarity = 1 - distance)
            // ChromaDB with cosine distance returns values where smaller = more similar
            const similarityScore = 1 - distance;

            // Apply minimum score threshold
            if (similarityScore < minScore) {
                console.log(`Skipping result ${i + 1}: score ${similarityScore.toFixed(4)} below threshold ${minScore}`);
                continue;
            }

            const metadata = metadatas[i] || {};
            const chunkText = documents[i] || '';

            // Enrich with document information if available
            let documentInfo = null;
            if (metadata.documentId || metadata.document_id) {
                try {
                    documentInfo = await Document.findOne({ doc_id: metadata.documentId || metadata.document_id })
                        .select('title source country doc_type version page_count')
                        .lean();
                } catch (err) {
                    console.warn(`Could not fetch document info for ${metadata.document_id}:`, err.message);
                }
            }

            enrichedResults.push({
                rank: i + 1,
                chunk_id: ids[i],
                similarity_score: parseFloat(similarityScore.toFixed(4)),
                distance: parseFloat(distance.toFixed(4)),
                text: chunkText,
                text_preview: chunkText.substring(0, 200) + (chunkText.length > 200 ? '...' : ''),
                chunk_metadata: {
                    document_id: metadata.documentId || metadata.document_id,
                    chunk_index: metadata.chunk_index,
                    page_no: metadata.page_no,
                    title: metadata.title,
                    source: metadata.source,
                    country: metadata.country,
                    doc_type: metadata.doc_type,
                    version: metadata.version,
                    original_filename: metadata.original_filename,
                },
                document_info: documentInfo,
            });
        }

        return enrichedResults;

    } catch (error) {
        console.error('Error parsing ChromaDB results:', error);
        throw new Error(`Failed to parse results: ${error.message}`);
    }
};

/**
 * Get query suggestions based on common diabetes topics
 * @returns {Array<Object>} - Array of suggested queries with categories
 */
export const getQuerySuggestions = () => {
    return [
        {
            category: 'Diet & Nutrition',
            queries: [
                'What foods should diabetic patients eat?',
                'Low glycemic index foods for diabetes',
                'Meal planning for diabetes management',
                'Foods to avoid with diabetes',
                'Diabetic diet during Ramadan',
            ],
        },
        {
            category: 'Exercise & Physical Activity',
            queries: [
                'Exercise recommendations for diabetic patients',
                'Physical activity guidelines for diabetes',
                'Safe exercises for diabetes management',
                'How much exercise for diabetes control?',
            ],
        },
        {
            category: 'Medication & Treatment',
            queries: [
                'Insulin management for diabetes',
                'Oral medications for type 2 diabetes',
                'Blood glucose monitoring guidelines',
                'HbA1c targets for diabetes control',
            ],
        },
        {
            category: 'Complications & Prevention',
            queries: [
                'Preventing diabetic complications',
                'Diabetic neuropathy management',
                'Cardiovascular risk in diabetes',
                'Diabetic foot care guidelines',
            ],
        },
        {
            category: 'Screening & Diagnosis',
            queries: [
                'Diabetes screening guidelines',
                'Diagnostic criteria for diabetes',
                'Prediabetes diagnosis and management',
                'Type 1 vs Type 2 diabetes differences',
            ],
        },
    ];
};

/**
 * Batch process multiple queries
 * @param {Array<string>} queries - Array of query strings
 * @param {Object} options - Query options (same as processQuery)
 * @returns {Promise<Array<Object>>} - Array of query results
 */
export const batchProcessQueries = async (queries, options = {}) => {
    try {
        if (!Array.isArray(queries) || queries.length === 0) {
            throw new Error('Queries must be a non-empty array');
        }

        console.log(`\n=== Batch Processing ${queries.length} Queries ===`);

        const results = [];
        for (let i = 0; i < queries.length; i++) {
            console.log(`\nProcessing query ${i + 1}/${queries.length}...`);
            try {
                const result = await processQuery(queries[i], options);
                results.push(result);
            } catch (error) {
                console.error(`Error processing query ${i + 1}:`, error.message);
                results.push({
                    query: queries[i],
                    error: error.message,
                    total_results: 0,
                    results: [],
                });
            }
        }

        console.log(`=== Batch Processing Complete ===\n`);
        return results;

    } catch (error) {
        console.error('Error in batch processing:', error);
        throw new Error(`Batch query processing failed: ${error.message}`);
    }
};

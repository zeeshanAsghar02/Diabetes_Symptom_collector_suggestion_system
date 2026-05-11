import { processQuery, getQuerySuggestions, batchProcessQueries } from '../services/queryService.js';

/**
 * Query documents by natural language
 * POST /api/v1/query
 * Body: { query, topK, filter, minScore }
 */
export const queryDocuments = async (req, res) => {
    try {
        const { query, topK, filter, minScore } = req.body;

        // Validate query
        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Query is required and must be a non-empty string',
                code: 'INVALID_QUERY',
            });
        }

        // Validate topK if provided
        if (topK !== undefined) {
            const topKNum = parseInt(topK);
            if (isNaN(topKNum) || topKNum < 1 || topKNum > 50) {
                return res.status(400).json({
                    success: false,
                    message: 'topK must be a number between 1 and 50',
                    code: 'INVALID_TOP_K',
                });
            }
        }

        // Validate minScore if provided
        if (minScore !== undefined) {
            const minScoreNum = parseFloat(minScore);
            if (isNaN(minScoreNum) || minScoreNum < 0 || minScoreNum > 1) {
                return res.status(400).json({
                    success: false,
                    message: 'minScore must be a number between 0 and 1',
                    code: 'INVALID_MIN_SCORE',
                });
            }
        }

        console.log(`\n[Query API] Received query: "${query}"`);
        console.log(`[Query API] Options: topK=${topK || 5}, filter=${filter ? JSON.stringify(filter) : 'none'}, minScore=${minScore || 0.0}`);

        // Process query
        const results = await processQuery(query, {
            topK: topK ? parseInt(topK) : 5,
            filter: filter || null,
            minScore: minScore ? parseFloat(minScore) : 0.0,
        });

        console.log(`[Query API] Retrieved ${results.total_results} results`);

        // Check if results are empty
        if (results.total_results === 0) {
            return res.status(200).json({
                success: true,
                message: 'No relevant results found. Try adjusting your query or filters.',
                data: results,
            });
        }

        return res.status(200).json({
            success: true,
            message: `Found ${results.total_results} relevant chunks`,
            data: results,
        });

    } catch (error) {
        console.error('[Query API] Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to process query',
            error: error.message,
            code: 'QUERY_ERROR',
        });
    }
};

/**
 * Batch query documents
 * POST /api/v1/query/batch
 * Body: { queries: [], topK, filter, minScore }
 */
export const batchQuery = async (req, res) => {
    try {
        const { queries, topK, filter, minScore } = req.body;

        // Validate queries
        if (!queries || !Array.isArray(queries) || queries.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Queries must be a non-empty array',
                code: 'INVALID_QUERIES',
            });
        }

        if (queries.length > 20) {
            return res.status(400).json({
                success: false,
                message: 'Maximum 20 queries allowed per batch',
                code: 'TOO_MANY_QUERIES',
            });
        }

        // Validate each query
        for (let i = 0; i < queries.length; i++) {
            if (!queries[i] || typeof queries[i] !== 'string' || queries[i].trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: `Query at index ${i} is invalid`,
                    code: 'INVALID_QUERY',
                });
            }
        }

        console.log(`\n[Batch Query API] Received ${queries.length} queries`);

        // Process queries
        const results = await batchProcessQueries(queries, {
            topK: topK ? parseInt(topK) : 5,
            filter: filter || null,
            minScore: minScore ? parseFloat(minScore) : 0.0,
        });

        console.log(`[Batch Query API] Processed ${results.length} queries`);

        return res.status(200).json({
            success: true,
            message: `Processed ${results.length} queries`,
            data: {
                total_queries: results.length,
                results: results,
            },
        });

    } catch (error) {
        console.error('[Batch Query API] Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to process batch queries',
            error: error.message,
            code: 'BATCH_QUERY_ERROR',
        });
    }
};

/**
 * Get query suggestions
 * GET /api/v1/query/suggestions
 */
export const getSuggestions = async (req, res) => {
    try {
        const suggestions = getQuerySuggestions();

        return res.status(200).json({
            success: true,
            message: 'Query suggestions retrieved successfully',
            data: {
                total_categories: suggestions.length,
                suggestions: suggestions,
            },
        });

    } catch (error) {
        console.error('[Suggestions API] Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get suggestions',
            error: error.message,
            code: 'SUGGESTIONS_ERROR',
        });
    }
};

/**
 * Get query statistics
 * GET /api/v1/query/stats
 */
export const getQueryStats = async (req, res) => {
    try {
        const { Document } = await import('../models/Document.js');

        const ragEnabled = process.env.RAG_ENABLED === 'true';

        // Only attempt Qdrant stats when RAG is enabled.
        // This avoids confusing "status=error" when running without RAG.
        let qdrantStats = { count: null, status: ragEnabled ? 'unknown' : 'disabled' };
        if (ragEnabled) {
            // Import here to avoid circular dependency
            const { getStats } = await import('../services/qdrantService.js');
            qdrantStats = await getStats();
        }

        // Get document counts
        const totalDocuments = await Document.countDocuments();
        const documentsByType = await Document.aggregate([
            { $group: { _id: '$doc_type', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);
        const documentsByCountry = await Document.aggregate([
            { $group: { _id: '$country', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);

        return res.status(200).json({
            success: true,
            message: 'Query statistics retrieved successfully',
            data: {
                // Keep the old key for backward compatibility with any dashboards
                chroma_stats: {
                    provider: 'qdrant',
                    ...qdrantStats,
                },
                documents: {
                    total: totalDocuments,
                    by_type: documentsByType,
                    by_country: documentsByCountry,
                },
            },
        });

    } catch (error) {
        console.error('[Query Stats API] Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get query statistics',
            error: error.message,
            code: 'STATS_ERROR',
        });
    }
};

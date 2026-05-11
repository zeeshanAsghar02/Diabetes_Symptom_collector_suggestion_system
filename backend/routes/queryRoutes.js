import express from 'express';
import { 
    queryDocuments, 
    batchQuery, 
    getSuggestions,
    getQueryStats,
} from '../controllers/queryController.js';

const router = express.Router();

/**
 * Query documents by natural language
 * POST /api/v1/query
 * Body: { query: string, topK?: number, filter?: object, minScore?: number }
 * 
 * Example:
 * {
 *   "query": "What is the best diet for diabetic patients?",
 *   "topK": 5,
 *   "filter": { "country": "Pakistan" },
 *   "minScore": 0.5
 * }
 */
router.post('/', queryDocuments);

/**
 * Batch query documents
 * POST /api/v1/query/batch
 * Body: { queries: string[], topK?: number, filter?: object, minScore?: number }
 * 
 * Example:
 * {
 *   "queries": [
 *     "What foods should diabetics avoid?",
 *     "Exercise recommendations for diabetes"
 *   ],
 *   "topK": 3
 * }
 */
router.post('/batch', batchQuery);

/**
 * Get query suggestions
 * GET /api/v1/query/suggestions
 * 
 * Returns categorized list of common diabetes-related queries
 */
router.get('/suggestions', getSuggestions);

/**
 * Get query statistics
 * GET /api/v1/query/stats
 * 
 * Returns ChromaDB collection stats and document counts
 */
router.get('/stats', getQueryStats);

export default router;

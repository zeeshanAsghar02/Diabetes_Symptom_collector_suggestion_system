/**
 * Embedding Service — powered by Jina AI Embeddings API
 *
 * Replaces the local @xenova/transformers ONNX model with a free cloud API.
 * Sign up at https://jina.ai to get a free API key (1M tokens/month, no credit card).
 * Set JINA_API_KEY in your environment variables.
 *
 * Model: jina-embeddings-v3  |  Output dimension: 1024
 */

const JINA_API_URL = 'https://api.jina.ai/v1/embeddings';
const JINA_MODEL   = 'jina-embeddings-v3';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function parseRetryAfterMs(response) {
    const ra = response?.headers?.get?.('retry-after');
    if (!ra) return null;
    const seconds = Number.parseFloat(ra);
    if (Number.isFinite(seconds)) return Math.max(0, Math.floor(seconds * 1000));
    const dateMs = Date.parse(ra);
    if (Number.isFinite(dateMs)) return Math.max(0, dateMs - Date.now());
    return null;
}

async function fetchJinaWithRetry(body, { maxRetries, baseDelayMs, maxDelayMs } = {}) {
    const retries = Number.isFinite(maxRetries) ? maxRetries : Number.parseInt(process.env.JINA_MAX_RETRIES || '6', 10);
    const base = Number.isFinite(baseDelayMs) ? baseDelayMs : Number.parseInt(process.env.JINA_RETRY_BASE_MS || '1500', 10);
    const max = Number.isFinite(maxDelayMs) ? maxDelayMs : Number.parseInt(process.env.JINA_RETRY_MAX_MS || '30000', 10);

    let lastText = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetch(JINA_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getJinaKey()}`,
                },
                body: JSON.stringify(body),
            });

            if (response.ok) return response;

            const retryable = [408, 425, 429, 500, 502, 503, 504].includes(response.status);
            lastText = await response.text();
            if (!retryable || attempt === retries) {
                throw new Error(`Jina API error ${response.status}: ${lastText}`);
            }

            const retryAfter = parseRetryAfterMs(response);
            const exp = Math.min(max, base * Math.pow(2, attempt));
            const jitter = Math.floor(Math.random() * 250);
            const waitMs = Math.min(max, (retryAfter ?? exp) + jitter);
            console.log(`   Jina API retry ${attempt + 1}/${retries} after ${waitMs}ms (status=${response.status})...`);
            await sleep(waitMs);
        } catch (err) {
            if (attempt === retries) throw err;
            const exp = Math.min(max, base * Math.pow(2, attempt));
            const jitter = Math.floor(Math.random() * 250);
            const waitMs = Math.min(max, exp + jitter);
            console.log(`   Jina API retry ${attempt + 1}/${retries} after ${waitMs}ms (network error)...`);
            await sleep(waitMs);
        }
    }

    throw new Error(lastText ? `Jina API error: ${lastText}` : 'Jina API error');
}

function getJinaKey() {
    const key = process.env.JINA_API_KEY;
    if (!key) throw new Error('JINA_API_KEY is not set. Get a free key at https://jina.ai');
    return key;
}

/**
 * Initialize embedding model — no-op for Jina (no local model to load).
 * Kept for API compatibility with existing callers.
 */
export const initializeEmbeddingModel = async () => {
    console.log('Embedding service: using Jina AI API (jina-embeddings-v3, dim=1024)');
};

/**
 * Generate embedding for a single text chunk via Jina AI API
 * @param {string} text - Text to embed
 * @returns {Promise<Array<number>>} - 1024-dimensional embedding vector
 */
export const generateEmbedding = async (text) => {
    try {
        const response = await fetchJinaWithRetry({ model: JINA_MODEL, input: [text] });

        const json = await response.json();
        const embedding = json?.data?.[0]?.embedding;

        if (!embedding) throw new Error('Jina API returned no embedding data');
        return embedding;
    } catch (error) {
        console.error('Error generating embedding:', error);
        throw new Error(`Failed to generate embedding: ${error.message}`);
    }
};

/**
 * Generate embeddings for multiple text chunks via Jina AI API
 * Jina supports up to 2048 texts per batch — we use 20 to stay under rate limits.
 * @param {Array<string>} texts - Array of text chunks
 * @param {number} batchSize - Texts per API call (default 20)
 * @returns {Promise<Array<Array<number>>>} - Array of 1024-dimensional embedding vectors
 */
export const generateEmbeddingsBatch = async (texts, batchSize = 20) => {
    try {
        const embeddings = [];
        const totalBatches = Math.ceil(texts.length / batchSize);
        const pauseMs = Number.parseInt(process.env.JINA_BATCH_PAUSE_MS || '12000', 10);
        console.log(`Jina AI: generating embeddings for ${texts.length} chunks in ${totalBatches} batch(es)...`);

        for (let i = 0; i < texts.length; i += batchSize) {
            const batch = texts.slice(i, i + batchSize);
            const batchNum = Math.floor(i / batchSize) + 1;
            console.log(`Processing batch ${batchNum}/${totalBatches}...`);

            const response = await fetchJinaWithRetry({ model: JINA_MODEL, input: batch });

            const json = await response.json();
            const batchEmbeddings = json.data.map(item => item.embedding);
            embeddings.push(...batchEmbeddings);

            // Pause between batches to respect rate limits (configurable)
            if (pauseMs > 0 && i + batchSize < texts.length) {
                console.log(`   Waiting ${pauseMs}ms before next batch to avoid rate limits...`);
                await sleep(pauseMs);
            }
        }

        console.log(`Successfully generated ${embeddings.length} embeddings`);
        return embeddings;
    } catch (error) {
        console.error('Error generating batch embeddings:', error);
        throw new Error(`Failed to generate batch embeddings: ${error.message}`);
    }
};

/**
 * Get embedding dimension for jina-embeddings-v3
 * @returns {number}
 */
export const getEmbeddingDimension = () => {
    // jina-embeddings-v3 produces 1024-dimensional embeddings
    return 1024;
};

/**
 * Check if embedding service is ready (always true for API-based service)
 * @returns {boolean}
 */
export const isEmbeddingModelInitialized = () => {
    return !!process.env.JINA_API_KEY;
};

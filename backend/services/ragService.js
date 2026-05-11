import { processQuery } from './queryService.js';

/**
 * Retrieve medical context for risk assessment symptoms
 * Used by hybrid risk assessment service
 */
export const retrieveSymptomMedicalContext = async (symptoms, topK = 5) => {
    try {
        if (!symptoms || symptoms.length === 0) {
            return [];
        }

        // Build query focused on diabetes symptoms and risk factors
        const symptomQuery = `Diabetes symptoms risk factors diagnosis: ${symptoms.join(', ')}. Clinical guidelines for diabetes screening and assessment.`;
        
        console.log(`[RAG-Risk] Retrieving medical context for symptoms:`, symptoms);
        
        // Query with filter for guidelines and clinical materials
        const results = await processQuery(symptomQuery, {
            topK,
            minScore: 0.55, // Slightly lower threshold for medical guidelines
            filter: {
                doc_type: { $in: ['guideline', 'clinical_material'] }
            }
        });
        
        if (results && results.results && results.results.length > 0) {
            console.log(`[RAG-Risk] Retrieved ${results.results.length} relevant medical documents`);
            
            // Format results for risk assessment
            return results.results.map(doc => ({
                content: doc.text,
                filename: doc.chunk_metadata?.title || 'Medical Database',
                source: doc.chunk_metadata?.source || 'N/A',
                country: doc.chunk_metadata?.country || 'Global',
                page: doc.chunk_metadata?.page_no || 'N/A',
                similarity: doc.similarity_score
            }));
        }
        
        console.log(`[RAG-Risk] No relevant medical documents found above threshold`);
        return [];
        
    } catch (error) {
        console.error('[RAG-Risk] Error retrieving symptom medical context:', error);
        return [];
    }
};

/**
 * Detect query intent and categorize
 * Returns: { intent: string, needsRetrieval: boolean }
 */
export const detectQueryIntent = (message) => {
    const lowerMsg = message.toLowerCase();
    
    // Greetings/Small talk - NO retrieval
    const greetings = ['hi', 'hello', 'hey', 'thanks', 'thank you', 'bye', 'goodbye', 'ok', 'okay'];
    if (greetings.some(g => lowerMsg === g || lowerMsg === g + '!' || lowerMsg === g + '.')) {
        return { intent: 'greeting', needsRetrieval: false };
    }
    
    // Very short messages
    if (message.trim().split(/\s+/).length < 3) {
        return { intent: 'unclear', needsRetrieval: false };
    }
    
    // DIET/FOOD Intent
    const dietKeywords = [
        'food', 'eat', 'diet', 'meal', 'breakfast', 'lunch', 'dinner', 'snack',
        'vegetable', 'fruit', 'rice', 'wheat', 'bread', 'roti', 'chapati',
        'avoid', 'sugar', 'carb', 'protein', 'fat', 'calorie', 'nutrition',
        'recipe', 'cooking', 'ingredient', 'portion', 'serving',
        'meat', 'chicken', 'fish', 'egg', 'milk', 'yogurt', 'dairy',
        'lentil', 'dal', 'bean', 'vegetable', 'sabzi', 'curry',
        'atta', 'maida', 'daal', 'biryani', 'karahi', 'nihari'
    ];
    if (dietKeywords.some(k => lowerMsg.includes(k))) {
        return { intent: 'diet', needsRetrieval: true };
    }
    
    // EXERCISE Intent
    const exerciseKeywords = [
        'exercise', 'physical activity', 'workout', 'gym', 'walking', 'running',
        'jogging', 'yoga', 'cardio', 'strength', 'training', 'fitness',
        'active', 'movement', 'sport', 'play'
    ];
    if (exerciseKeywords.some(k => lowerMsg.includes(k))) {
        return { intent: 'exercise', needsRetrieval: true };
    }
    
    // RAMADAN/FASTING Intent
    const ramadanKeywords = [
        'ramadan', 'ramzan', 'fasting', 'suhoor', 'sehri', 'iftar', 'roza', 'fast'
    ];
    if (ramadanKeywords.some(k => lowerMsg.includes(k))) {
        return { intent: 'ramadan', needsRetrieval: true };
    }
    
    // MEDICATION Intent
    const medicationKeywords = [
        'medication', 'medicine', 'drug', 'pill', 'tablet', 'dose', 'dosage',
        'insulin', 'metformin', 'glipizide', 'glyburide', 'pioglitazone',
        'treatment', 'therapy', 'prescription'
    ];
    if (medicationKeywords.some(k => lowerMsg.includes(k))) {
        return { intent: 'medication', needsRetrieval: true };
    }
    
    // MONITORING Intent (blood sugar, HbA1c, etc.)
    const monitoringKeywords = [
        'blood sugar', 'glucose', 'hba1c', 'test', 'monitor', 'check',
        'level', 'reading', 'measurement', 'target', 'range'
    ];
    if (monitoringKeywords.some(k => lowerMsg.includes(k))) {
        return { intent: 'monitoring', needsRetrieval: true };
    }
    
    // COMPLICATIONS Intent
    const complicationKeywords = [
        'complication', 'kidney', 'nephropathy', 'eye', 'retinopathy',
        'foot', 'neuropathy', 'heart', 'cardiovascular', 'stroke'
    ];
    if (complicationKeywords.some(k => lowerMsg.includes(k))) {
        return { intent: 'complications', needsRetrieval: true };
    }
    
    // GENERAL medical questions
    const generalKeywords = [
        'what', 'how', 'why', 'when', 'should', 'can', 'recommend',
        'diabetes', 'diabetic', 'help', 'manage', 'control', 'advice', 'guideline'
    ];
    if (generalKeywords.some(k => lowerMsg.includes(k))) {
        return { intent: 'general', needsRetrieval: true };
    }
    
    return { intent: 'unclear', needsRetrieval: false };
};

/**
 * Build smart retrieval filter based on intent and user profile
 */
export const buildSmartFilter = (intent, personal, medical) => {
    const filter = {};
    
    // Intent-based document type filtering
    switch (intent) {
        case 'diet':
            // Prioritize diet charts, food composition tables, dietary guidelines
            filter.doc_type = { $in: ['diet_chart', 'guideline'] };
            break;
            
        case 'exercise':
            // Prioritize exercise recommendations and general guidelines
            filter.doc_type = { $in: ['exercise_recommendation', 'guideline'] };
            break;
            
        case 'ramadan':
            // No doc_type filter - let Ramadan-specific documents rank high by content
            // But if user has country, use it
            break;
            
        case 'medication':
            // Prioritize guidelines and clinical materials
            filter.doc_type = { $in: ['guideline', 'clinical_material'] };
            break;
            
        case 'monitoring':
        case 'complications':
        case 'general':
            // Use guidelines primarily
            filter.doc_type = { $in: ['guideline', 'clinical_material'] };
            break;
    }
    
    // Country-based filtering for diet questions
    if (intent === 'diet' && personal?.country) {
        // For Pakistani users asking about diet, prioritize Pakistan-specific documents
        filter.country = personal.country;
    }
    
    // For Ramadan questions, prioritize relevant regions
    if (intent === 'ramadan') {
        // Don't filter by country - Ramadan docs are relevant across Muslim regions
        // Let semantic search find the IDF Ramadan guidelines
    }
    
    return Object.keys(filter).length > 0 ? filter : null;
};

/**
 * Get dynamic topK based on intent
 */
export const getTopKForIntent = (intent) => {
    switch (intent) {
        case 'diet':
            return 5; // More context for diet (food lists, recipes, etc.)
        case 'ramadan':
            return 4; // Ramadan needs comprehensive context
        case 'exercise':
        case 'medication':
            return 3; // Standard
        case 'monitoring':
        case 'complications':
            return 3; // Standard
        case 'general':
            return 3; // Standard
        default:
            return 3;
    }
};

/**
 * Format retrieval results into context string with citations
 */
export const formatContextWithCitations = (retrievalResults, intent) => {
    if (!retrievalResults || retrievalResults.total_results === 0) {
        return { contextChunks: '', sources: [] };
    }
    
    const contextHeader = getContextHeaderForIntent(intent);
    
    const contextChunks = contextHeader + '\n\n' + retrievalResults.results
        .map((result, idx) => {
            const metadata = result.chunk_metadata;
            return `[${idx + 1}] ${result.text}

(Source: ${metadata.title || 'Unknown'} | ${metadata.source || 'N/A'} | Country: ${metadata.country || 'Global'} | Page ${metadata.page_no || 'N/A'})`;
        })
        .join('\n\n---\n\n');
    
    const sources = retrievalResults.results.map((result, idx) => ({
        id: idx + 1,
        title: result.chunk_metadata.title || 'Unknown',
        source: result.chunk_metadata.source || 'N/A',
        country: result.chunk_metadata.country || 'Global',
        doc_type: result.chunk_metadata.doc_type || 'guideline',
        page: result.chunk_metadata.page_no || 'N/A',
        similarity_score: result.similarity_score,
        document_id: result.chunk_metadata.document_id
    }));
    
    return { contextChunks, sources };
};

/**
 * Get context header based on intent
 */
const getContextHeaderForIntent = (intent) => {
    switch (intent) {
        case 'diet':
            return 'DIETARY GUIDELINES AND FOOD RECOMMENDATIONS FROM MEDICAL LITERATURE:';
        case 'exercise':
            return 'PHYSICAL ACTIVITY GUIDELINES FROM MEDICAL LITERATURE:';
        case 'ramadan':
            return 'RAMADAN FASTING GUIDELINES FOR DIABETES PATIENTS:';
        case 'medication':
            return 'MEDICATION GUIDELINES FROM MEDICAL LITERATURE:';
        case 'monitoring':
            return 'BLOOD GLUCOSE MONITORING GUIDELINES:';
        case 'complications':
            return 'DIABETES COMPLICATIONS MANAGEMENT GUIDELINES:';
        default:
            return 'RELEVANT MEDICAL GUIDELINES AND REFERENCE MATERIAL:';
    }
};

/**
 * Build RAG-enhanced system prompt with intent-aware instructions
 */
export const buildRAGPrompt = (contextChunks, profileSnippet, intent) => {
    if (!contextChunks || contextChunks.trim().length === 0) {
        return `You are Diabetica, a helpful diabetes management assistant.

USER PROFILE:
${profileSnippet}

Provide helpful diabetes advice. Be concise (2-3 paragraphs max), safe, and region-aware. Always advise consulting healthcare providers for medical decisions.`;
    }

    const intentInstructions = getIntentSpecificInstructions(intent);

    return `You are Diabetica, a helpful diabetes management assistant.

${contextChunks}

USER PROFILE:
${profileSnippet}

CORE INSTRUCTIONS:
1. **ANSWER BASED ON THE GUIDELINES ABOVE FIRST** - Start your response by explaining what the medical literature/guidelines say about this topic.
2. **CITE SOURCES** - Use [1], [2], [3] notation when referencing information from the guidelines.
3. **THEN PERSONALIZE** - After citing guidelines, personalize the advice based on the user's profile (diabetes type, medications, country, diet preference).
4. **BE EXPLICIT ABOUT SOURCES** - Use phrases like "According to [1]...", "The guidelines recommend [2]...", "Based on [3]..."
5. **REGIONAL CONTEXT** - For food/diet questions, if the user is from a specific country, reference country-specific items mentioned in the guidelines.
6. **BE CONCISE** - 2-4 paragraphs unless more detail is genuinely needed.
7. **SAFETY FIRST** - Never recommend unsafe practices. For medication changes or serious symptoms, always advise consulting a healthcare provider.

${intentInstructions}

MEDICAL DISCLAIMER: This information is for educational purposes only and should not replace professional medical advice.

Now answer the user's question, starting with what the guidelines say:`;
};

/**
 * Get intent-specific instructions
 */
const getIntentSpecificInstructions = (intent) => {
    switch (intent) {
        case 'diet':
            return `DIET-SPECIFIC INSTRUCTIONS:
- Start by explaining what the guidelines say about the specific foods/diet mentioned
- If the user is Pakistani and asking about local foods (roti, daal, biryani, etc.), reference Pakistani dietary guidelines if available
- Mention specific foods to eat/avoid from the guidelines
- Provide portion sizes or exchange lists if mentioned in guidelines
- Consider the user's dietary preference (vegetarian/non-vegetarian)`;
            
        case 'exercise':
            return `EXERCISE-SPECIFIC INSTRUCTIONS:
- Start with what the guidelines recommend for physical activity duration and intensity
- Mention any precautions from the guidelines
- Consider the user's current activity level when personalizing
- Include both aerobic and resistance training recommendations if available`;
            
        case 'ramadan':
            return `RAMADAN-SPECIFIC INSTRUCTIONS:
- Cite the Ramadan-specific diabetes guidelines thoroughly
- Cover suhoor/sehri and iftar meal recommendations
- Explain medication timing adjustments mentioned in guidelines
- Mention blood sugar monitoring frequency during fasting
- Include risk assessment criteria from guidelines`;
            
        case 'medication':
            return `MEDICATION-SPECIFIC INSTRUCTIONS:
- Reference general medication guidelines but ALWAYS advise consulting doctor for specific dosing
- Never provide specific dosage recommendations that aren't in the user's profile
- Mention medication timing and food interactions if in guidelines
- Consider the user's current medications when personalizing`;
            
        case 'monitoring':
            return `MONITORING-SPECIFIC INSTRUCTIONS:
- Cite target ranges from guidelines (HbA1c, fasting glucose, post-prandial)
- Mention testing frequency recommendations
- Explain what the numbers mean based on guidelines`;
            
        default:
            return '';
    }
};

/**
 * Main RAG enhancement function with intent detection
 */
export const enhanceChatWithRAG = async (message, personal, medical, history = []) => {
    try {
        // 1. Detect intent
        const { intent, needsRetrieval } = detectQueryIntent(message);
        console.log(`[RAG] Detected intent: ${intent}, Needs retrieval: ${needsRetrieval}`);
        
        if (!needsRetrieval) {
            return {
                systemPrompt: null,
                sources: [],
                contextUsed: false,
                intent,
                retrievalResults: null
            };
        }
        
        // 2. Build smart filter based on intent and profile
        const filter = buildSmartFilter(intent, personal, medical);
        console.log(`[RAG] Smart filter:`, filter);
        
        // 3. Get dynamic topK based on intent
        const topK = getTopKForIntent(intent);
        const minScore = parseFloat(process.env.RAG_MIN_SCORE) || 0.60; // Lowered to 0.60 for better recall
        
        console.log(`[RAG] Retrieving with topK=${topK}, minScore=${minScore}`);
        
        // 4. Retrieve documents
        const retrievalResults = await processQuery(message, {
            topK,
            minScore,
            filter
        });
        
        console.log(`[RAG] Retrieved ${retrievalResults.total_results} chunks`);
        
        if (retrievalResults.total_results === 0) {
            console.log(`[RAG] No relevant documents found above threshold`);
            
            // Fallback: Try without filters if we got 0 results
            if (filter) {
                console.log(`[RAG] Retrying without filters...`);
                const fallbackResults = await processQuery(message, {
                    topK,
                    minScore: minScore - 0.1, // Lower threshold
                    filter: null
                });
                
                if (fallbackResults.total_results > 0) {
                    console.log(`[RAG] Fallback retrieved ${fallbackResults.total_results} chunks`);
                    const { contextChunks, sources } = formatContextWithCitations(fallbackResults, intent);
                    const profileSnippet = buildProfileSnippet(personal, medical);
                    const systemPrompt = buildRAGPrompt(contextChunks, profileSnippet, intent);
                    
                    return {
                        systemPrompt,
                        sources,
                        contextUsed: true,
                        intent,
                        retrievalResults: fallbackResults
                    };
                }
            }
            
            return {
                systemPrompt: null,
                sources: [],
                contextUsed: false,
                intent,
                retrievalResults
            };
        }
        
        // 5. Format context and sources
        const { contextChunks, sources } = formatContextWithCitations(retrievalResults, intent);
        console.log(`[RAG] Context length: ${contextChunks.length} characters`);
        console.log(`[RAG] Top similarity score: ${sources[0]?.similarity_score.toFixed(4)}`);
        console.log(`[RAG] Sources:`, sources.map(s => `${s.title} (${s.country})`).join(', '));
        
        // 6. Build profile snippet
        const profileSnippet = buildProfileSnippet(personal, medical);
        
        // 7. Build enhanced prompt with intent-aware instructions
        const systemPrompt = buildRAGPrompt(contextChunks, profileSnippet, intent);
        
        return {
            systemPrompt,
            sources,
            contextUsed: true,
            intent,
            retrievalResults
        };
        
    } catch (error) {
        console.error('[RAG] Enhancement failed:', error);
        return {
            systemPrompt: null,
            sources: [],
            contextUsed: false,
            intent: 'error',
            error: error.message
        };
    }
};

const safeText = (val) => (typeof val === 'string' ? val.trim() : '');

const buildProfileSnippet = (personal, medical) => {
    const pieces = [];
    
    if (personal?.gender) pieces.push(`Gender: ${personal.gender}`);
    if (personal?.date_of_birth) {
        const age = Math.max(0, Math.floor((Date.now() - new Date(personal.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)));
        pieces.push(`Age: ${age}`);
    }
    if (personal?.height) pieces.push(`Height: ${personal.height} cm`);
    if (personal?.weight) pieces.push(`Weight: ${personal.weight} kg`);
    if (personal?.activity_level) pieces.push(`Activity: ${personal.activity_level}`);
    if (personal?.dietary_preference) pieces.push(`Diet preference: ${personal.dietary_preference}`);
    if (personal?.country) pieces.push(`Country: ${personal.country}`);
    
    if (medical?.diabetes_type) pieces.push(`Diabetes type: ${medical.diabetes_type}`);
    if (medical?.diagnosis_date) pieces.push(`Diagnosis date: ${new Date(medical.diagnosis_date).toISOString().slice(0, 10)}`);
    if (medical?.current_medications?.length) {
        const meds = medical.current_medications
            .filter(Boolean)
            .map((m) => [safeText(m.medication_name), safeText(m.dosage), safeText(m.frequency)].filter(Boolean).join(' '))
            .filter(Boolean)
            .join('; ');
        if (meds) pieces.push(`Medications: ${meds}`);
    }
    if (medical?.allergies?.length) {
        const allergies = medical.allergies
            .filter(Boolean)
            .map((a) => [safeText(a.allergen), safeText(a.reaction)].filter(Boolean).join(' - '))
            .filter(Boolean)
            .join('; ');
        if (allergies) pieces.push(`Allergies: ${allergies}`);
    }
    
    return pieces.join(' | ') || 'No profile data available';
};

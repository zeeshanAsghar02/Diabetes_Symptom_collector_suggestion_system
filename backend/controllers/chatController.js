import { UserPersonalInfo } from '../models/UserPersonalInfo.js';
import { UserMedicalInfo } from '../models/UserMedicalInfo.js';
import { enhanceChatWithRAG } from '../services/ragService.js';
import axios from 'axios';

// HF Gradio API configuration
const HF_SPACE_URL = process.env.LLM_API_URL || process.env.HF_SPACE_URL || 'https://zeeshanasghar02-diabetica-api.hf.space';
const HF_SUBMIT_TIMEOUT_MS = 30000;
const HF_SSE_TIMEOUT_MS = 90000;
const MAX_TOKENS = 512;
const MAX_INPUT_CHARS = 1500;
const HISTORY_WINDOW = 3;
const HISTORY_MESSAGE_CHARS = 500;
const MAX_RAG_CONTEXT_CHARS = 1800;

const safeText = (val) => (typeof val === 'string' ? val.trim() : '');

const buildProfileSnippet = (personal, medical) => {
  const pieces = [];
  
  // Handle null/undefined personal and medical objects
  if (!personal && !medical) {
    return 'No profile data available';
  }
  
  if (personal?.gender) pieces.push(`Gender: ${personal.gender}`);
  if (personal?.date_of_birth) {
    try {
      const dob = new Date(personal.date_of_birth);
      if (!isNaN(dob.getTime())) {
        const age = Math.max(0, Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)));
        pieces.push(`Age: ${age}`);
      }
    } catch (e) {
      console.warn('[CHAT] Invalid date_of_birth:', e.message);
    }
  }
  if (personal?.height) pieces.push(`Height: ${personal.height} cm`);
  if (personal?.weight) pieces.push(`Weight: ${personal.weight} kg`);
  if (personal?.activity_level) pieces.push(`Activity: ${personal.activity_level}`);
  if (personal?.dietary_preference) pieces.push(`Diet preference: ${personal.dietary_preference}`);
  if (medical?.diabetes_type) pieces.push(`Diabetes type: ${medical.diabetes_type}`);
  if (medical?.diagnosis_date) {
    try {
      const diagDate = new Date(medical.diagnosis_date);
      if (!isNaN(diagDate.getTime())) {
        pieces.push(`Diagnosis date: ${diagDate.toISOString().slice(0, 10)}`);
      }
    } catch (e) {
      console.warn('[CHAT] Invalid diagnosis_date:', e.message);
    }
  }
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

const clipHistory = (history) => {
  if (!Array.isArray(history)) return [];
  const trimmed = history
    .filter((h) => h && (h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string')
    .slice(-HISTORY_WINDOW)
    .map((h) => ({ role: h.role, content: h.content.substring(0, HISTORY_MESSAGE_CHARS) }));
  return trimmed;
};

export const completeChat = async (req, res) => {
  try {
    console.log('[CHAT] Starting chat completion request');
    const { message, history = [] } = req.body || {};
    const userId = req.user?._id;
    console.log('[CHAT] UserId:', userId, 'Message:', message?.substring(0, 50));

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Message is required.' });
    }
    if (message.length > MAX_INPUT_CHARS) {
      return res.status(400).json({ success: false, error: `Message too long. Limit ${MAX_INPUT_CHARS} characters.` });
    }

    // Fetch profile data (without .lean() to trigger decryption middleware)
    console.log('[CHAT] Fetching profile data for user:', userId);
    const [personal, medical] = await Promise.all([
      UserPersonalInfo.findOne({ user_id: userId }),
      UserMedicalInfo.findOne({ user_id: userId }),
    ]);
    console.log('[CHAT] Profile fetched - personal:', !!personal, 'medical:', !!medical);

    const profileSnippet = buildProfileSnippet(personal, medical);
    const recentHistory = clipHistory(history);

    // **RAG Enhancement**
    const { ragContext, sources } = await enhanceChatWithRAG(message, userId, personal, recentHistory);
    const trimmedRagContext = typeof ragContext === 'string'
      ? ragContext.slice(0, MAX_RAG_CONTEXT_CHARS)
      : '';

    const systemPrompt = `You are Diabuddy, a supportive diabetes information assistant.

User Profile Summary:
${profileSnippet}

${trimmedRagContext ? `Relevant Information from Health Documents:
${trimmedRagContext}` : ''}

CRITICAL SAFETY INSTRUCTIONS:
- Prioritize safety.
- Never diagnose, prescribe, or replace a clinician.
- Include a brief disclaimer for health concerns.
- Keep answers concise, practical, and easy to understand.
- Use retrieved information when available, but say when evidence is unclear.`;

    // Build the user prompt with context
    const userPromptWithHistory = recentHistory.length > 0 
      ? `Previous conversation:\n${recentHistory.map(h => `${h.role}: ${h.content}`).join('\n')}\n\nCurrent question: ${message}`
      : message;

    console.log('[CHAT] Sending to HF Diabetica API');

    // Step 1: Submit job to HF Gradio API
    const submitRes = await axios.post(
      `${HF_SPACE_URL}/gradio_api/call/predict`,
      { data: [systemPrompt, userPromptWithHistory, MAX_TOKENS, 0.4] },
      { timeout: HF_SUBMIT_TIMEOUT_MS, headers: { 'Content-Type': 'application/json' } }
    );
    
    const eventId = submitRes.data?.event_id;
    if (!eventId) throw new Error('No event_id returned from HF Space');
    console.log('[CHAT] Got event_id:', eventId);

    // Step 2: Get SSE response
    const sseRes = await axios.get(
      `${HF_SPACE_URL}/gradio_api/call/predict/${eventId}`,
      { timeout: HF_SSE_TIMEOUT_MS, responseType: 'text' }
    );

    const rawText = sseRes.data || '';
    const lines = rawText.split('\n');
    let aiMessage = null;

    // Parse SSE response - scan backward for data lines
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line.startsWith('data:')) {
        try {
          const json = JSON.parse(line.slice(5).trim());
          if (Array.isArray(json) && typeof json[0] === 'string') {
            aiMessage = json[0];
            break;
          }
        } catch { /* continue scanning */ }
      }
    }

    if (!aiMessage) {
      throw new Error('AI service returned an empty response.');
    }

    console.log('[CHAT] Received AI response:', aiMessage.substring(0, 100));

    // Return response in format expected by frontend
    return res.status(200).json({
      success: true,
      reply: aiMessage,
      sources: sources,
      context_used: !!ragContext,
    });

  } catch (error) {
    console.error('[CHAT] Error in completeChat controller:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while communicating with the AI assistant. Please try again later.',
      details: error.message,
    });
  }
};

export const getChatHistory = async (req, res) => {
  // Placeholder: Implement logic to retrieve chat history from the database
  // For now, returns an empty array
  return res.status(200).json({ success: true, data: [] });
};

export const clearChatHistory = async (req, res) => {
  // Placeholder: Implement logic to delete chat history from the database
  return res.status(200).json({ success: true, message: 'Chat history cleared.' });
};

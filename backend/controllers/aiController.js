import { generateMedicalAnalysis, sanitizePromptInput } from '../services/aiService.js';

const MAX_SYMPTOMS_CHARS = 1000;

export const generateAIResponse = async (req, res) => {
  const startedAt = Date.now();
  const timestamp = new Date().toISOString();

  try {
    const body = req.body || {};
    const symptoms = sanitizePromptInput(
      body.symptoms || body.message || body.prompt || body.input || '',
      MAX_SYMPTOMS_CHARS + 1
    );

    if (!symptoms) {
      return res.status(400).json({
        success: false,
        message: 'Symptoms or prompt text is required.',
      });
    }

    if (symptoms.length > MAX_SYMPTOMS_CHARS) {
      return res.status(400).json({
        success: false,
        message: `Symptoms text must be ${MAX_SYMPTOMS_CHARS} characters or fewer.`,
      });
    }

    const result = await generateMedicalAnalysis({
      symptoms,
      age: body.age,
      gender: body.gender,
      medicalHistory: body.medicalHistory || body.medical_history || body.history,
    });

    console.log('[AI_CONTROLLER] generate success', {
      timestamp,
      duration_ms: Date.now() - startedAt,
    });

    return res.status(200).json({
      success: true,
      data: result,
      result,
    });
  } catch (error) {
    console.error('[AI_CONTROLLER] generate failure', {
      timestamp,
      duration_ms: Date.now() - startedAt,
      message: error.message,
    });

    return res.status(502).json({
      success: false,
      message: 'AI generation failed. Please try again shortly.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

import { retrieveSymptomMedicalContext } from './ragService.js';

/**
 * Hybrid Risk Assessment Service
 * Combines XGBoost predictions with Diabetica 7B LLM (hosted on HuggingFace ZeroGPU)
 * for enhanced accuracy and medical reasoning.
 *
 * Set DIABETICA_HF_URL env var to your HF Space URL, e.g.:
 *   https://YOUR-USERNAME-diabetica-api.hf.space/api/predict
 */
class HybridRiskService {
  constructor() {
    this.hfSpaceUrl = process.env.DIABETICA_HF_URL || process.env.LLM_API_URL || process.env.HF_SPACE_URL || null;
    // Gradio slider constraint: max_tokens must be 256–2048; clamp regardless of env var
    this.maxTokens = Math.min(Math.max(parseInt(process.env.LM_STUDIO_MAX_TOKENS || '1024'), 256), 2048);
    this.ragEnabled = process.env.RAG_ENABLED === 'true';
  }

  /**
   * Enhance XGBoost risk assessment with LLM-based medical reasoning
   * @param {Object} xgboostResult - Result from XGBoost model
   * @param {Object} features - User symptoms and features
   * @param {Object} userContext - User profile context (age, gender, medical history)
   * @returns {Promise<Object>} - Enhanced risk assessment with LLM insights
   */
  async enhanceRiskAssessment(xgboostResult, features, userContext = {}) {
    try {
      // Validate XGBoost result
      if (!xgboostResult || !xgboostResult.risk_level) {
        throw new Error('Invalid XGBoost result provided');
      }

      // Step 1: Prepare symptom context for LLM
      const symptomContext = this._prepareSymptomContext(features, xgboostResult);

      // Step 2: Retrieve relevant medical knowledge via RAG (if enabled)
      let retrievedContext = '';
      if (this.ragEnabled) {
        try {
          retrievedContext = await this._retrieveMedicalContext(symptomContext.presentSymptoms);
        } catch (ragError) {
          console.warn('RAG retrieval failed, continuing without retrieved context:', ragError.message);
        }
      }

      // Step 3: Generate LLM-enhanced assessment
      const llmAssessment = await this._getLLMRiskAssessment(
        xgboostResult,
        symptomContext,
        retrievedContext,
        userContext
      );

      // Step 4: Combine XGBoost and LLM results
      const enhancedResult = this._combineAssessments(xgboostResult, llmAssessment);

      return {
        success: true,
        enhanced: true,
        ...enhancedResult
      };

    } catch (error) {
      console.error('Hybrid risk assessment error:', error.message);
      
      // Fallback to XGBoost-only result if LLM fails
      return {
        success: true,
        enhanced: false,
        fallbackReason: error.message,
        ...xgboostResult,
        llm_insights: {
          medical_reasoning: 'LLM enhancement unavailable. Assessment based on XGBoost model only.',
          confidence_note: 'Limited to statistical model without medical reasoning validation.'
        }
      };
    }
  }

  /**
   * Prepare symptom context from features
   * @private
   */
  _prepareSymptomContext(features, xgboostResult) {
    const symptomNames = {
      'Polyuria': 'Frequent urination',
      'Polydipsia': 'Excessive thirst',
      'sudden weight loss': 'Sudden weight loss',
      'weakness': 'Weakness/fatigue',
      'Polyphagia': 'Excessive hunger',
      'Genital thrush': 'Genital yeast infections',
      'visual blurring': 'Blurred vision',
      'Itching': 'Itching',
      'Irritability': 'Irritability',
      'delayed healing': 'Delayed wound healing',
      'partial paresis': 'Muscle weakness',
      'muscle stiffness': 'Muscle stiffness',
      'Alopecia': 'Hair loss',
      'Obesity': 'Obesity'
    };

    const presentSymptoms = [];
    const symptomDetails = [];

    Object.entries(features).forEach(([key, value]) => {
      if (key === 'Age' || key === 'Gender') return;
      
      if (value === 1 || value === '1' || value === true) {
        const displayName = symptomNames[key] || key;
        presentSymptoms.push(displayName);
        
        // Add importance if available
        const importance = xgboostResult.feature_importance?.[key];
        if (importance) {
          symptomDetails.push({
            name: displayName,
            importance: importance
          });
        }
      }
    });

    return {
      presentSymptoms,
      symptomDetails,
      age: features.Age || 'unknown',
      gender: features.Gender === 1 ? 'Male' : features.Gender === 0 ? 'Female' : 'unknown',
      symptomCount: presentSymptoms.length
    };
  }

  /**
   * Retrieve medical context via RAG
   * @private
   */
  async _retrieveMedicalContext(symptoms) {
    if (symptoms.length === 0) {
      return '';
    }

    try {
      const results = await retrieveSymptomMedicalContext(symptoms, 5);
      
      if (results && results.length > 0) {
        // Extract and format retrieved context
        const contextParts = results.map((doc, idx) => 
          `[Medical Reference ${idx + 1}]\n${doc.content}\nSource: ${doc.filename} (${doc.country}) - Page ${doc.page}\nRelevance: ${(doc.similarity * 100).toFixed(1)}%`
        );
        
        return contextParts.join('\n\n---\n\n');
      }
    } catch (error) {
      console.warn('RAG retrieval error:', error.message);
    }
    
    return '';
  }

  /**
   * Get LLM-based risk assessment
   * @private
   */
  async _getLLMRiskAssessment(xgboostResult, symptomContext, retrievedContext, userContext) {
    const { presentSymptoms, symptomDetails, age, gender, symptomCount } = symptomContext;
    
    // Build comprehensive prompt
    const systemPrompt = `You are Diabetica, an expert AI medical assistant specializing in diabetes risk assessment. You have access to medical literature and clinical guidelines for diabetes diagnosis. Provide evidence-based, accurate assessments.`;

    const userPrompt = this._buildRiskAssessmentPrompt(
      xgboostResult,
      presentSymptoms,
      symptomDetails,
      age,
      gender,
      symptomCount,
      retrievedContext,
      userContext
    );

    if (!this.hfSpaceUrl) {
      throw new Error('DIABETICA_HF_URL is not set. Add it to your environment variables.');
    }

    try {
      // Logic to handle Gradio 4+ (detecting if we need to poll)
      const hfBase = this.hfSpaceUrl.replace(/\/$/, "");
      
      console.log(`[LLM] Calling Diabetica HF Space: ${hfBase}`);

      // Gradio 5 API: POST /gradio_api/call/predict → { event_id }
      //               GET  /gradio_api/call/predict/{event_id} → SSE stream
      console.log('[LLM] Submitting to Gradio 5 /gradio_api/call/predict ...');
      const submitRes = await fetch(`${hfBase}/gradio_api/call/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: [systemPrompt, userPrompt, this.maxTokens, 0.3]
        }),
      });

      if (!submitRes.ok) {
        const errBody = await submitRes.text();
        throw new Error(`HF submit failed ${submitRes.status}: ${errBody.slice(0,200)}`);
      }

      const { event_id } = await submitRes.json();
      console.log(`[LLM] Queued event_id: ${event_id}. Reading SSE (60-120s on CPU)...`);

      const sseRes = await fetch(`${hfBase}/gradio_api/call/predict/${event_id}`);
      if (!sseRes.ok) throw new Error(`SSE stream error: ${sseRes.status}`);

      const sseText = await sseRes.text();
      // Parse SSE: scan from end for last data line with string array output
      let llmResponse = null;
      const sseLines = sseText.split('\n');
      for (let i = sseLines.length - 1; i >= 0; i--) {
        const line = sseLines[i].trim();
        if (line.startsWith('data:')) {
          try {
            const parsed = JSON.parse(line.slice(5).trim());
            if (Array.isArray(parsed) && typeof parsed[0] === 'string') {
              llmResponse = parsed[0];
              break;
            }
            if (parsed?.output?.data?.[0]) {
              llmResponse = parsed.output.data[0];
              break;
            }
          } catch {}
        }
      }

      if (!llmResponse) {
        throw new Error(`Could not parse SSE response from HF. Raw: ${sseText.slice(0, 300)}`);
      }

      return this._parseLLMResponse(llmResponse);

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Diabetica HF Space timed out (90s). ZeroGPU may be under heavy load — try again.');
      }
      throw new Error(`HF Space LLM request failed: ${error.message}`);
    }
  }

  /**
   * Build the risk assessment prompt for LLM
   * @private
   */
  _buildRiskAssessmentPrompt(xgboostResult, presentSymptoms, symptomDetails, age, gender, symptomCount, retrievedContext, userContext) {
    let prompt = `# Diabetes Risk Assessment Validation

## Patient Profile
- Age: ${age}
- Gender: ${gender}
- Diabetes Status: ${userContext.diabetesType || 'Undiagnosed'}

## XGBoost Model Assessment
- Risk Level: ${xgboostResult.risk_level}
- Diabetes Probability: ${(xgboostResult.diabetes_probability * 100).toFixed(1)}%
- Model Confidence: ${(xgboostResult.confidence * 100).toFixed(1)}%

## Reported Symptoms (${symptomCount} total)
${presentSymptoms.length > 0 ? presentSymptoms.map(s => `- ${s}`).join('\n') : 'No symptoms reported'}

${symptomDetails.length > 0 ? `\n## Symptom Importance (from model)
${symptomDetails.slice(0, 5).map(s => `- ${s.name}: ${(s.importance * 100).toFixed(1)}% importance`).join('\n')}` : ''}

${retrievedContext ? `\n## Medical Knowledge Base
${retrievedContext.substring(0, 1500)}` : ''}

## Your Task
As a diabetes medical expert, please:

1. **Validate Assessment**: Do you agree with the "${xgboostResult.risk_level}" risk classification? Consider:
   - Clinical significance of reported symptoms
   - Typical diabetes presentation patterns
   - Age and gender risk factors

2. **Adjust Confidence**: Based on your medical knowledge, should the confidence be adjusted? Consider:
   - Symptom combination (classic triad: polyuria, polydipsia, polyphagia)
   - Red flag symptoms requiring immediate attention
   - Atypical presentations

3. **Medical Reasoning**: Explain your assessment from a clinical perspective.

4. **Priority Symptoms**: Which symptoms are most concerning and why?

5. **Enhanced Recommendations**: What specific medical actions should be taken?

Respond in this JSON format:
{
  "agreement": "agree|partially_agree|disagree",
  "suggested_risk_level": "low|moderate|high|critical",
  "adjusted_confidence": 0.0-1.0,
  "medical_reasoning": "Detailed clinical explanation",
  "priority_symptoms": ["symptom1", "symptom2"],
  "clinical_notes": "Important observations",
  "recommended_actions": ["action1", "action2"],
  "urgency_level": "routine|soon|urgent|emergency"
}`;

    return prompt;
  }

  /**
   * Parse LLM response
   * @private
   */
  _parseLLMResponse(llmResponse) {
    try {
      // Try to extract JSON from response
      const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed;
      }
      
      // If no JSON found, create structured response from text
      return {
        agreement: 'partially_agree',
        suggested_risk_level: null,
        adjusted_confidence: null,
        medical_reasoning: llmResponse,
        priority_symptoms: [],
        clinical_notes: 'LLM provided unstructured response',
        recommended_actions: [],
        urgency_level: 'routine'
      };
    } catch (error) {
      console.warn('Failed to parse LLM JSON response:', error.message);
      return {
        agreement: 'partially_agree',
        medical_reasoning: llmResponse,
        priority_symptoms: [],
        clinical_notes: 'Unable to parse structured response',
        recommended_actions: [],
        urgency_level: 'routine'
      };
    }
  }

  /**
   * Combine XGBoost and LLM assessments
   * @private
   */
  _combineAssessments(xgboostResult, llmAssessment) {
    // Determine final risk level
    let finalRiskLevel = xgboostResult.risk_level;
    let adjustmentNote = '';

    if (llmAssessment.agreement === 'disagree' && llmAssessment.suggested_risk_level) {
      finalRiskLevel = llmAssessment.suggested_risk_level;
      adjustmentNote = `Risk level adjusted from "${xgboostResult.risk_level}" to "${finalRiskLevel}" based on clinical assessment`;
    } else if (llmAssessment.agreement === 'partially_agree' && llmAssessment.suggested_risk_level) {
      // Use weighted approach: 70% XGBoost, 30% LLM suggestion
      const riskLevels = ['low', 'moderate', 'high', 'critical'];
      const xgbIndex = riskLevels.indexOf(xgboostResult.risk_level);
      const llmIndex = riskLevels.indexOf(llmAssessment.suggested_risk_level);
      
      if (llmIndex !== -1 && xgbIndex !== -1) {
        const avgIndex = Math.round(xgbIndex * 0.7 + llmIndex * 0.3);
        finalRiskLevel = riskLevels[avgIndex];
        adjustmentNote = `Risk level refined using ensemble approach (70% statistical model, 30% clinical reasoning)`;
      }
    }

    // Adjust confidence if LLM suggests
    let finalConfidence = xgboostResult.confidence;
    if (llmAssessment.adjusted_confidence !== null && llmAssessment.adjusted_confidence !== undefined) {
      // Blend confidences
      finalConfidence = (xgboostResult.confidence * 0.6 + llmAssessment.adjusted_confidence * 0.4);
    }

    // Combine recommendations
    const enhancedRecommendations = {
      ...xgboostResult.recommendations,
      clinical_actions: llmAssessment.recommended_actions || [],
      urgency: llmAssessment.urgency_level || 'routine',
      priority_symptoms: llmAssessment.priority_symptoms || []
    };

    return {
      // Core assessment
      risk_level: finalRiskLevel,
      diabetes_probability: xgboostResult.diabetes_probability,
      confidence: parseFloat(finalConfidence.toFixed(3)),
      prediction: xgboostResult.prediction,
      
      // Model outputs
      xgboost_assessment: {
        risk_level: xgboostResult.risk_level,
        probability: xgboostResult.diabetes_probability,
        confidence: xgboostResult.confidence
      },
      
      // LLM insights
      llm_insights: {
        agreement: llmAssessment.agreement,
        medical_reasoning: llmAssessment.medical_reasoning,
        clinical_notes: llmAssessment.clinical_notes,
        priority_symptoms: llmAssessment.priority_symptoms,
        urgency_level: llmAssessment.urgency_level
      },
      
      // Combined outputs
      adjustment_note: adjustmentNote,
      feature_importance: xgboostResult.feature_importance,
      recommendations: enhancedRecommendations,
      educational_content: xgboostResult.educational_content,
      assessment_summary: this._generateEnhancedSummary(
        finalRiskLevel,
        xgboostResult.diabetes_probability,
        finalConfidence,
        llmAssessment
      ),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate enhanced assessment summary
   * @private
   */
  _generateEnhancedSummary(riskLevel, probability, confidence, llmAssessment) {
    const probabilityPercent = (probability * 100).toFixed(1);
    const confidencePercent = (confidence * 100).toFixed(1);
    
    let summary = `**Hybrid Risk Assessment:** ${riskLevel.toUpperCase()} risk (${probabilityPercent}% probability)\n\n`;
    summary += `**Assessment Confidence:** ${confidencePercent}%\n\n`;
    
    if (llmAssessment.medical_reasoning) {
      summary += `**Clinical Perspective:** ${llmAssessment.medical_reasoning.substring(0, 300)}...\n\n`;
    }
    
    if (llmAssessment.priority_symptoms && llmAssessment.priority_symptoms.length > 0) {
      summary += `**Priority Symptoms:** ${llmAssessment.priority_symptoms.join(', ')}\n\n`;
    }
    
    summary += `**Urgency:** ${llmAssessment.urgency_level || 'routine'}\n\n`;
    summary += `This assessment combines statistical machine learning with medical reasoning for enhanced accuracy.`;
    
    return summary;
  }

  /**
   * Check if the Diabetica HF Space is reachable
   * @returns {Promise<boolean>}
   */
  async checkLLMAvailability() {
    if (!this.hfSpaceUrl) return false;
    try {
      // Ping the Space root (fast, no GPU needed)
      const spaceRoot = this.hfSpaceUrl.replace('/api/predict', '');
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 8000);
      const response = await fetch(spaceRoot, { signal: controller.signal });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

export default new HybridRiskService();

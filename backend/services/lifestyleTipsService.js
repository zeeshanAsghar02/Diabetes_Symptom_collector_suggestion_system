import LifestyleTip from '../models/LifestyleTip.js';
import { User } from '../models/User.js';
import { UserPersonalInfo } from '../models/UserPersonalInfo.js';
import { UserMedicalInfo } from '../models/UserMedicalInfo.js';
import { processQuery } from './queryService.js';
import axios from 'axios';

// HF Gradio API configuration
const HF_SPACE_URL = process.env.LLM_API_URL || process.env.HF_SPACE_URL || 'https://zeeshanasghar02-diabetica-api.hf.space';
const HF_SUBMIT_TIMEOUT_MS = 30000;
const HF_SSE_TIMEOUT_MS = 90000;
const MAX_TOKENS = 768;
const MAX_GUIDELINE_CHUNKS = 4;
const MAX_GUIDELINE_CHARS = 1400;
const SYSTEM_PROMPT = `You are a diabetes wellness coach. Generate personalized daily lifestyle tips. Always respond with valid JSON only.`;
const inFlightLifestyleGenerations = new Map();

class LifestyleTipsService {
  parseNumeric(value) {
    if (typeof value === 'number' && !Number.isNaN(value)) return value;
    if (value == null) return null;
    const matches = String(value).match(/[-+]?[0-9]*\.?[0-9]+/g);
    if (!matches || matches.length === 0) return null;
    const n = parseFloat(matches[0]);
    return Number.isNaN(n) ? null : n;
  }

  extractConditionNames(medicalInfo) {
    if (!medicalInfo) return [];
    const conditions = medicalInfo.chronic_conditions || medicalInfo.conditions || [];
    if (!Array.isArray(conditions)) return [];
    return conditions
      .map((condition) => condition?.condition_name || condition?.name || condition)
      .map((condition) => String(condition || '').trim())
      .filter(Boolean);
  }

  buildLifestyleFingerprint(parsedTips) {
    const tokens = [];
    (parsedTips?.categories || []).forEach((category) => {
      tokens.push(`cat:${String(category?.name || '').toLowerCase()}`);
      (category?.tips || []).forEach((tip) => {
        tokens.push(`title:${String(tip?.title || '').toLowerCase()}`);
        tokens.push(`desc:${String(tip?.description || '').toLowerCase().slice(0, 80)}`);
      });
    });
    (parsedTips?.personalized_insights || []).forEach((insight) => {
      tokens.push(`insight:${String(insight || '').toLowerCase().slice(0, 80)}`);
    });
    return Array.from(new Set(tokens.filter(Boolean))).sort().join('|');
  }

  jaccardSimilarity(aStr, bStr) {
    const a = new Set(String(aStr || '').split('|').filter(Boolean));
    const b = new Set(String(bStr || '').split('|').filter(Boolean));
    if (a.size === 0 || b.size === 0) return 0;
    let intersection = 0;
    a.forEach((val) => { if (b.has(val)) intersection++; });
    return intersection / (a.size + b.size - intersection);
  }

  async hasSimilarLifestyleTipsForDate(userId, targetDateObj, parsedTips) {
    const fingerprint = this.buildLifestyleFingerprint(parsedTips);
    if (!fingerprint) return false;

    const others = await LifestyleTip.find({
      user_id: { $ne: userId },
      target_date: targetDateObj,
      generation_status: 'complete',
    })
      .select('categories personalized_insights')
      .limit(12)
      .lean();

    for (const other of others) {
      const otherFingerprint = this.buildLifestyleFingerprint(other || {});
      if (!otherFingerprint) continue;
      if (otherFingerprint === fingerprint) return true;
      const similarity = this.jaccardSimilarity(fingerprint, otherFingerprint);
      if (similarity >= 0.88) return true;
    }

    return false;
  }

  extractMedicationNames(medicalInfo) {
    if (!medicalInfo) return [];

    if (Array.isArray(medicalInfo.current_medications)) {
      return medicalInfo.current_medications
        .map((medication) => medication?.medication_name || medication?.name || medication)
        .map((medication) => String(medication || '').trim())
        .filter(Boolean);
    }

    if (Array.isArray(medicalInfo.medications)) {
      return medicalInfo.medications
        .map((medication) => medication?.medication_name || medication?.name || medication)
        .map((medication) => String(medication || '').trim())
        .filter(Boolean);
    }

    return [];
  }

  async generateLifestyleTips(userId, targetDate) {
    const normalizedTargetDate = new Date(targetDate);
    normalizedTargetDate.setUTCHours(0, 0, 0, 0);
    const requestKey = `${String(userId)}:${normalizedTargetDate.toISOString().slice(0, 10)}`;

    if (inFlightLifestyleGenerations.has(requestKey)) {
      console.log(`⏳ Lifestyle tips generation already in progress for ${requestKey}`);
      return inFlightLifestyleGenerations.get(requestKey);
    }

    const generationPromise = this._generateLifestyleTips(userId, targetDate, normalizedTargetDate);
    inFlightLifestyleGenerations.set(requestKey, generationPromise);

    try {
      return await generationPromise;
    } finally {
      inFlightLifestyleGenerations.delete(requestKey);
    }
  }

  async _generateLifestyleTips(userId, targetDate, targetDateObj) {
    try {
      console.log(`📋 Generating lifestyle tips for userId: ${userId}, targetDate: ${targetDate}`);
      
      // Get user profile
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');
      console.log(`✅ User found: ${user.email}`);

      // Fetch personal and medical info from separate collections
      const personalInfoDoc = await UserPersonalInfo.findOne({ user_id: userId });
      const medicalInfoDoc = await UserMedicalInfo.findOne({ user_id: userId });
      console.log(`📊 PersonalInfo found: ${!!personalInfoDoc}, MedicalInfo found: ${!!medicalInfoDoc}`);

      const personalInfo = personalInfoDoc ? personalInfoDoc.toObject() : {};
      const medicalInfo = medicalInfoDoc ? medicalInfoDoc.toObject() : {};

      // Check if tips already exist for this date
      // Normalize to UTC midnight to avoid timezone issues
      const existingTips = await LifestyleTip.findOne({
        user_id: userId,
        target_date: targetDateObj,
      });
      if (existingTips) throw new Error('Tips already exist for this date');

      // Get region from user profile or personal info
      const region = user.country || 'Global';

      // Get regional lifestyle guidelines
      console.log(`🌍 Getting regional guidelines for: ${region}`);
      const guidelinesContext = await this.queryRegionalLifestyleGuidelines(region);
      console.log(`✅ Guidelines retrieved: ${guidelinesContext.chunks?.length || 0} chunks`);

      // Build personalized prompt
      const prompt = this.buildLifestylePrompt(personalInfo, medicalInfo, guidelinesContext, targetDate, {
        diversityHint: `user-${String(userId).slice(-6)}`,
      });
      console.log(`📝 Prompt built, length: ${prompt.length}`);

      // Call HF Diabetica API
      console.log(`🤖 Calling HF Diabetica API...`);
      const aiResponse = await this.callDiabetica(prompt);
      console.log(`✅ HF Diabetica response received, length: ${aiResponse.length}`);
      let parsedTips = this.parseLifestyleTips(aiResponse);
      console.log(`✅ Tips parsed successfully:`, JSON.stringify(parsedTips, null, 2));
      const source = 'hf-diabetica';

      // Validate parsed tips
      if (!parsedTips || !parsedTips.categories || parsedTips.categories.length === 0) {
        console.error('❌ No valid tips generated');
        throw new Error('Failed to generate lifestyle tips: No valid categories created');
      }

      const similarTipsDetected = await this.hasSimilarLifestyleTipsForDate(userId, targetDateObj, parsedTips);
      if (similarTipsDetected) {
        console.warn('⚠️ Similar same-day lifestyle tips detected for another user; regenerating with stronger personalization.');
        const regenPrompt = this.buildLifestylePrompt(personalInfo, medicalInfo, guidelinesContext, targetDate, {
          diversityHint: `regen-${String(userId).slice(-6)}-${Date.now().toString().slice(-4)}`,
        });
        const regenResponse = await this.callDiabetica(regenPrompt, { temperature: 0.5 });
        const regenerated = this.parseLifestyleTips(regenResponse);
        if (regenerated?.categories?.length > 0) {
          parsedTips = regenerated;
        }
      }

      console.log(`✅ ${parsedTips.categories.length} categories generated`);

      // Create and save tips
      const tips = new LifestyleTip({
        user_id: userId,
        target_date: targetDateObj,
        region,
        categories: parsedTips.categories,
        personalized_insights: parsedTips.personalized_insights,
        sources: guidelinesContext.sources,
        status: 'active',
        source,
      });

      console.log('💾 Saving lifestyle tips to database...');
      await tips.save();
      console.log('✅ Lifestyle tips saved successfully');

      return {
        success: true,
        message: 'Lifestyle tips generated successfully',
        tips: tips.toObject(),
        region_coverage: {
          region,
          canGenerateTips: true,
          documentCount: guidelinesContext.sources.length,
          coverage: guidelinesContext.sources.length > 0 ? 'Available' : 'Limited',
        },
      };
    } catch (error) {
      console.error('❌ Error in generateLifestyleTips:', error);
      console.error('❌ Error stack:', error.stack);
      throw new Error(`Failed to generate lifestyle tips: ${error.message}`);
    }
  }

  async queryRegionalLifestyleGuidelines(region) {
    try {
      const response = await processQuery(
        `lifestyle tips guidelines and daily habits for diabetes management in ${region}`,
        {
          topK: MAX_GUIDELINE_CHUNKS,
          filter: { country: region },
        }
      );

      const results = response.results || [];

      return {
        chunks: results.map(r => r.text || ''),
        sources: results.map(r => ({
          title: r.chunk_metadata?.title || 'Lifestyle Guideline',
          country: r.chunk_metadata?.country || region,
          doc_type: r.chunk_metadata?.doc_type || 'lifestyle_guideline',
        })),
      };
    } catch (error) {
      console.warn('Failed to query regional guidelines; continuing without regional context:', error.message);
      return {
        chunks: [],
        sources: [],
      };
    }
  }

  buildLifestylePrompt(personalInfo, medicalInfo, guidelinesContext, targetDate, options = {}) {
    const sleepHours = personalInfo.sleep_hours || 7;
    const activityLevel = personalInfo.activity_level || 'Moderate';
    const smokingStatus = personalInfo.smoking_status || 'Never';
    const alcoholUse = personalInfo.alcohol_use || 'Never';
    const height = this.parseNumeric(personalInfo.height);
    const weight = this.parseNumeric(personalInfo.weight);
    const bmi = (height && weight) ? Number((weight / ((height / 100) * (height / 100))).toFixed(1)) : null;
    const diabetesType = medicalInfo.diabetes_type || 'Type 2';
    const medications = this.extractMedicationNames(medicalInfo);
    const chronicConditions = this.extractConditionNames(medicalInfo);
    const hba1c = this.parseNumeric(medicalInfo?.recent_lab_results?.hba1c?.value);
    const fastingGlucose = this.parseNumeric(medicalInfo?.recent_lab_results?.fasting_glucose?.value);
    const systolic = this.parseNumeric(medicalInfo?.blood_pressure?.systolic);
    const diastolic = this.parseNumeric(medicalInfo?.blood_pressure?.diastolic);
    const diversityHint = options.diversityHint || '';

    const guidelinesText = (guidelinesContext.chunks || [])
      .slice(0, MAX_GUIDELINE_CHUNKS)
      .join('\n')
      .slice(0, MAX_GUIDELINE_CHARS);

    const prompt = `Generate concise personalized daily lifestyle tips for this diabetes patient.

PATIENT PROFILE:
- Sleep hours per night: ${sleepHours} hours
- Activity level: ${activityLevel}
- Smoking status: ${smokingStatus}
- Alcohol use: ${alcoholUse}
- Height: ${height ?? 'Unknown'} cm
- Weight: ${weight ?? 'Unknown'} kg
- BMI: ${bmi ?? 'Unknown'}
- Diabetes type: ${diabetesType}
- Current medications: ${medications.length > 0 ? medications.map((m) => m.name || m).join(', ') : 'Not specified'}
- Chronic conditions: ${chronicConditions.length > 0 ? chronicConditions.join(', ') : 'Not specified'}
- HbA1c: ${hba1c ?? 'Unknown'}
- Fasting glucose: ${fastingGlucose ?? 'Unknown'}
- Blood pressure: ${systolic && diastolic ? `${systolic}/${diastolic}` : 'Unknown'}

TARGET DATE: ${new Date(targetDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}

GUIDELINES REFERENCE:
${guidelinesText || 'No regional guideline context was retrieved for this request.'}

Generate 4 categories relevant to diabetes management:
1. sleep_hygiene - 2 tips
2. stress_management - 2 tips
3. nutrition - 2 tips
4. activity - 2 tips

For each tip, provide:
- A clear, actionable title
- A short description (1-2 sentences, max 100 chars if possible)
- Priority level (high/medium/low)

Also provide 2-3 short personalized insights based on their profile.

STRICT PERSONALIZATION RULES:
- This is a personalized system; avoid generic repeated tips.
- Tailor tips directly to this profile's risk signals (sleep, BMI, smoking, alcohol, labs, chronic conditions).
- Ensure category tips and insight wording are not near-duplicates of other users on the same date.
- Internal personalization hint: ${diversityHint || 'none'}

IMPORTANT: Respond ONLY with valid JSON, no markdown, no code blocks. Use this exact structure:

{
  "categories": [
    {
      "name": "sleep_hygiene",
      "icon": "sleep",
      "tips": [
        {"title": "...", "description": "...", "priority": "high"}
      ]
    }
  ],
  "personalized_insights": ["...", "..."]
}`;

    return prompt;
  }

  async callDiabetica(prompt, options = {}) {
    const maxTokens = options.maxTokens || MAX_TOKENS;
    const temperature = typeof options.temperature === 'number' ? options.temperature : 0.3;
    try {
      console.log(`📡 Submitting to HF Gradio API...`);
      const submitRes = await axios.post(
        `${HF_SPACE_URL}/gradio_api/call/predict`,
        { data: [SYSTEM_PROMPT, prompt, maxTokens, temperature] },
        { timeout: HF_SUBMIT_TIMEOUT_MS, headers: { 'Content-Type': 'application/json' } }
      );
      const eventId = submitRes.data?.event_id;
      if (!eventId) throw new Error('No event_id returned from HF Space');
      console.log(`📝 Got event_id: ${eventId}, waiting for SSE response...`);

      const sseRes = await axios.get(
        `${HF_SPACE_URL}/gradio_api/call/predict/${eventId}`,
        { timeout: HF_SSE_TIMEOUT_MS, responseType: 'text' }
      );

      const rawText = sseRes.data || '';
      const lines = rawText.split('\n');
      let responseData = null;

      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (line.startsWith('data:')) {
          try {
            responseData = JSON.parse(line.slice(5).trim());
            break;
          } catch { /* continue scanning */ }
        }
      }

      if (!responseData || !Array.isArray(responseData) || !responseData[0]) {
        throw new Error('No valid response data in SSE stream');
      }

      return responseData[0];
    } catch (error) {
      const isTimeout = error.code === 'ECONNABORTED' || String(error.message || '').toLowerCase().includes('timeout');
      if (isTimeout) {
        throw new Error(
          `HF Diabetica API call failed: timeout after ${Math.round(HF_SSE_TIMEOUT_MS / 1000)}s. ` +
            `The model may be loading or under heavy load.`
        );
      }
      throw new Error(`HF Diabetica API call failed: ${error.message}`);
    }
  }

  _repairTruncatedJson(s) {
    let candidate = String(s || '').replace(/,\s*$/, '');
    const stack = [];
    let inString = false;

    for (let index = 0; index < candidate.length; index++) {
      const char = candidate[index];
      if (char === '\\' && inString) {
        index += 1;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (char === '{') stack.push('}');
      else if (char === '[') stack.push(']');
      else if ((char === '}' || char === ']') && stack.length > 0) stack.pop();
    }

    if (inString) candidate += '"';
    while (stack.length > 0) candidate += stack.pop();

    for (let pass = 0; pass < 4; pass++) {
      candidate = candidate.replace(/,(\s*[}\]])/g, '$1');
    }

    return candidate;
  }

  parseLifestyleTips(aiResponse) {
    console.log(`📝 Parsing lifestyle tips, response length: ${aiResponse?.length || 0}`);
    try {
      // Try to extract JSON from response
      let jsonStr = aiResponse;

      // If response is wrapped in markdown code blocks, extract it
      if (aiResponse.includes('```json')) {
        const match = aiResponse.match(/```json\n?([\s\S]*?)\n?```/);
        if (match) {
          jsonStr = match[1];
          console.log('✅ Extracted JSON from markdown code block');
        }
      } else if (aiResponse.includes('```')) {
        const match = aiResponse.match(/```\n?([\s\S]*?)\n?```/);
        if (match) {
          jsonStr = match[1];
          console.log('✅ Extracted JSON from generic code block');
        }
      }

      let parsed;
      try {
        parsed = JSON.parse(jsonStr);
      } catch (parseError) {
        const repaired = this._repairTruncatedJson(jsonStr);
        parsed = JSON.parse(repaired);
        console.log('✅ JSON parsed successfully after repair');
      }
      console.log('✅ JSON parsed successfully');

      // Validate and structure
      const categories = parsed.categories || [];
      const personalized_insights = parsed.personalized_insights || [];
      console.log(`📊 Found ${categories.length} categories, ${personalized_insights.length} insights`);

      return {
        categories: categories.map((cat) => ({
          name: cat.name,
          icon: cat.icon,
          tips: (cat.tips || []).map((tip) => ({
            title: tip.title,
            description: tip.description,
            priority: tip.priority || 'medium',
          })),
        })),
        personalized_insights,
      };
    } catch (error) {
      console.error('❌ Failed to parse lifestyle tips:', error.message);
      console.error('Response preview:', aiResponse?.substring(0, 500));
      throw new Error(`Failed to parse AI response: ${error.message}`);
    }
  }

  async getLifestyleTipsByDate(userId, date) {
    const targetDateObj = new Date(date);
    targetDateObj.setUTCHours(0, 0, 0, 0);
    
    const tips = await LifestyleTip.findOne({
      user_id: userId,
      target_date: targetDateObj,
    });
    return tips;
  }

  async getLifestyleTipsHistory(userId, limit = 10) {
    const tips = await LifestyleTip.find({ user_id: userId })
      .sort({ target_date: -1 })
      .limit(limit)
      .lean();
    return tips;
  }

  async deleteLifestyleTips(userId, tipsId) {
    const result = await LifestyleTip.deleteOne({ _id: tipsId, user_id: userId });
    if (result.deletedCount === 0) throw new Error('Tips not found');
    return true;
  }

  async getUserStats(userId) {
    const allTips = await LifestyleTip.find({ user_id: userId }).lean();

    if (allTips.length === 0) {
      return {
        totalTips: 0,
        totalCategories: 0,
        streakDays: 0,
      };
    }

    // Calculate total tips and categories
    let totalTips = 0;
    let categoriesSet = new Set();

    allTips.forEach((tip) => {
      tip.categories.forEach((cat) => {
        categoriesSet.add(cat.name);
        totalTips += cat.tips.length;
      });
    });

    // Calculate streak
    let streakDays = 0;
    const sortedDates = allTips.map((t) => new Date(t.target_date)).sort((a, b) => b - a);

    for (let i = 0; i < sortedDates.length; i++) {
      const currentDate = new Date(sortedDates[i]);
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);

      if (
        currentDate.toDateString() === expectedDate.toDateString() ||
        (i === 0 && currentDate.toDateString() === new Date().toDateString())
      ) {
        streakDays++;
      } else {
        break;
      }
    }

    return {
      totalTips,
      totalCategories: categoriesSet.size,
      streakDays,
    };
  }

  /**
   * Run full lifestyle tips generation in the background and update an existing pending doc.
   * Called after the controller has already returned 202 to the client.
   * Mirrors MonthlyDietPlanService.runBackgroundGeneration pattern.
   * @param {string} userId
   * @param {string} targetDate - 'YYYY-MM-DD'
   * @param {string} tipsId - The _id of the placeholder LifestyleTip document
   */
  async runBackgroundLifestyleTipsGeneration(userId, targetDate, tipsId) {
    const startTime = Date.now();
    const traceId = `lsbg_${tipsId}_${startTime}`;
    console.log(`🔄 [BG][${traceId}] Starting background lifestyle tips generation for user ${userId}, tips ${tipsId} (${targetDate})`);

    try {
      // 1. Get user profile
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      const personalInfoDoc = await UserPersonalInfo.findOne({ user_id: userId });
      const medicalInfoDoc  = await UserMedicalInfo.findOne({ user_id: userId });

      const personalInfo = personalInfoDoc ? personalInfoDoc.toObject() : {};
      const medicalInfo  = medicalInfoDoc  ? medicalInfoDoc.toObject()  : {};

      const region = user.country || 'Global';

      // 2. RAG context
      const guidelinesContext = await this.queryRegionalLifestyleGuidelines(region);
      console.log(`[BG] Guidelines: ${guidelinesContext.chunks?.length || 0} chunks`);

      // 3. Build target date
      const targetDateObj = new Date(targetDate);
      targetDateObj.setUTCHours(0, 0, 0, 0);

      // 4. AI generation
      const prompt     = this.buildLifestylePrompt(personalInfo, medicalInfo, guidelinesContext, targetDate, {
        diversityHint: `bg-${String(userId).slice(-6)}-${String(tipsId).slice(-4)}`,
      });
      const aiResponse = await this.callDiabetica(prompt);
      console.log(`🧠 [BG][${traceId}] AI response length: ${aiResponse?.length || 0}`);
      let parsedTips = this.parseLifestyleTips(aiResponse);

      if (!parsedTips || !parsedTips.categories || parsedTips.categories.length === 0) {
        throw new Error('No valid lifestyle tip categories generated');
      }

      const similarTipsDetected = await this.hasSimilarLifestyleTipsForDate(userId, targetDateObj, parsedTips);
      if (similarTipsDetected) {
        console.warn(`⚠️ [BG][${traceId}] Similar same-day lifestyle tips detected; regenerating with stronger personalization.`);
        const regenPrompt = this.buildLifestylePrompt(personalInfo, medicalInfo, guidelinesContext, targetDate, {
          diversityHint: `bg-regen-${String(userId).slice(-6)}-${Date.now().toString().slice(-4)}`,
        });
        const regenResponse = await this.callDiabetica(regenPrompt, { temperature: 0.5 });
        const regenerated = this.parseLifestyleTips(regenResponse);
        if (regenerated?.categories?.length > 0) {
          parsedTips = regenerated;
        }
      }

      // 5. Update the placeholder doc
      await LifestyleTip.findByIdAndUpdate(tipsId, {
        categories:            parsedTips.categories,
        personalized_insights: parsedTips.personalized_insights || [],
        sources:               guidelinesContext.sources,
        status:                'active',
        generation_status:     'complete',
        generation_error:      undefined,
        generated_at:          new Date(),
      }, { new: true });

      console.log(`✅ [BG][${traceId}] Lifestyle tips ${tipsId} completed in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);

    } catch (err) {
      console.error(`❌ [BG][${traceId}] Lifestyle tips generation failed for ${tipsId}:`, err.message);
      await LifestyleTip.findByIdAndUpdate(tipsId, {
        generation_status: 'failed',
        generation_error:  err.message,
      }).catch(() => {});
    }
  }
}

export default new LifestyleTipsService();

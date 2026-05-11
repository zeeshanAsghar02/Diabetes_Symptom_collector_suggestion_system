import ExercisePlan from '../models/ExercisePlan.js';
import { User } from '../models/User.js';
import mongoose from 'mongoose';
import regionDiscoveryService from './regionDiscoveryService.js';
import { processQuery } from './queryService.js';
import axios from 'axios';

const UserPersonalInfo = mongoose.model('UserPersonalInfo');
const UserMedicalInfo = mongoose.model('UserMedicalInfo');

class ExercisePlanService {
  toNum(value) {
    const parsed = this.parseNumber(value);
    return parsed == null ? null : parsed;
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

  buildUserHealthSnapshot(user, personalInfo, medicalInfo, goal = 'improve_fitness') {
    const dob = new Date(personalInfo?.date_of_birth || user?.date_of_birth || Date.now());
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const md = today.getMonth() - dob.getMonth();
    if (md < 0 || (md === 0 && today.getDate() < dob.getDate())) age--;

    const weight = this.toNum(personalInfo?.weight);
    const height = this.toNum(personalInfo?.height);
    const bmi = (weight && height) ? Number((weight / ((height / 100) * (height / 100))).toFixed(1)) : null;

    const personal = {
      age: Number.isFinite(age) ? age : null,
      gender: personalInfo?.gender || user?.gender || 'Unknown',
      weight,
      height,
      bmi,
      activity_level: personalInfo?.activity_level || 'Sedentary',
      smoking_status: personalInfo?.smoking_status || 'Unknown',
      alcohol_use: personalInfo?.alcohol_use || 'Unknown',
      sleep_hours: this.toNum(personalInfo?.sleep_hours),
      goal,
      country: user?.country || personalInfo?.address?.country || 'Global',
    };

    const medications = this.extractMedicationNames(medicalInfo);
    const chronicConditions = this.extractConditionNames(medicalInfo);
    const hba1c = this.toNum(medicalInfo?.recent_lab_results?.hba1c?.value);
    const fastingGlucose = this.toNum(medicalInfo?.recent_lab_results?.fasting_glucose?.value);
    const systolic = this.toNum(medicalInfo?.blood_pressure?.systolic);
    const diastolic = this.toNum(medicalInfo?.blood_pressure?.diastolic);

    const medical = {
      diabetes_type: medicalInfo?.diabetes_type || 'Type 2',
      medications,
      chronic_conditions: chronicConditions,
      hba1c,
      fasting_glucose: fastingGlucose,
      blood_pressure: (systolic && diastolic) ? `${systolic}/${diastolic}` : null,
    };

    return { personal, medical };
  }

  buildExerciseFingerprint(structured) {
    const tokens = [];
    (structured?.sessions || []).forEach((session) => {
      tokens.push(`session:${String(session?.name || '').toLowerCase()}`);
      (session?.items || []).forEach((item) => {
        tokens.push(`exercise:${String(item?.exercise || '').toLowerCase()}`);
        tokens.push(`duration:${String(item?.duration_min || '')}`);
        tokens.push(`intensity:${String(item?.intensity || '').toLowerCase()}`);
      });
    });
    (structured?.tips || []).forEach((tip) => {
      tokens.push(`tip:${String(tip || '').toLowerCase().slice(0, 80)}`);
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

  async hasSimilarExercisePlanForDate(userId, targetDateObj, structured) {
    const fingerprint = this.buildExerciseFingerprint(structured);
    if (!fingerprint) return false;

    const others = await ExercisePlan.find({
      user_id: { $ne: userId },
      target_date: targetDateObj,
      $or: [
        { generation_status: 'complete' },
        { status: 'final' },
      ],
    })
      .select('sessions tips')
      .limit(12)
      .lean();

    for (const other of others) {
      const otherFingerprint = this.buildExerciseFingerprint(other || {});
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

  // Extract a number from varied AI outputs (e.g., "180-270 kcal", "60 min", 45)
  parseNumber(value) {
    if (typeof value === 'number' && !Number.isNaN(value)) return value;
    if (!value) return null;
    const matches = String(value).match(/[-+]?[0-9]*\.?[0-9]+/g);
    if (!matches || matches.length === 0) return null;
    // If range present, take average of first two numbers; else first number
    if (matches.length >= 2) {
      const a = parseFloat(matches[0]);
      const b = parseFloat(matches[1]);
      if (!Number.isNaN(a) && !Number.isNaN(b)) return Math.round((a + b) / 2);
    }
    const n = parseFloat(matches[0]);
    return Number.isNaN(n) ? null : n;
  }
  async generateExercisePlan(userId, targetDate, goal = 'improve_fitness') {
    console.log(`📋 Generating exercise plan for userId: ${userId}, targetDate: ${targetDate}, goal: ${goal}`);
    
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    console.log(`✅ User found: ${user.email}`);

    const personalInfo = await UserPersonalInfo.findOne({ user_id: userId });
    const medicalInfo = await UserMedicalInfo.findOne({ user_id: userId });
    console.log(`📊 PersonalInfo found: ${!!personalInfo}, MedicalInfo found: ${!!medicalInfo}`);
    
    if (!personalInfo) throw new Error('Personal information not found. Please complete your profile first.');

    const { personal, medical } = this.buildUserHealthSnapshot(user, personalInfo, medicalInfo, goal);

    // Normalize to UTC midnight to avoid timezone issues
    const targetDateObj = new Date(targetDate);
    targetDateObj.setUTCHours(0, 0, 0, 0);
    const existing = await ExercisePlan.findOne({ user_id: userId, target_date: targetDateObj });
    if (existing) throw new Error('Exercise plan already exists for this date. View your existing plan or choose a different date.');

    const regionCoverage = await regionDiscoveryService.checkRegionCoverage(personal.country, 'exercise_recommendation');
    let userRegion = personal.country;
    if (!regionCoverage.canGeneratePlan) {
      const fallback = await regionDiscoveryService.getFallbackRegion(userRegion, 'exercise_recommendation');
      if (fallback) {
        userRegion = fallback;
        console.log(`Using fallback region: ${fallback}`);
      } else {
        console.log(`⚠️ No exercise documents for ${userRegion}, AI will use built-in knowledge`);
      }
    }

    const context = await this.queryRegionalExercise(userRegion);
    console.log(`📚 RAG context: ${context.chunks.length} chunks retrieved`);

    const prompt = this.buildExercisePrompt(personal, medical, context, targetDateObj, {
      diversityHint: `user-${String(userId).slice(-6)}`,
    });
    let structured;
    try {
      const aiResponse = await this.callLMStudio(prompt);
      structured = this.parseExercisePlan(aiResponse);
      console.log('✅ Exercise plan parsed successfully:', JSON.stringify(structured, null, 2));
    } catch (lmError) {
      console.error('❌ AI generation error:', lmError.message);
      throw new Error(`AI generation failed: ${lmError.message}`);
    }

    if (!structured || !structured.sessions || structured.sessions.length === 0) {
      console.error('❌ No valid exercise sessions generated');
      throw new Error('Failed to generate exercise plan: No valid sessions created');
    }

    const similarPlanDetected = await this.hasSimilarExercisePlanForDate(userId, targetDateObj, structured);
    if (similarPlanDetected) {
      console.warn('⚠️ Similar same-day exercise plan detected for another user; regenerating with stronger personalization.');
      const regenPrompt = this.buildExercisePrompt(personal, medical, context, targetDateObj, {
        diversityHint: `regen-${String(userId).slice(-6)}-${Date.now().toString().slice(-4)}`,
      });
      const regenResponse = await this.callLMStudio(regenPrompt, { temperature: 0.5 });
      const regenerated = this.parseExercisePlan(regenResponse);
      if (regenerated?.sessions?.length > 0) {
        structured = regenerated;
      }
    }

    const totals = this.calculateTotals(structured.sessions, personal.weight);
    console.log('✅ Calculated totals:', totals);

    const plan = new ExercisePlan({
      user_id: userId,
      target_date: targetDateObj,
      region: userRegion,
      sessions: structured.sessions,
      totals: totals,
      sources: context.sources,
      tips: structured.tips || [],
      status: 'final',
      generated_at: new Date(),
    });

    await plan.save();
    console.log(`✅ Exercise plan saved with ID: ${plan._id}`);

    return {
      success: true,
      plan: plan,
      region_coverage: regionCoverage,
    };
  }

  async getExercisePlanByDate(userId, targetDate) {
    try {
      const targetDateObj = new Date(targetDate);
      targetDateObj.setUTCHours(0, 0, 0, 0);
      const plan = await ExercisePlan.findOne({
        user_id: userId,
        target_date: targetDateObj,
      });
      return plan;
    } catch (error) {
      console.error('Error fetching exercise plan by date:', error);
      throw error;
    }
  }

  async getExercisePlanById(userId, planId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(String(planId))) return null;
      const plan = await ExercisePlan.findOne({ _id: planId, user_id: userId });
      return plan;
    } catch (error) {
      console.error(`Error fetching exercise plan by ID ${planId}:`, error);
      throw error;
    }
  }

  async getExercisePlanHistory(userId, limit = 10) {
    try {
      const plans = await ExercisePlan.find({ user_id: userId })
        .sort({ target_date: -1 })
        .limit(limit);
      return plans;
    } catch (error) {
      console.error(`Error fetching exercise plan history for user ${userId}:`, error);
      throw error;
    }
  }

  async deleteExercisePlan(userId, planId) {
    try {
      const result = await ExercisePlan.findOneAndDelete({ _id: planId, user_id: userId });
      return result !== null;
    } catch (error) {
      console.error(`Error deleting exercise plan ${planId}:`, error);
      throw error;
    }
  }

  async queryRegionalExercise(region) {
    const queries = [
      `${region} physical activity recommendations adults diabetes`,
      `${region} exercise guidelines intensity duration frequency diabetes`,
      `${region} WHO physical activity moderate vigorous minutes per week`,
    ];

    const all = []; const seen = new Set();
    
    // Attempt 1: with region filter
    const filter = { country: region, doc_type: { $in: ['exercise_recommendation', 'guideline'] } };
    for (const q of queries) {
      try {
        const response = await processQuery(q, { filter, topK: 5 });
        const results = response.results || [];
        results.forEach(r => { const k = (r.text||'').substring(0,100); if (!seen.has(k)) { seen.add(k); all.push(r); } });
      } catch (e) { 
        console.log(`⚠️ Query failed for "${q}" with filter:`, e.message);
      }
    }
    
    // Attempt 2: doc_type only (no region)
    if (all.length === 0) {
      console.log('⚠️ No results with region filter, trying doc_type only...');
      for (const q of queries) {
        try {
          const response = await processQuery(q, { filter: { doc_type: { $in: ['exercise_recommendation', 'guideline'] } }, topK: 5 });
          const results = response.results || [];
          results.forEach(r => { const k = (r.text||'').substring(0,100); if (!seen.has(k)) { seen.add(k); all.push(r); } });
        } catch (e) { 
          console.log(`⚠️ Fallback query failed:`, e.message);
        }
      }
    }
    
    // Attempt 3: no filter at all
    if (all.length === 0) {
      console.log('⚠️ No results with doc_type filter, trying no filter...');
      for (const q of queries) {
        try {
          const response = await processQuery(q, { topK: 5 });
          const results = response.results || [];
          results.forEach(r => { const k = (r.text||'').substring(0,100); if (!seen.has(k)) { seen.add(k); all.push(r); } });
        } catch (e) { 
          console.log(`⚠️ No-filter query failed:`, e.message);
        }
      }
    }
    
    // Return whatever we got (even empty) - LLM will use built-in knowledge
    console.log(`📥 Retrieved ${all.length} exercise context chunks`);
    return { chunks: all.map(r => r.text), sources: this.extractSources(all) };
  }

  extractSources(results) {
    const map = new Map();
    results.forEach(r => {
      const t = r.metadata?.title; if (t && !map.has(t)) map.set(t, { title: t, country: r.metadata.country || 'Global', doc_type: r.metadata.doc_type || 'exercise_recommendation' });
    });
    return Array.from(map.values());
  }

  buildExercisePrompt(personal, medical, context, dateObj, options = {}) {
    const dateStr = dateObj.toISOString().split('T')[0];
    const diversityHint = options.diversityHint || '';
    const ctx = context.chunks.length > 0 
      ? context.chunks.slice(0,5).map((c,i) => `[${i+1}] ${c.substring(0,100)}`).join('\n')
      : 'No regional documents available - use your built-in exercise physiology knowledge for diabetes patients.';
    
    return `You are an exercise physiologist specializing in diabetes care.
Create a daily exercise plan for DATE: ${dateStr}

PATIENT PROFILE:
- Age: ${personal.age}, Gender: ${personal.gender}
- Weight: ${personal.weight}kg, Height: ${personal.height}cm
- BMI: ${personal.bmi ?? 'Not provided'}
- Activity Level: ${personal.activity_level}
- Sleep Hours: ${personal.sleep_hours ?? 'Unknown'}
- Smoking Status: ${personal.smoking_status}
- Alcohol Use: ${personal.alcohol_use}
- Country/Region: ${personal.country}
- Diabetes Type: ${medical.diabetes_type}
- Medications: ${(medical.medications||[]).join(', ') || 'None specified'}
- Chronic Conditions: ${(medical.chronic_conditions||[]).join(', ') || 'None specified'}
- HbA1c: ${medical.hba1c ?? 'Unknown'}
- Fasting Glucose: ${medical.fasting_glucose ?? 'Unknown'}
- Blood Pressure: ${medical.blood_pressure ?? 'Unknown'}

REGIONAL CONTEXT:
${ctx}

REQUIREMENTS:
- Create 2-3 exercise sessions (morning, afternoon, or evening)
- Total daily duration: 45-90 minutes
- Include mix of: aerobic, resistance/strength, flexibility
- All numerical values must be plain numbers (no units in JSON)
- duration_min: number of minutes (e.g., 15, 30)
- estimated_calories: number (e.g., 150, 200)
- This is a personalized system; tailor the plan to this exact profile and do not output a generic template.
- If profile contains risk signals (high BMI, poor sleep, smoking, elevated HbA1c), adjust intensity/progression and precautions accordingly.
- Ensure exercise names, duration splits, and tips are not a near-duplicate of other users for the same date.
- Internal personalization hint: ${diversityHint || 'none'}

Return ONLY valid JSON with this structure:
{
  "sessions": [
    {
      "name": "Morning Workout",
      "time": "7:00 AM",
      "type": "aerobic",
      "items": [
        {"exercise": "Brisk Walking", "category": "Cardio", "intensity": "Moderate", "duration_min": 20, "mets": 4.5, "estimated_calories": 150, "notes": "Maintain steady pace", "precautions": ["Check blood sugar before"]}
      ]
    }
  ],
  "tips": ["Monitor blood sugar before and after exercise", "Stay hydrated"]
}`;
  }

  /**
   * Call Diabetica-7B via HF Gradio API (same as diet plan service)
   */
  async callLMStudio(prompt, options = {}) {
    const hfBase = process.env.LLM_API_URL || process.env.HF_SPACE_URL || 'https://zeeshanasghar02-diabetica-api.hf.space';
    const MAX_TOKENS = options.maxTokens || 2048;
    const temperature = typeof options.temperature === 'number' ? options.temperature : 0.3;
    const systemPrompt = options.systemPrompt || 'You are an exercise physiologist AI specializing in diabetes care. Respond with ONLY valid JSON - no markdown, no code blocks, no explanations outside JSON.';

    try {
      console.log(`🤖 Calling Diabetica-7B via HF Gradio at ${hfBase}`);

      // Step 1: Submit job
      const submitRes = await axios.post(
        `${hfBase}/gradio_api/call/predict`,
        { data: [systemPrompt, prompt, MAX_TOKENS, temperature] },
        { timeout: 30000 }
      );
      const { event_id } = submitRes.data;
      if (!event_id) throw new Error('HF Gradio did not return an event_id');
      console.log(`   HF event_id: ${event_id} — waiting for result...`);

      // Step 2: Read SSE stream — 120s timeout
      const sseRes = await axios.get(
        `${hfBase}/gradio_api/call/predict/${event_id}`,
        { timeout: 120000, responseType: 'text' }
      );

      const raw = sseRes.data || '';

      // Step 3: Detect Gradio error events immediately
      if (raw.includes('event: error')) {
        const errMatch = raw.match(/event: error[\s\S]*?data:\s*({[^\n]*}|null)/m);
        const errMsg = errMatch?.[1] && errMatch[1] !== 'null'
          ? (JSON.parse(errMatch[1])?.message || 'Gradio returned an error event')
          : 'Gradio returned an error event';
        throw new Error(`Gradio error: ${errMsg}`);
      }

      // Step 4: Parse SSE — scan backward for the last data line with output
      const lines = raw.split('\n');
      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i].trim();
        if (line.startsWith('data:')) {
          try {
            const json = JSON.parse(line.slice(5).trim());
            if (Array.isArray(json) && typeof json[0] === 'string') return json[0];
            if (Array.isArray(json) && Array.isArray(json[0])) return json[0][0];
            if (json?.output?.data?.[0]) return json.output.data[0];
          } catch { /* keep scanning */ }
        }
      }
      throw new Error(`Could not parse Gradio SSE response. Raw (first 400): ${raw.substring(0, 400)}`);

    } catch (error) {
      console.error('❌ Error calling HF Diabetica:', error.message);
      if (error.code === 'ECONNREFUSED' || error.response?.status === 503) {
        throw new Error('Diabetica model is offline. Please check the HF Space or try again in a few minutes.');
      } else if (error.message.includes('timeout') || error.code === 'ECONNABORTED') {
        throw new Error('AI model took too long to respond. Please try again.');
      }
      throw new Error(`AI generation failed: ${error.message}`);
    }
  }

  async repairExerciseJson(rawResponse) {
    const repairSystemPrompt = 'You repair malformed JSON for exercise plans. Return ONLY valid JSON with keys "sessions" and "tips". No markdown, no prose.';
    const repairPrompt = `Fix the malformed JSON below into strict valid JSON using this schema:\n\n{\n  "sessions": [\n    {\n      "name": "string",\n      "time": "string",\n      "type": "string",\n      "items": [\n        {\n          "exercise": "string",\n          "category": "string",\n          "intensity": "string",\n          "duration_min": number,\n          "mets": number,\n          "estimated_calories": number,\n          "notes": "string",\n          "precautions": ["string"]\n        }\n      ]\n    }\n  ],\n  "tips": ["string"]\n}\n\nMALFORMED JSON:\n${String(rawResponse || '').slice(0, 6000)}`;

    return this.callLMStudio(repairPrompt, {
      systemPrompt: repairSystemPrompt,
      maxTokens: 2048,
      temperature: 0.1,
    });
  }

  parseExercisePlan(aiResponse) {
    console.log(`📝 Parsing AI response (length: ${aiResponse?.length || 0})`);

    const tryParse = (text, label) => {
      try {
        const parsed = JSON.parse(text);
        if (!parsed.sessions || !Array.isArray(parsed.sessions)) throw new Error('Invalid sessions structure');
        parsed.sessions = parsed.sessions.map(s => {
          const sessionType = (s.type || '').toLowerCase();
          const items = (s.items||[])
            .filter(i => i && i.exercise && i.exercise.trim().length > 0) // Filter out invalid items
            .map(i => {
            const duration = this.parseNumber(i.duration_min);
            const mets = this.parseNumber(i.mets);
            const estCals = this.parseNumber(i.estimated_calories);

            // Ensure duration_min has a valid value (required by Mongoose)
            const validDuration = duration != null && duration > 0 ? duration : 15; // Default to 15 min if invalid

            // Ensure intensity is always present for Mongoose validation
            let intensity = i.intensity;
            const category = (i.category || '').toLowerCase();
            if (!intensity) {
              if (category.includes('flex') || sessionType.includes('flex')) {
                intensity = 'Low';
              } else if (category.includes('strength') || category.includes('resistance')) {
                intensity = 'Moderate';
              } else if (category.includes('aerobic') || sessionType.includes('aerobic') || category.includes('cardio')) {
                intensity = 'Moderate';
              } else {
                intensity = 'Moderate';
              }
            }

            // Parse precautions - handle string, array, or complex objects
            let precautions = [];
            if (i.precautions) {
              if (typeof i.precautions === 'string') {
                try {
                  // Try to parse if it's a stringified JSON
                  const parsed = JSON.parse(i.precautions);
                  if (Array.isArray(parsed)) {
                    // Extract text from objects or use strings directly
                    precautions = parsed.map(p => typeof p === 'object' ? (p.text || p.description || JSON.stringify(p)) : String(p));
                  } else {
                    precautions = [String(parsed)];
                  }
                } catch (e) {
                  // Not JSON, treat as a single precaution string
                  precautions = [i.precautions];
                }
              } else if (Array.isArray(i.precautions)) {
                // Extract text from objects or use strings directly
                precautions = i.precautions.map(p => typeof p === 'object' ? (p.text || p.description || JSON.stringify(p)) : String(p));
              } else if (typeof i.precautions === 'object') {
                // Single object, extract text
                precautions = [i.precautions.text || i.precautions.description || JSON.stringify(i.precautions)];
              }
            }

            return {
              exercise: i.exercise.trim(),
              category: i.category || 'General',
              duration_min: validDuration,
              intensity,
              mets,
              estimated_calories: estCals,
              heart_rate_zone: i.heart_rate_zone,
              notes: i.notes,
              precautions: precautions
            };
          });
          const totalDuration = items.reduce((a,i)=>a+(i.duration_min||0),0);
          const totalCalories = items.reduce((a,i)=>a+(i.estimated_calories||0),0);
          return {
            name: s.name,
            time: s.time,
            type: s.type || 'any',
            items,
            total_duration_min: totalDuration,
            total_estimated_calories: totalCalories
          };
        });
        console.log(`✅ Parsed JSON via ${label}`);
        // Normalize tips: accept array of strings or array of {text,details}
        let tips = parsed.tips || [];
        if (Array.isArray(tips)) {
          tips = tips.map(t => {
            if (typeof t === 'string') return t;
            if (t && typeof t === 'object') {
              const text = t.text || '';
              const details = t.details || t.detail || '';
              return details ? `${text} ${details}`.trim() : text;
            }
            return String(t || '').trim();
          }).filter(Boolean);
        } else if (tips && typeof tips === 'object') {
          tips = Object.values(tips).map(v => String(v||'').trim()).filter(Boolean);
        } else {
          tips = [];
        }
        return { sessions: parsed.sessions, tips };
      } catch (err) {
        console.log(`⚠️ ${label} parse failed: ${err.message}`);
        return null;
      }
    };

    // 1) Direct parse
    const direct = tryParse(aiResponse, 'direct');
    if (direct) return direct;

    // 2) Markdown fenced JSON
    const fence = aiResponse && aiResponse.match(/```json\s*([\s\S]*?)\s*```/);
    if (fence) {
      const fenced = tryParse(fence[1], 'markdown fenced');
      if (fenced) return fenced;
    }

    // 3) Best-effort extraction + sanitization (remove trailing commas)
    const extractRawJson = (text) => {
      if (!text) return null;
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start === -1 || end === -1 || end <= start) return null;
      let candidate = text.slice(start, end + 1);
      // Remove trailing commas before closing braces/brackets
      candidate = candidate.replace(/,\s*([}\]])/g, '$1');
      return candidate;
    };

    const extracted = extractRawJson(aiResponse);
    if (extracted) {
      const sanitized = tryParse(extracted, 'sanitized extraction');
      if (sanitized) return sanitized;
    }

    // 4) Fallback: find JSON object with "sessions" key anywhere
    const jsonMatch = aiResponse && aiResponse.match(/\{[\s\S]*"sessions"[\s\S]*\}/);
    if (jsonMatch) {
      const cleaned = jsonMatch[0].replace(/,\s*([}\]])/g, '$1');
      const matched = tryParse(cleaned, 'regex match');
      if (matched) return matched;
    }

    console.error('❌ All parsing attempts failed. Response preview:', aiResponse?.substring(0, 200));
    console.error('Full response for debugging:', aiResponse);
    throw new Error('Unable to parse exercise plan from AI response. LM Studio may not be returning valid JSON. Check logs for full response.');
  }

  calculateTotals(sessions, weightKg) {
    const totals = { duration_total_min: 0, calories_total: 0, sessions_count: sessions?.length||0 };
    sessions?.forEach(s => {
      totals.duration_total_min += s.total_duration_min||0;
      if (s.items) {
        s.items.forEach(i => {
          // If estimated_calories missing, approximate via METs
          if (i.estimated_calories == null && i.mets && i.duration_min && weightKg) {
            // kcal ≈ METs * 3.5 * weight(kg) / 200 * minutes
            const kcalPerMin = (i.mets * 3.5 * weightKg) / 200;
            i.estimated_calories = Math.round(kcalPerMin * i.duration_min);
          }
          totals.calories_total += i.estimated_calories||0;
        });
      }
    });
    return totals;
  }

  /**
   * Run full generation in the background and update an existing pending plan doc.
   * Called after the controller has already returned 202 to the client.
   * Mirrors MonthlyDietPlanService.runBackgroundGeneration pattern.
   * @param {string} userId
   * @param {string} targetDate - 'YYYY-MM-DD'
   * @param {string} planId - The _id of the placeholder ExercisePlan document
   */
  async runBackgroundExerciseGeneration(userId, targetDate, planId) {
    const startTime = Date.now();
    const traceId = `exbg_${planId}_${startTime}`;
    console.log(`🔄 [BG][${traceId}] Starting background exercise plan generation for user ${userId}, plan ${planId} (${targetDate})`);

    try {
      // 1. Get user profile
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      const personalInfo = await UserPersonalInfo.findOne({ user_id: userId });
      const medicalInfo  = await UserMedicalInfo.findOne({ user_id: userId });
      if (!personalInfo) throw new Error('Personal information not found. Please complete your profile first.');

      // Calculate age
      const dob = new Date(personalInfo.date_of_birth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const md = today.getMonth() - dob.getMonth();
      if (md < 0 || (md === 0 && today.getDate() < dob.getDate())) age--;

      const { personal, medical } = this.buildUserHealthSnapshot(user, personalInfo, medicalInfo, 'improve_fitness');

      // 2. Region coverage
      let userRegion = personal.country;
      const regionCoverage = await regionDiscoveryService.checkRegionCoverage(userRegion, 'exercise_recommendation');
      if (!regionCoverage.canGeneratePlan) {
        const fallback = await regionDiscoveryService.getFallbackRegion(userRegion, 'exercise_recommendation');
        if (fallback) userRegion = fallback;
      }

      // 3. RAG context
      const context = await this.queryRegionalExercise(userRegion);
      console.log(`[BG] RAG context: ${context.chunks.length} chunks`);

      // 4. Build target date object (UTC midnight)
      const [yStr, mStr, dStr] = String(targetDate).split('-');
      const targetDateObj = new Date(parseInt(yStr), parseInt(mStr) - 1, parseInt(dStr));
      targetDateObj.setUTCHours(0, 0, 0, 0);

      // 5. AI generation via HF Gradio
      const prompt = this.buildExercisePrompt(personal, medical, context, targetDateObj, {
        diversityHint: `bg-${String(userId).slice(-6)}-${String(planId).slice(-4)}`,
      });
      let aiResponse = await this.callLMStudio(prompt);
      console.log(`🧠 [BG][${traceId}] AI response length: ${aiResponse?.length || 0}`);

      let structured;
      let parseError;
      try {
        structured = this.parseExercisePlan(aiResponse);
      } catch (err) {
        parseError = err;
      }

      if (!structured) {
        console.warn(`⚠️ [BG][${traceId}] Initial parse failed, attempting JSON repair pass...`);
        const repairedResponse = await this.repairExerciseJson(aiResponse);
        console.log(`🧠 [BG][${traceId}] Repair response length: ${repairedResponse?.length || 0}`);
        structured = this.parseExercisePlan(repairedResponse);
      }

      if (!structured || !structured.sessions || structured.sessions.length === 0) {
        if (parseError) throw parseError;
        throw new Error('No valid exercise sessions generated');
      }

      const similarPlanDetected = await this.hasSimilarExercisePlanForDate(userId, targetDateObj, structured);
      if (similarPlanDetected) {
        console.warn(`⚠️ [BG][${traceId}] Similar same-day exercise plan detected; regenerating with stronger personalization.`);
        const regenPrompt = this.buildExercisePrompt(personal, medical, context, targetDateObj, {
          diversityHint: `bg-regen-${String(userId).slice(-6)}-${Date.now().toString().slice(-4)}`,
        });
        const regenResponse = await this.callLMStudio(regenPrompt, { temperature: 0.5 });
        const regenerated = this.parseExercisePlan(regenResponse);
        if (regenerated?.sessions?.length > 0) {
          structured = regenerated;
        }
      }

      const totals = this.calculateTotals(structured.sessions, personal.weight);

      // 6. Update placeholder doc with full data
      await ExercisePlan.findByIdAndUpdate(planId, {
        region:           userRegion,
        sessions:         structured.sessions,
        totals,
        sources:          context.sources,
        tips:             structured.tips || [],
        status:           'final',
        generation_status: 'complete',
        generation_error: undefined,
        generated_at:     new Date(),
      }, { new: true });

      console.log(`✅ [BG][${traceId}] Exercise plan ${planId} completed in ${((Date.now() - startTime) / 1000).toFixed(1)}s`);

    } catch (err) {
      console.error(`❌ [BG][${traceId}] Exercise plan generation failed for ${planId}:`, err.message);
      await ExercisePlan.findByIdAndUpdate(planId, {
        generation_status: 'failed',
        generation_error:  err.message,
      }).catch(() => {});
    }
  }
}

export default new ExercisePlanService();

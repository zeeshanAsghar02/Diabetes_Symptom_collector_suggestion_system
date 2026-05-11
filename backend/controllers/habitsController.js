import { WeeklyHabits } from '../models/WeeklyHabits.js';
import { UserPersonalInfo } from '../models/UserPersonalInfo.js';
import { UserMedicalInfo } from '../models/UserMedicalInfo.js';
import { enhanceChatWithRAG } from '../services/ragService.js';

const HF_SPACE_URL = process.env.LLM_API_URL || process.env.HF_SPACE_URL || 'https://zeeshanasghar02-diabetica-api.hf.space';
const HF_SUBMIT_TIMEOUT_MS = 30000;
const HF_SSE_TIMEOUT_MS = 90000;
const HF_MAX_TOKENS = 768;
const MAX_HABITS_RAG_QUERY_CHARS = 240;
const MAX_HABITS_RAG_CONTEXT_CHARS = 1600;
const inFlightHabitGenerations = new Map();

// Helper to get start and end of current week (Friday to Thursday)
const getCurrentWeekBounds = () => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 5 = Friday
  
  // Calculate days since last Friday
  const daysSinceFriday = (dayOfWeek + 2) % 7; // Friday = 5, we want 0
  
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - daysSinceFriday);
  weekStart.setHours(0, 0, 0, 0);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  return { weekStart, weekEnd };
};

// Build clinical snapshot for habit generation
const buildClinicalSnapshot = (personal, medical) => {
  const snapshot = {
    demographic: {},
    physical: {},
    medical: {},
    lifestyle: {}
  };
  
  // Demographic
  if (personal?.gender) snapshot.demographic.gender = personal.gender;
  if (personal?.date_of_birth) {
    const age = Math.floor((Date.now() - new Date(personal.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    snapshot.demographic.age = age;
  }
  
  // Physical metrics
  if (personal?.height) snapshot.physical.height = personal.height;
  if (personal?.weight) {
    snapshot.physical.weight = personal.weight;
    if (personal.height) {
      snapshot.physical.bmi = parseFloat((personal.weight / Math.pow(personal.height / 100, 2)).toFixed(1));
    }
  }
  
  // Lifestyle
  if (personal?.activity_level) snapshot.lifestyle.activityLevel = personal.activity_level;
  if (personal?.sleep_hours) snapshot.lifestyle.sleepHours = personal.sleep_hours;
  if (personal?.dietary_preference) snapshot.lifestyle.dietPreference = personal.dietary_preference;
  if (personal?.smoking_status) snapshot.lifestyle.smokingStatus = personal.smoking_status;
  if (personal?.alcohol_use) snapshot.lifestyle.alcoholUse = personal.alcohol_use;
  
  // Medical information
  if (medical?.diabetes_type) snapshot.medical.diabetesType = medical.diabetes_type;
  if (medical?.diagnosis_date) {
    const years = Math.floor((Date.now() - new Date(medical.diagnosis_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    snapshot.medical.diabetesDuration = years;
  }
  
  if (medical?.current_medications?.length) {
    snapshot.medical.medications = medical.current_medications
      .filter(Boolean)
      .map(m => m.medication_name || 'Unknown')
      .filter(name => name !== 'Unknown');
  }
  
  if (medical?.chronic_conditions?.length) {
    snapshot.medical.chronicConditions = medical.chronic_conditions
      .filter(Boolean)
      .map(c => c.condition_name || 'Unknown')
      .filter(name => name !== 'Unknown');
  }
  
  if (medical?.allergies?.length) {
    snapshot.medical.allergies = medical.allergies
      .filter(Boolean)
      .map(a => a.allergen || 'Unknown')
      .filter(name => name !== 'Unknown');
  }
  
  return snapshot;
};

// Format snapshot as readable text
const formatSnapshotText = (snapshot) => {
  const lines = [];
  
  if (snapshot.demographic.age) lines.push(`Age: ${snapshot.demographic.age} years`);
  if (snapshot.demographic.gender) lines.push(`Gender: ${snapshot.demographic.gender}`);
  if (snapshot.physical.height) lines.push(`Height: ${snapshot.physical.height} cm`);
  if (snapshot.physical.weight) lines.push(`Weight: ${snapshot.physical.weight} kg`);
  if (snapshot.physical.bmi) {
    const bmiCategory = snapshot.physical.bmi < 18.5 ? 'Underweight' :
                        snapshot.physical.bmi < 25 ? 'Normal' :
                        snapshot.physical.bmi < 30 ? 'Overweight' : 'Obese';
    lines.push(`BMI: ${snapshot.physical.bmi} (${bmiCategory})`);
  }
  
  if (snapshot.medical.diabetesType) lines.push(`Diabetes Type: ${snapshot.medical.diabetesType}`);
  if (snapshot.medical.diabetesDuration !== undefined) lines.push(`Years with Diabetes: ${snapshot.medical.diabetesDuration}`);
  
  if (snapshot.lifestyle.activityLevel) lines.push(`Activity Level: ${snapshot.lifestyle.activityLevel}`);
  if (snapshot.lifestyle.sleepHours) lines.push(`Sleep: ${snapshot.lifestyle.sleepHours} hours/night`);
  if (snapshot.lifestyle.dietPreference) lines.push(`Diet Preference: ${snapshot.lifestyle.dietPreference}`);
  if (snapshot.lifestyle.smokingStatus) lines.push(`Smoking: ${snapshot.lifestyle.smokingStatus}`);
  if (snapshot.lifestyle.alcoholUse) lines.push(`Alcohol: ${snapshot.lifestyle.alcoholUse}`);
  
  if (snapshot.medical.medications?.length) {
    lines.push(`Medications: ${snapshot.medical.medications.join(', ')}`);
  }
  
  if (snapshot.medical.chronicConditions?.length) {
    lines.push(`Chronic Conditions: ${snapshot.medical.chronicConditions.join(', ')}`);
  }
  
  if (snapshot.medical.allergies?.length) {
    lines.push(`Allergies: ${snapshot.medical.allergies.join(', ')}`);
  }
  
  return lines.join('\n');
};

const buildHabitRetrievalQuery = (snapshot) => {
  const parts = [
    snapshot.medical.diabetesType,
    snapshot.lifestyle.activityLevel,
    snapshot.lifestyle.dietPreference,
    snapshot.physical.bmi ? `BMI ${snapshot.physical.bmi}` : '',
    'weekly diabetes habits Pakistan',
  ].filter(Boolean);

  return parts.join(' ').slice(0, MAX_HABITS_RAG_QUERY_CHARS);
};

const repairTruncatedJson = (input) => {
  let candidate = String(input || '').replace(/,\s*$/, '');
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
};

const parseHabitsJson = (rawContent) => {
  const jsonMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || rawContent.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : rawContent;

  try {
    return JSON.parse(jsonStr);
  } catch {
    return JSON.parse(repairTruncatedJson(jsonStr));
  }
};

const callHabitsModel = async (systemPrompt, userPrompt) => {
  console.log('[HABITS] Calling HF Diabetica API...');
  const submitRes = await fetch(`${HF_SPACE_URL}/gradio_api/call/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: [systemPrompt, userPrompt, HF_MAX_TOKENS, 0.3] }),
    signal: AbortSignal.timeout(HF_SUBMIT_TIMEOUT_MS),
  });

  if (!submitRes.ok) {
    throw new Error(`HF submit failed with status ${submitRes.status}`);
  }

  const submitData = await submitRes.json();
  const eventId = submitData?.event_id;
  if (!eventId) {
    throw new Error('No event_id returned from HF Space');
  }

  console.log('[HABITS] Got event_id:', eventId);
  const sseRes = await fetch(`${HF_SPACE_URL}/gradio_api/call/predict/${eventId}`, {
    signal: AbortSignal.timeout(HF_SSE_TIMEOUT_MS),
  });

  if (!sseRes.ok) {
    throw new Error(`HF SSE failed with status ${sseRes.status}`);
  }

  const rawText = await sseRes.text();
  const lines = rawText.split('\n');

  for (let index = lines.length - 1; index >= 0; index--) {
    const line = lines[index].trim();
    if (!line.startsWith('data:')) continue;

    try {
      const payload = JSON.parse(line.slice(5).trim());
      if (Array.isArray(payload) && typeof payload[0] === 'string' && payload[0].trim()) {
        return payload[0].trim();
      }
    } catch {
      // Keep scanning
    }
  }

  throw new Error('HF AI service returned an empty response');
};

// Generate weekly habits using LLM + RAG
export const generateWeeklyHabits = async (req, res) => {
  try {
    console.log('[HABITS] Starting weekly habits generation');
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated.' });
    }
    
    // Check if active habits exist for current week
    const { weekStart, weekEnd } = getCurrentWeekBounds();
    console.log('[HABITS] Week bounds:', { weekStart, weekEnd });
    const requestKey = `${String(userId)}:${weekStart.toISOString()}`;

    if (inFlightHabitGenerations.has(requestKey)) {
      console.log('[HABITS] Returning existing in-flight generation for current week');
      return res.json(await inFlightHabitGenerations.get(requestKey));
    }
    
    const existingHabits = await WeeklyHabits.findOne({
      user_id: userId,
      weekStartDate: weekStart,
      status: 'active'
    });
    
    if (existingHabits) {
      console.log('[HABITS] Active habits found for current week');
      return res.json({
        success: true,
        data: existingHabits,
        message: 'Current week habits retrieved successfully'
      });
    }
    
    // Fetch user profile data
    console.log('[HABITS] Fetching user profile for habit generation');
    const [personal, medical] = await Promise.all([
      UserPersonalInfo.findOne({ user_id: userId }),
      UserMedicalInfo.findOne({ user_id: userId })
    ]);
    
    if (!personal || !medical) {
      return res.status(400).json({
        success: false,
        message: 'Complete your health profile before generating habits'
      });
    }
    
    // Build clinical snapshot
    const clinicalSnapshot = buildClinicalSnapshot(personal, medical);
    const snapshotText = formatSnapshotText(clinicalSnapshot);
    
    console.log('[HABITS] Clinical snapshot:', snapshotText);
    
    // Build compact prompt for habit generation
    const habitPrompt = `Generate a personalized weekly habit plan for this patient.

PATIENT PROFILE:
${snapshotText}

IMPORTANT GUIDELINES:
  1. Generate 5-7 specific, measurable habits.
  2. Do not recommend glucose monitoring devices, blood tests, or IoT tools.
  3. Focus on diet, exercise, medication adherence, sleep, stress, and lifestyle.
  4. Keep each description concise and practical.
  5. Consider Pakistani cultural context.

RESPONSE FORMAT (MUST be valid JSON):
{
  "habits": [
    {
      "id": "habit-1",
      "category": "diet|exercise|medication|lifestyle|sleep|stress",
      "title": "Clear, action-oriented title (max 50 chars)",
      "description": "Detailed explanation of what to do and why (max 120 chars)",
      "targetValue": "Specific measurable target (e.g., '30 minutes', '8 glasses', '10000 steps')",
      "unit": "Unit of measurement (e.g., 'minutes', 'glasses', 'steps', 'times')",
      "frequency": "daily|multiple_times_daily|weekly|as_needed",
      "timeOfDay": ["morning", "afternoon", "evening", "night"],
      "priority": "high|medium|low",
      "medicalReason": "Why this matters for diabetes management (max 100 chars)",
      "tips": ["Practical tip 1", "Practical tip 2", "Practical tip 3"]
    }
  ],
  "weekSummary": "One paragraph overview of this week's focus areas and expected outcomes"
}
Generate habits that are practical, culturally appropriate, and perfectly tailored to this patient's condition. Return ONLY valid JSON, no additional text.`;

    // Enhance with RAG
    console.log('[HABITS] Enhancing prompt with RAG...');
    const ragQuery = buildHabitRetrievalQuery(clinicalSnapshot);
    const ragResult = await enhanceChatWithRAG(ragQuery, userId, personal, []);
    
    const ragContext = typeof ragResult.ragContext === 'string'
      ? ragResult.ragContext.slice(0, MAX_HABITS_RAG_CONTEXT_CHARS)
      : '';
    const finalPrompt = ragContext
      ? `${habitPrompt}\n\nGUIDELINE CONTEXT:\n${ragContext}`
      : habitPrompt;
    
    console.log('[HABITS] RAG context used:', ragResult.contextUsed);

    const generationPromise = (async () => {
      let habitsData;
      let generationModel = 'hf-diabetica';

      try {
        const rawContent = await callHabitsModel(
          'You are a diabetes care specialist and health coach. Return only valid JSON for weekly habits. Keep it concise and actionable.',
          finalPrompt
        );
        console.log('[HABITS] Raw LLM response:', rawContent.substring(0, 300));
        habitsData = parseHabitsJson(rawContent);

        if (!habitsData.habits || !Array.isArray(habitsData.habits)) {
          throw new Error('Invalid habits structure');
        }
      } catch (llmError) {
        console.error('[HABITS] HF habits generation failed, using fallback:', llmError.message);
        habitsData = generateDataDrivenHabits(clinicalSnapshot);
        generationModel = 'data-driven-fallback';
      }
    
      const weeklyHabits = new WeeklyHabits({
        user_id: userId,
        weekStartDate: weekStart,
        weekEndDate: weekEnd,
        habits: habitsData.habits,
        generationContext: {
          bmi: clinicalSnapshot.physical.bmi,
          diabetesType: clinicalSnapshot.medical.diabetesType,
          diabetesDuration: clinicalSnapshot.medical.diabetesDuration,
          activityLevel: clinicalSnapshot.lifestyle.activityLevel,
          medications: clinicalSnapshot.medical.medications || [],
          chronicConditions: clinicalSnapshot.medical.chronicConditions || []
        },
        llmMetadata: {
          model: generationModel,
          ragContextUsed: ragResult.contextUsed,
          sources: ragResult.sources?.map(s => s.title) || []
        },
        status: 'active'
      });

      await weeklyHabits.save();

      console.log('[HABITS] Weekly habits generated and saved');

      return {
        success: true,
        data: weeklyHabits,
        message: 'Weekly habits generated successfully',
        weekSummary: habitsData.weekSummary
      };
    })();

    inFlightHabitGenerations.set(requestKey, generationPromise);
    try {
      return res.json(await generationPromise);
    } finally {
      inFlightHabitGenerations.delete(requestKey);
    }
    
  } catch (error) {
    console.error('[HABITS] Error generating weekly habits:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error generating habits',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Data-driven fallback habits
const generateDataDrivenHabits = (snapshot) => {
  const habits = [];
  let habitId = 1;
  
  // BMI-based habits
  if (snapshot.physical.bmi > 27) {
    habits.push({
      id: `habit-${habitId++}`,
      category: 'exercise',
      title: 'Morning Walk',
      description: 'Take a 30-minute brisk walk to support weight management',
      targetValue: '30',
      unit: 'minutes',
      frequency: 'daily',
      timeOfDay: ['morning'],
      priority: 'high',
      medicalReason: 'Regular walking helps manage weight and improve insulin sensitivity',
      tips: ['Walk before breakfast for better glucose control', 'Maintain steady pace', 'Stay hydrated']
    });
  }
  
  // Activity level
  if (snapshot.lifestyle.activityLevel === 'Sedentary') {
    habits.push({
      id: `habit-${habitId++}`,
      category: 'exercise',
      title: 'Hourly Movement Breaks',
      description: 'Stand and move for 5 minutes every hour during the day',
      targetValue: '5',
      unit: 'minutes',
      frequency: 'multiple_times_daily',
      timeOfDay: ['morning', 'afternoon', 'evening'],
      priority: 'high',
      medicalReason: 'Breaking up sedentary time improves glucose metabolism',
      tips: ['Set hourly reminders', 'Simple stretches count', 'Walk around your workspace']
    });
  }
  
  // Sleep habits
  if (snapshot.lifestyle.sleepHours < 7) {
    habits.push({
      id: `habit-${habitId++}`,
      category: 'sleep',
      title: 'Consistent Sleep Schedule',
      description: 'Go to bed and wake up at the same time daily',
      targetValue: '8',
      unit: 'hours',
      frequency: 'daily',
      timeOfDay: ['night'],
      priority: 'high',
      medicalReason: 'Quality sleep regulates hormones that control blood sugar',
      tips: ['Avoid screens 1 hour before bed', 'Keep bedroom cool and dark', 'Avoid caffeine after 2 PM']
    });
  }
  
  // Medication adherence
  if (snapshot.medical.medications?.length > 0) {
    habits.push({
      id: `habit-${habitId++}`,
      category: 'medication',
      title: 'Take Medications On Time',
      description: 'Take all prescribed medications at scheduled times',
      targetValue: snapshot.medical.medications.length.toString(),
      unit: 'medications',
      frequency: 'daily',
      timeOfDay: ['morning', 'evening'],
      priority: 'high',
      medicalReason: 'Consistent medication timing ensures optimal diabetes control',
      tips: ['Set phone reminders', 'Use pill organizer', 'Take with meals as prescribed']
    });
  }
  
  // Hydration
  habits.push({
    id: `habit-${habitId++}`,
    category: 'lifestyle',
    title: 'Stay Hydrated',
    description: 'Drink 8 glasses of water throughout the day',
    targetValue: '8',
    unit: 'glasses',
    frequency: 'daily',
    timeOfDay: ['morning', 'afternoon', 'evening'],
    priority: 'medium',
    medicalReason: 'Proper hydration supports kidney function and helps regulate blood sugar',
    tips: ['Start day with water', 'Carry water bottle', 'Drink before meals']
  });
  
  // Balanced meals
  habits.push({
    id: `habit-${habitId++}`,
    category: 'diet',
    title: 'Eat Balanced Meals',
    description: 'Include protein, fiber, and healthy fats in every meal',
    targetValue: '3',
    unit: 'meals',
    frequency: 'daily',
    timeOfDay: ['morning', 'afternoon', 'evening'],
    priority: 'high',
    medicalReason: 'Balanced meals prevent blood sugar spikes and keep you satisfied',
    tips: ['Fill half plate with vegetables', 'Choose whole grains', 'Include lean protein']
  });
  
  // Stress management
  habits.push({
    id: `habit-${habitId++}`,
    category: 'stress',
    title: 'Practice Relaxation',
    description: 'Spend 10 minutes on deep breathing or meditation',
    targetValue: '10',
    unit: 'minutes',
    frequency: 'daily',
    timeOfDay: ['evening'],
    priority: 'medium',
    medicalReason: 'Stress management helps stabilize blood sugar and improves overall health',
    tips: ['Try guided meditation apps', 'Practice before bed', 'Focus on slow, deep breaths']
  });
  
  return {
    habits,
    weekSummary: 'This week focuses on building foundational habits for diabetes management through regular physical activity, balanced nutrition, medication adherence, and stress management.'
  };
};

// Get current week habits
export const getCurrentWeekHabits = async (req, res) => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated.' });
    }
    
    const { weekStart } = getCurrentWeekBounds();
    
    const habits = await WeeklyHabits.findOne({
      user_id: userId,
      weekStartDate: weekStart,
      status: 'active'
    });
    
    if (!habits) {
      return res.json({
        success: true,
        data: null,
        message: 'No habits found for current week. Generate new habits.'
      });
    }
    
    return res.json({
      success: true,
      data: habits,
      completionRate: habits.getCompletionRate()
    });
    
  } catch (error) {
    console.error('[HABITS] Error fetching habits:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error fetching habits'
    });
  }
};

// Update habit progress
export const updateHabitProgress = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { habitId, date, completed, actualValue, notes } = req.body;
    
    if (!userId || !habitId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    const { weekStart } = getCurrentWeekBounds();
    
    const habits = await WeeklyHabits.findOne({
      user_id: userId,
      weekStartDate: weekStart,
      status: 'active'
    });
    
    if (!habits) {
      return res.status(404).json({
        success: false,
        message: 'No active habits found'
      });
    }
    
    // Check if progress entry exists
    const progressIndex = habits.progress.findIndex(
      p => p.habitId === habitId && new Date(p.date).toDateString() === new Date(date).toDateString()
    );
    
    const progressEntry = {
      habitId,
      date: new Date(date),
      completed: completed || false,
      actualValue,
      notes,
      completedAt: completed ? new Date() : null
    };
    
    if (progressIndex >= 0) {
      habits.progress[progressIndex] = progressEntry;
    } else {
      habits.progress.push(progressEntry);
    }
    
    await habits.save();
    
    return res.json({
      success: true,
      data: habits,
      completionRate: habits.getCompletionRate(),
      message: 'Progress updated successfully'
    });
    
  } catch (error) {
    console.error('[HABITS] Error updating progress:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error updating progress'
    });
  }
};

// Get all habits for a user
export const getHabits = async (req, res) => {
  try {
    const habits = await Habit.find({ user_id: req.user._id, deleted_at: null });
    res.status(200).json({ success: true, data: habits });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching habits', error: error.message });
  }
};

// Create a new habit
export const createHabit = async (req, res) => {
  try {
    const { name, status } = req.body;
    const newHabit = new Habit({
      user_id: req.user._id,
      name,
      status,
    });
    await newHabit.save();
    res.status(201).json({ success: true, data: newHabit });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error creating habit', error: error.message });
  }
};

// Update a habit
export const updateHabit = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;
    const updatedHabit = await Habit.findOneAndUpdate(
      { _id: id, user_id: req.user._id },
      { name, status },
      { new: true, runValidators: true }
    );
    if (!updatedHabit) {
      return res.status(404).json({ success: false, message: 'Habit not found' });
    }
    res.status(200).json({ success: true, data: updatedHabit });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error updating habit', error: error.message });
  }
};

// Delete a habit
export const deleteHabit = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedHabit = await Habit.findOneAndUpdate(
      { _id: id, user_id: req.user._id },
      { deleted_at: new Date() },
      { new: true }
    );
    if (!deletedHabit) {
      return res.status(404).json({ success: false, message: 'Habit not found' });
    }
    res.status(200).json({ success: true, message: 'Habit deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting habit', error: error.message });
  }
};

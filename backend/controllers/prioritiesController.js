import { UserPersonalInfo } from '../models/UserPersonalInfo.js';
import { UserMedicalInfo } from '../models/UserMedicalInfo.js';
import { enhanceChatWithRAG } from '../services/ragService.js';

const LM_STUDIO_BASE_URL = process.env.LM_STUDIO_BASE_URL || 'http://127.0.0.1:1234';
const LM_STUDIO_MODEL = process.env.LM_STUDIO_MODEL || 'diabetica-7b';

const buildClinicalSnapshot = (personal, medical) => {
  const pieces = [];
  
  if (!personal && !medical) {
    return 'No clinical data available';
  }
  
  // Personal information
  if (personal?.gender) pieces.push(`Gender: ${personal.gender}`);
  if (personal?.date_of_birth) {
    try {
      const dob = new Date(personal.date_of_birth);
      if (!isNaN(dob.getTime())) {
        const age = Math.max(0, Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000)));
        pieces.push(`Age: ${age}`);
      }
    } catch (e) {
      console.warn('[PRIORITIES] Invalid date_of_birth:', e.message);
    }
  }
  if (personal?.height) pieces.push(`Height: ${personal.height} cm`);
  if (personal?.weight) {
    pieces.push(`Weight: ${personal.weight} kg`);
    if (personal.height) {
      const bmi = (personal.weight / Math.pow(personal.height / 100, 2)).toFixed(1);
      pieces.push(`BMI: ${bmi}`);
    }
  }
  if (personal?.activity_level) pieces.push(`Activity Level: ${personal.activity_level}`);
  if (personal?.sleep_hours) pieces.push(`Sleep: ${personal.sleep_hours} hours`);
  if (personal?.dietary_preference) pieces.push(`Diet preference: ${personal.dietary_preference}`);
  
  // Medical information
  if (medical?.diabetes_type) pieces.push(`Diabetes Type: ${medical.diabetes_type}`);
  if (medical?.diagnosis_date) {
    try {
      const diagDate = new Date(medical.diagnosis_date);
      if (!isNaN(diagDate.getTime())) {
        const yearsWithDiabetes = Math.floor((Date.now() - diagDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        pieces.push(`Years with diabetes: ${yearsWithDiabetes}`);
      }
    } catch (e) {
      console.warn('[PRIORITIES] Invalid diagnosis_date:', e.message);
    }
  }
  
  if (medical?.current_medications?.length) {
    const meds = medical.current_medications
      .filter(Boolean)
      .map((m) => {
        const name = m.medication_name || 'Unknown';
        const dose = m.dosage || '';
        const freq = m.frequency || '';
        return [name, dose, freq].filter(Boolean).join(' ');
      })
      .join(', ');
    pieces.push(`Medications: ${meds}`);
  }
  
  if (medical?.allergies?.length) {
    const allergies = medical.allergies
      .filter(Boolean)
      .map((a) => a.allergen || 'Unknown')
      .join(', ');
    pieces.push(`Allergies: ${allergies}`);
  }
  
  if (medical?.family_history?.length) {
    const family = medical.family_history
      .filter(Boolean)
      .map((f) => {
        const relation = f.relation || 'Family member';
        const condition = f.condition || 'condition';
        return `${relation}: ${condition}`;
      })
      .join(', ');
    pieces.push(`Family History: ${family}`);
  }
  
  return pieces.join('\n') || 'Limited clinical data available';
};

export const generateWeeklyPriorities = async (req, res) => {
  try {
    console.log('[PRIORITIES] Starting weekly priorities generation');
    const userId = req.user?._id;
    console.log('[PRIORITIES] UserId:', userId);

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated.' });
    }

    // Fetch user profile data (without .lean() to trigger decryption middleware)
    console.log('[PRIORITIES] Fetching profile data for user:', userId);
    const [personal, medical] = await Promise.all([
      UserPersonalInfo.findOne({ user_id: userId }),
      UserMedicalInfo.findOne({ user_id: userId }),
    ]);
    console.log('[PRIORITIES] Profile fetched - personal:', !!personal, 'medical:', !!medical);

    // Check if profile is complete
    const requiredPersonalFields = ['date_of_birth', 'gender', 'height', 'weight'];
    const requiredMedicalFields = ['diabetes_type', 'diagnosis_date'];
    
    const personalComplete = personal && requiredPersonalFields.every(field => personal[field]);
    const medicalComplete = medical && requiredMedicalFields.every(field => medical[field]);
    
    // Debug logging
    console.log('[PRIORITIES] Personal data:', {
      exists: !!personal,
      date_of_birth: personal?.date_of_birth,
      gender: personal?.gender,
      height: personal?.height,
      weight: personal?.weight,
      personalComplete
    });
    console.log('[PRIORITIES] Medical data:', {
      exists: !!medical,
      diabetes_type: medical?.diabetes_type,
      diagnosis_date: medical?.diagnosis_date,
      medicalComplete
    });
    
    // If profile not complete, return priority to complete it
    if (!personalComplete || !medicalComplete) {
      console.log('[PRIORITIES] Profile incomplete - returning completion priority');
      const missingFields = [];
      if (!personalComplete) missingFields.push('personal information (age, gender, height, weight)');
      if (!medicalComplete) missingFields.push('medical history (diabetes type, diagnosis date)');
      
      return res.json({
        success: true,
        data: [{
          id: 'priority-complete-profile',
          level: 'high',
          title: 'Complete Your Health Profile',
          description: `Please provide your ${missingFields.join(' and ')} for personalized care recommendations`,
          action: 'Complete Profile',
          urgency: 'now',
          medicalReason: 'Complete health data is essential for generating personalized diabetes management priorities'
        }],
        profileComplete: false,
        generatedAt: new Date().toISOString()
      });
    }

    const clinicalSnapshot = buildClinicalSnapshot(personal, medical);

    // Build the prompt for LLM to generate weekly priorities
    const prioritiesPrompt = `You are a diabetes care specialist. Based on the patient's clinical snapshot, generate 3 personalized weekly care priorities. Each priority should be actionable, evidence-based, and tailored to their specific condition.

IMPORTANT: Do NOT recommend blood glucose monitoring, lab tests, or IoT device usage as we don't have that technology. Focus ONLY on lifestyle, diet, exercise, medication adherence, and preventive care that can be done without medical devices.

Clinical Snapshot:
${clinicalSnapshot}

Generate exactly 3 priorities based on their ACTUAL data:
- If BMI is high/low, prioritize weight management
- If they have concerning medications, prioritize medication adherence
- If they have family history of complications, prioritize preventive care
- If activity level is sedentary, prioritize physical activity
- If sleep is poor, prioritize sleep hygiene
- If they have allergies, prioritize safe food choices

Return ONLY valid JSON in this format:
[
  {
    "id": "priority-1",
    "level": "high|medium|low",
    "title": "Clear, actionable title based on their data (max 60 characters)",
    "description": "Detailed explanation relevant to their specific condition (max 150 characters)",
    "action": "Specific action they can take (max 30 characters)",
    "urgency": "timeframe (e.g., 'this week', 'ongoing', 'within 3 months')",
    "medicalReason": "Why this matters for THEIR specific situation (max 120 characters)"
  }
]

Make recommendations practical, specific to their actual data, and evidence-based. DO NOT mention glucose monitoring, blood tests, or IoT devices. Return ONLY valid JSON, no additional text.`;

    // **RAG Enhancement** - Get relevant context from documents
    console.log('[PRIORITIES] Enhancing with RAG...');
    const ragResult = await enhanceChatWithRAG(prioritiesPrompt, personal, medical);
    console.log('[PRIORITIES] RAG enhancement complete, context used:', ragResult.contextUsed);

    // Use RAG-enhanced prompt if available, otherwise use base prompt
    const finalPrompt = ragResult.systemPrompt 
      ? `${ragResult.systemPrompt}\n\n${prioritiesPrompt}` 
      : prioritiesPrompt;

    // Prepare messages for LLM
    const messages = [
      {
        role: 'system',
        content: 'You are a diabetes care specialist AI. Generate personalized, evidence-based weekly care priorities in valid JSON format. Be concise, specific, and clinically accurate.'
      },
      {
        role: 'user',
        content: finalPrompt
      }
    ];

    console.log('[PRIORITIES] Calling LM Studio API...');
    const llmResponse = await fetch(`${LM_STUDIO_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: LM_STUDIO_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!llmResponse.ok) {
      const errorText = await llmResponse.text();
      console.error('[PRIORITIES] LM Studio error:', llmResponse.status, errorText);
      throw new Error(`LM Studio API error: ${llmResponse.status}`);
    }

    const llmData = await llmResponse.json();
    console.log('[PRIORITIES] LM Studio response received');

    const rawContent = llmData.choices?.[0]?.message?.content?.trim() || '[]';
    console.log('[PRIORITIES] Raw LLM response:', rawContent.substring(0, 200));

    // Parse JSON response
    let priorities = [];
    try {
      // Try to extract JSON from response (handle markdown code blocks)
      let jsonContent = rawContent;
      if (rawContent.includes('```json')) {
        jsonContent = rawContent.split('```json')[1].split('```')[0].trim();
      } else if (rawContent.includes('```')) {
        jsonContent = rawContent.split('```')[1].split('```')[0].trim();
      }
      
      priorities = JSON.parse(jsonContent);
      
      // Validate structure
      if (!Array.isArray(priorities)) {
        priorities = [];
      }
      
      // Ensure we have exactly 3 priorities with required fields
      priorities = priorities
        .filter(p => p.title && p.description)
        .slice(0, 3)
        .map((p, index) => ({
          id: p.id || `priority-${index + 1}`,
          level: p.level || 'medium',
          title: p.title || 'Care priority',
          description: p.description || 'Follow your care plan',
          action: p.action || 'Take Action',
          urgency: p.urgency || 'this week',
          medicalReason: p.medicalReason || 'Evidence-based recommendation for diabetes management'
        }));
      
      console.log('[PRIORITIES] Parsed priorities count:', priorities.length);
    } catch (parseError) {
      console.error('[PRIORITIES] Failed to parse LLM response:', parseError.message);
      console.error('[PRIORITIES] Raw content:', rawContent);
      
      // Generate fallback priorities based on actual user data
      priorities = generateDataBasedFallbackPriorities(personal, medical);
    }

    // If still no priorities, use fallback
    if (priorities.length === 0) {
      priorities = generateDataBasedFallbackPriorities(personal, medical);
    }

    console.log('[PRIORITIES] Returning priorities:', priorities.length);
    res.json({ 
      success: true, 
      data: priorities,
      profileComplete: true,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('[PRIORITIES] Error generating weekly priorities:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate weekly priorities',
      error: error.message 
    });
  }
};

// Helper function to generate data-based fallback priorities
const generateDataBasedFallbackPriorities = (personal, medical) => {
  const priorities = [];
  
  // Calculate BMI if data available
  let bmi = null;
  if (personal?.height && personal?.weight) {
    bmi = (personal.weight / Math.pow(personal.height / 100, 2)).toFixed(1);
  }
  
  // Priority 1: Based on BMI or weight management
  if (bmi) {
    if (bmi > 27) {
      priorities.push({
        id: 'priority-1',
        level: 'high',
        title: 'Focus on weight management',
        description: `Your BMI is ${bmi}. Weight reduction can significantly improve diabetes control`,
        action: 'Start Weight Plan',
        urgency: 'this week',
        medicalReason: 'Weight loss improves insulin sensitivity and reduces diabetes complications'
      });
    } else if (bmi < 18.5) {
      priorities.push({
        id: 'priority-1',
        level: 'high',
        title: 'Improve nutritional intake',
        description: `Your BMI is ${bmi}. Focus on balanced nutrition to reach healthy weight`,
        action: 'Nutrition Plan',
        urgency: 'this week',
        medicalReason: 'Maintaining healthy weight supports better diabetes management'
      });
    } else {
      priorities.push({
        id: 'priority-1',
        level: 'medium',
        title: 'Maintain healthy weight',
        description: `Your BMI is ${bmi}, which is in healthy range. Continue current habits`,
        action: 'Track Progress',
        urgency: 'ongoing',
        medicalReason: 'Maintaining optimal weight prevents diabetes progression'
      });
    }
  } else {
    priorities.push({
        id: 'priority-1',
        level: 'medium',
        title: 'Complete health measurements',
        description: 'Add your height and weight for personalized recommendations',
        action: 'Update Profile',
        urgency: 'this week',
        medicalReason: 'Complete data enables accurate personalized care planning'
    });
  }
  
  // Priority 2: Based on activity level
  if (personal?.activity_level === 'Sedentary' || personal?.activity_level === 'Light') {
    priorities.push({
      id: 'priority-2',
      level: 'high',
      title: 'Increase physical activity',
      description: 'Start with 30 minutes of walking daily to improve insulin sensitivity',
      action: 'Plan Exercise',
      urgency: 'this week',
      medicalReason: 'Regular activity is crucial for managing Type 2 diabetes effectively'
    });
  } else if (personal?.activity_level === 'Moderate' || personal?.activity_level === 'Active') {
    priorities.push({
      id: 'priority-2',
      level: 'medium',
      title: 'Maintain exercise routine',
      description: 'Continue your current activity level and consider adding strength training',
      action: 'Track Activity',
      urgency: 'ongoing',
      medicalReason: 'Consistent exercise maintains insulin sensitivity and overall health'
    });
  } else {
    priorities.push({
      id: 'priority-2',
      level: 'medium',
      title: 'Establish activity routine',
      description: 'Start with light activities like walking to support diabetes management',
      action: 'Start Moving',
      urgency: 'this week',
      medicalReason: 'Physical activity is essential for controlling blood sugar levels'
    });
  }
  
  // Priority 3: Based on medications or diabetes duration
  if (medical?.current_medications && medical.current_medications.length > 0) {
    priorities.push({
      id: 'priority-3',
      level: 'high',
      title: 'Ensure medication adherence',
      description: `Take your ${medical.current_medications.length} medication(s) as prescribed daily`,
      action: 'Set Reminders',
      urgency: 'daily',
      medicalReason: 'Consistent medication use is critical for preventing complications'
    });
  } else if (medical?.diagnosis_date) {
    const yearsWithDiabetes = Math.floor((Date.now() - new Date(medical.diagnosis_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (yearsWithDiabetes > 5) {
      priorities.push({
        id: 'priority-3',
        level: 'medium',
        title: 'Schedule regular checkups',
        description: `With ${yearsWithDiabetes} years of diabetes, preventive care is essential`,
        action: 'Book Appointment',
        urgency: 'this month',
        medicalReason: 'Long-term diabetes requires regular monitoring to prevent complications'
      });
    } else {
      priorities.push({
        id: 'priority-3',
        level: 'medium',
        title: 'Build healthy habits',
        description: 'Establish consistent meal times and portion control',
        action: 'Plan Meals',
        urgency: 'this week',
        medicalReason: 'Early habit formation leads to better long-term diabetes control'
      });
    }
  } else {
    priorities.push({
      id: 'priority-3',
      level: 'medium',
      title: 'Complete medical history',
      description: 'Add your diabetes diagnosis date and current medications',
      action: 'Update Info',
      urgency: 'this week',
      medicalReason: 'Complete medical data enables personalized care recommendations'
    });
  }
  
  return priorities;
};

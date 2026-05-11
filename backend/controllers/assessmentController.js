import { UsersAnswers } from '../models/Users_Answers.js';
import { Question } from '../models/Question.js';
import { Symptom } from '../models/Symptom.js';
import { User } from '../models/User.js';
import { UserMedicalInfo } from '../models/UserMedicalInfo.js';
import { assessDiabetesRiskPython } from '../services/mlService.js';
import hybridRiskService from '../services/hybridRiskService.js';
import { createAuditLog } from '../middlewares/auditMiddleware.js';
import { generateRiskAssessmentPDF } from '../services/pdfGenerationService.js';
import { sendRiskAssessmentEmail } from '../services/emailService.js';
import { UserPersonalInfo } from '../models/UserPersonalInfo.js';
import encryptionService from '../services/encryptionService.js';
import { Report } from '../models/Report.js';
import crypto from 'crypto';
import { Answer } from '../models/Answer.js';

export const getNextQuestion = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find all questions the user has already answered
        const answeredQuestions = await UsersAnswers.find({ user_id: userId }).select('question_id');
        const answeredQuestionIds = answeredQuestions.map(aq => aq.question_id);

        // Find the first question that has not been answered
        const nextQuestion = await Question.findOne({
            _id: { $nin: answeredQuestionIds },
            deleted_at: null
        }).sort({ order: 1 }); // Assuming you have an 'order' field

        if (!nextQuestion) {
            return res.status(200).json({
                success: true,
                message: 'Assessment complete',
                data: { isLastQuestion: true, question: null }
            });
        }

        // Get options for the question
        const options = await Answer.find({ /* logic to find answers for this question if applicable */ });

        // Check if this is the last question
        const remainingQuestions = await Question.countDocuments({
            _id: { $nin: [...answeredQuestionIds, nextQuestion._id] },
            deleted_at: null
        });

        const totalQuestions = await Question.countDocuments({ deleted_at: null });

        res.status(200).json({
            success: true,
            data: {
                question: nextQuestion,
                options: options, // This needs to be more specific based on your schema
                isLastQuestion: remainingQuestions === 0,
                progress: {
                    answered: answeredQuestionIds.length,
                    total: totalQuestions
                }
            }
        });
    } catch (error) {
        console.error('Error getting next question:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const submitAnswer = async (req, res) => {
    try {
        const userId = req.user._id;
        const { questionId, answer: answerText } = req.body;

        // Find or create the answer
        let answer = await Answer.findOne({ answer_text: answerText });
        if (!answer) {
            answer = new Answer({ answer_text: answerText });
            await answer.save();
        }

        // Check if the user has already answered this question
        const existingUserAnswer = await UsersAnswers.findOne({ user_id: userId, question_id: questionId });

        if (existingUserAnswer) {
            // Update existing answer
            existingUserAnswer.answer_id = answer._id;
            await existingUserAnswer.save();
        } else {
            // Create new answer
            const newUserAnswer = new UsersAnswers({
                user_id: userId,
                question_id: questionId,
                answer_id: answer._id
            });
            await newUserAnswer.save();
        }

        res.status(200).json({ success: true, message: 'Answer submitted successfully' });
    } catch (error) {
        console.error('Error submitting answer:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Get latest cached diabetes assessment (no model execution)
 * Returns cached report from database without running ML model
 */
export const getLatestDiabetesAssessment = async (req, res) => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Find the most recent diabetes assessment report for this user
    const latestReport = await Report.findOne({
      user_id: userId,
      assessment_type: 'diabetes',
      deleted_at: null
    }).sort({ assessment_date: -1 }).lean();

    if (!latestReport) {
      return res.status(404).json({
        success: false,
        message: 'No previous assessment found. Please complete your first assessment.',
        has_assessment: false
      });
    }

    // Return cached assessment data
    return res.status(200).json({
      success: true,
      data: {
        features: latestReport.features || {},
        result: latestReport.ml_results || {
          risk_level: latestReport.risk_level,
          diabetes_probability: latestReport.probability,
          confidence: latestReport.confidence
        },
        assessment_date: latestReport.assessment_date,
        is_cached: true,
        has_assessment: true
      }
    });
  } catch (err) {
    console.error('Error fetching latest assessment:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve assessment',
      error: err.message
    });
  }
};

/**
 * Get assessment history for user (all past assessments)
 * Returns list of all assessments ordered by date
 */
export const getDiabetesAssessmentHistory = async (req, res) => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const limit = parseInt(req.query.limit) || 10;
    const skip = parseInt(req.query.skip) || 0;

    // Find all diabetes assessment reports for this user
    const reports = await Report.find({
      user_id: userId,
      assessment_type: 'diabetes',
      deleted_at: null
    })
    .sort({ assessment_date: -1 })
    .limit(limit)
    .skip(skip)
    .select('risk_level probability confidence features ml_results assessment_date email_sent_at pdf_path')
    .lean();

    const totalCount = await Report.countDocuments({
      user_id: userId,
      assessment_type: 'diabetes',
      deleted_at: null
    });

    // Shape each report to match the same format as getLatestAssessment
    // so the mobile/web client can use identical rendering logic for both
    const shaped = reports.map(r => ({
      features: r.features || {},
      result: r.ml_results || {
        risk_level: r.risk_level,
        diabetes_probability: r.probability,
        confidence: r.confidence,
      },
      assessment_date: r.assessment_date,
      is_cached: true,
      has_assessment: true,
    }));

    return res.status(200).json({
      success: true,
      data: {
        assessments: shaped,
        total: totalCount,
        limit,
        skip
      }
    });
  } catch (err) {
    console.error('Error fetching assessment history:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve assessment history',
      error: err.message
    });
  }
};

// Map stored answers to model features using database-driven ml_feature_mapping
function mapAnswersToFeatures(answersByQuestionId, questions, userData = null) {
  // Initialize with default values for all required ML features
  const features = {
    Age: 0,
    Gender: 0,
    Obesity: 0,
    Polyuria: 0,
    Polydipsia: 0,
    'sudden weight loss': 0,
    weakness: 0,
    Polyphagia: 0,
    'Genital thrush': 0,
    'visual blurring': 0,
    Itching: 0,
    Irritability: 0,
    'delayed healing': 0,
    'partial paresis': 0,
    'muscle stiffness': 0,
    Alopecia: 0,
  };

  // Auto-populate Age and Gender from user profile data (collected during signup)
  if (userData) {
    // Calculate age from date_of_birth
    if (userData.date_of_birth) {
      const birthDate = new Date(userData.date_of_birth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      // Adjust if birthday hasn't occurred this year
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      features.Age = age;
      console.log(`👤 Auto-populated Age from profile: ${age} (DOB: ${birthDate.toDateString()})`);
    } else {
      console.log(`⚠️  User has no date_of_birth in profile`);
    }
    
    // Populate Gender from user profile
    if (userData.gender) {
      // Normalize gender to match ML model expectations: Male=1, Female=0
      const genderNormalized = userData.gender.toLowerCase();
      features.Gender = (genderNormalized === 'male') ? 1 : 0;
      console.log(`👤 Auto-populated Gender from profile: ${userData.gender} → ${features.Gender}`);
    } else {
      console.log(`⚠️  User has no gender in profile`);
    }
  }

  // Temporary storage for BMI calculation
  let heightCm = null;
  let weightKg = null;

  console.log('🔄 Processing answers from', questions.length, 'questions');

  for (const q of questions) {
    const ans = answersByQuestionId.get(String(q._id));
    if (!ans) continue;

    const answerText = (ans.answer_id?.answer_text || '').toString().trim();
    const mlMapping = q.ml_feature_mapping;
    
    // Skip questions without ML mapping
    if (!mlMapping || !mlMapping.feature_name) {
      console.log(`⏭️  Skipping question without ML mapping: "${q.question_text}"`);
      continue;
    }

    const featureName = mlMapping.feature_name;
    
    console.log(`📊 Mapping question "${q.question_text}" → Feature: "${featureName}", Answer: "${answerText}"`);

    // Handle different transformation types
    switch (mlMapping.transformation) {
      case 'extract_first_number':
      case 'extract_number': {
        // Extract first number from answer text (e.g., "25 years" → 25, "5 feet 6 inches" → 5)
        const match = answerText.match(/\d+/);
        if (match) {
          const num = parseInt(match[0], 10);
          if (!isNaN(num)) {
            if (featureName === 'height_cm') {
              heightCm = num;
            } else if (featureName === 'weight_kg') {
              weightKg = num;
            } else {
              features[featureName] = num;
            }
            console.log(`  ✅ Extracted number: ${num}`);
          }
        } else {
          console.log(`  ⚠️  No number found in answer`);
        }
        break;
      }

      case 'unit_conversion': {
        // For height converted from feet/inches to cm
        const num = parseFloat(answerText);
        if (!isNaN(num)) {
          if (featureName === 'height_cm') {
            heightCm = num;
          } else if (featureName === 'weight_kg') {
            weightKg = num;
          }
          console.log(`  ✅ Unit conversion: ${num}`);
        }
        break;
      }

      case 'yes_no_binary':
      case 'none':
      default: {
        // Use value_mapping if available
        if (mlMapping.value_mapping && mlMapping.value_mapping instanceof Map) {
          if (mlMapping.value_mapping.has(answerText)) {
            features[featureName] = mlMapping.value_mapping.get(answerText);
            console.log(`  ✅ Mapped via value_mapping: "${answerText}" → ${features[featureName]}`);
          } else {
            // Fallback: try case-insensitive matching
            const lowerAnswer = answerText.toLowerCase();
            let found = false;
            for (const [key, value] of mlMapping.value_mapping) {
              if (key.toLowerCase() === lowerAnswer) {
                features[featureName] = value;
                console.log(`  ✅ Mapped via case-insensitive match: "${answerText}" → ${value}`);
                found = true;
                break;
              }
            }
            if (!found) {
              // Default yes/no interpretation as last resort
              const isYes = /yes|often|severe|always|frequently/i.test(answerText);
              features[featureName] = isYes ? 1 : 0;
              console.log(`  ⚠️  No mapping found, using default yes/no: ${features[featureName]}`);
            }
          }
        } else {
          // No value mapping - use default yes/no interpretation
          const isYes = /yes|often|severe|always|frequently/i.test(answerText);
          features[featureName] = isYes ? 1 : 0;
          console.log(`  ⚠️  No value_mapping, using default yes/no: ${features[featureName]}`);
        }
        break;
      }
    }
  }

  // Calculate Obesity feature from BMI if height and weight are available
  if (heightCm && weightKg && heightCm > 0) {
    const bmi = weightKg / ((heightCm / 100) ** 2);
    features.Obesity = bmi >= 25 ? 1 : 0;
    console.log(`💪 Calculated BMI: ${bmi.toFixed(1)} → Obesity: ${features.Obesity} (Height: ${heightCm}cm, Weight: ${weightKg}kg)`);
  } else {
    console.log(`⚠️  Cannot calculate Obesity - missing height (${heightCm}) or weight (${weightKg})`);
  }

  console.log('📋 Final features:', features);
  return features;
}

export const assessDiabetes = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });

    console.log('Assessment request for user:', userId);

    // Check if user wants to force a new assessment (re-run model)
    const forceNew = req.query.force_new === 'true';

    // Load user's current answers to check if they've changed
    const currentAnswers = await UsersAnswers.find({ user_id: userId, deleted_at: null })
      .populate({ path: 'question_id', model: 'Question' })
      .populate({ path: 'answer_id', model: 'Answer' })
      .sort({ question_id: 1 });

    if (currentAnswers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No symptom answers found. Please complete the symptom assessment first.'
      });
    }

    // Create hash of current answers (to detect changes)
    // Use the UserAnswer document's own _id for hashing so free-text/numeric answers
    // (which have no linked Answer document) are still included in change detection.
    const answerIds = currentAnswers.map(ua => String(ua._id)).sort();
    const answerHash = crypto.createHash('sha256').update(answerIds.join(',')).digest('hex');
    // Collect valid Answer-document ObjectIds for the report (filter nulls / free-text answers)
    const linkedAnswerIds = currentAnswers
      .map(ua => ua.answer_id?._id || ua.answer_id)
      .filter(id => id != null);

    // Check for existing assessment with same answers (unless force_new)
    if (!forceNew) {
      const existingReport = await Report.findOne({
        user_id: userId,
        assessment_type: 'diabetes',
        deleted_at: null,
        answer_hash: answerHash
      }).sort({ assessment_date: -1 }).lean();

      if (existingReport) {
        console.log('✅ Returning cached assessment - answers unchanged (no model execution, no email)');
        
        return res.status(200).json({
          success: true,
          data: {
            features: existingReport.features || {},
            result: existingReport.ml_results || {
              risk_level: existingReport.risk_level,
              diabetes_probability: existingReport.probability,
              confidence: existingReport.confidence
            },
            assessment_date: existingReport.assessment_date,
            has_assessment: true,
            is_cached: true,
            answers_unchanged: true,
            enhancement_status: {
              enhanced: false,
              reason: 'Using cached assessment - symptom answers unchanged'
            },
            model_info: {
              primary_model: 'Cached Result',
              enhancement_model: 'None',
              assessment_type: 'Cached (same symptom answers)'
            }
          }
        });
      }
    }

    console.log(forceNew ? '🔄 Force new assessment requested' : '🆕 Answers changed or first assessment - running model');

    // Fetch user data (including date_of_birth and gender for Age and Gender features)
    const user = await User.findById(userId).select('date_of_birth gender fullName email');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prefer data from the User model; fall back to decrypted UserPersonalInfo
    let dob = user.date_of_birth;
    let gender = user.gender;

    if (!dob || !gender) {
      try {
        const personalInfo = await UserPersonalInfo.findOne({ user_id: userId });
        if (personalInfo) {
          if (!dob && personalInfo.date_of_birth) {
            const decrypted = encryptionService.decrypt(personalInfo.date_of_birth);
            if (decrypted) dob = decrypted;
          }
          if (!gender && personalInfo.gender) {
            const decrypted = encryptionService.decrypt(personalInfo.gender);
            if (decrypted) gender = decrypted;
          }
          console.log(`👤 Fallback profile data — dob: ${dob ? 'found' : 'missing'}, gender: ${gender ? 'found' : 'missing'}`);
        }
      } catch (profileErr) {
        console.warn('⚠️  Could not fetch UserPersonalInfo as fallback:', profileErr.message);
      }
    }

    // Validate that user has required profile data
    if (!dob || !gender) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please complete your profile with date of birth and gender before running the assessment.',
        missing_profile_fields: {
          date_of_birth: !dob,
          gender: !gender
        }
      });
    }

    // Use the currentAnswers we already loaded earlier for hash comparison
    const userAnswers = currentAnswers;
    console.log('Using current answers for feature mapping:', userAnswers.length);

    const questions = userAnswers.map(ua => ua.question_id).filter(Boolean);
    const answersByQuestionId = new Map(userAnswers.map(ua => [String(ua.question_id?._id), ua]));

    console.log('Questions found:', questions.length);

    // Pass user data to feature mapping for Age and Gender auto-population
    const features = mapAnswersToFeatures(answersByQuestionId, questions, {
      date_of_birth: dob,
      gender: gender
    });
    console.log('Mapped features for ML model:', features);

    // ✅ VALIDATE: Ensure all required features are present
    const requiredFeatures = [
      'Age', 'Gender', 'Obesity', 'Polyuria', 'Polydipsia', 
      'sudden weight loss', 'weakness', 'Polyphagia', 'Genital thrush',
      'visual blurring', 'Itching', 'Irritability', 'delayed healing',
      'partial paresis', 'muscle stiffness', 'Alopecia'
    ];
    
    const missingOrInvalidFeatures = requiredFeatures.filter(f => 
      features[f] === undefined || features[f] === null
    );
    
    if (missingOrInvalidFeatures.length > 0) {
      console.warn(`⚠️  Missing or invalid ML features: ${missingOrInvalidFeatures.join(', ')}`);
      
      // Check if required questions exist but weren't answered
      const requiredQuestions = questions.filter(q => 
        q.ml_feature_mapping?.is_required && 
        !answersByQuestionId.has(String(q._id))
      );
      
      if (requiredQuestions.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Incomplete assessment - please answer all required questions',
          missing_questions: requiredQuestions.map(q => ({
            id: q._id,
            text: q.question_text,
            symptom: q.symptom_id?.name
          })),
          missing_features: missingOrInvalidFeatures
        });
      }
    }

    // Step 1: Get XGBoost base assessment
    const xgboostResult = await assessDiabetesRiskPython(features);
    console.log('XGBoost model result:', xgboostResult);

    // Check if the XGBoost result contains an error
    if (xgboostResult.error) {
      console.error('XGBoost model returned error:', xgboostResult.error);
      return res.status(500).json({ 
        success: false, 
        message: 'Assessment failed', 
        error: xgboostResult.error,
        details: 'The machine learning model encountered an error during processing'
      });
    }

    // Step 2: Enhance with LLM (Diabetica 7B) if available
    let finalResult = xgboostResult;
    let enhancementStatus = { enhanced: false, reason: 'Not attempted' };

    try {
      // Get user context for better LLM assessment
      const user = await User.findById(userId);
      const medicalInfo = await UserMedicalInfo.findOne({ user_id: userId });
      
      const userContext = {
        age: features.Age,
        gender: features.Gender === 1 ? 'Male' : 'Female',
        diabetesType: user?.diabetes_type || 'Undiagnosed',
        medications: medicalInfo?.medications || []
      };

      console.log('Attempting LLM enhancement with Diabetica 7B...');
      
      // Check if LLM is available
      const llmAvailable = await hybridRiskService.checkLLMAvailability();
      
      if (llmAvailable) {
        // Enhance with LLM
        const enhancedResult = await hybridRiskService.enhanceRiskAssessment(
          xgboostResult,
          features,
          userContext
        );
        
        if (enhancedResult.enhanced) {
          finalResult = enhancedResult;
          enhancementStatus = { enhanced: true, reason: 'Successfully enhanced with Diabetica 7B' };
          console.log('✅ Assessment enhanced with LLM');
        } else {
          enhancementStatus = { enhanced: false, reason: enhancedResult.fallbackReason || 'LLM enhancement failed' };
          console.log('⚠️ LLM enhancement failed, using XGBoost only:', enhancedResult.fallbackReason);
        }
      } else {
        enhancementStatus = { enhanced: false, reason: 'LM Studio not available. Start LM Studio server for enhanced assessments.' };
        console.log('⚠️ LM Studio not available, using XGBoost only');
      }
    } catch (llmError) {
      // If LLM enhancement fails, continue with XGBoost result
      enhancementStatus = { enhanced: false, reason: `LLM enhancement error: ${llmError.message}` };
      console.error('LLM enhancement error (continuing with XGBoost):', llmError.message);
    }

    // Step 3: Save Report to database (create new report each time for history tracking)
    try {
      // Normalise risk_level: DB enum only accepts ['low', 'medium', 'high']
      // Python model can return: 'low', 'moderate', 'high', 'critical'
      let riskLevelRaw = (finalResult?.risk_level || 'low').toLowerCase();
      if (riskLevelRaw === 'critical') {
        riskLevelRaw = 'high';
        console.log('⚠️ Mapped risk_level from "critical" to "high" for database storage');
      } else if (riskLevelRaw === 'moderate') {
        riskLevelRaw = 'medium';
        console.log('⚠️ Mapped risk_level from "moderate" to "medium" for database storage');
      } else if (!['low', 'medium', 'high'].includes(riskLevelRaw)) {
        console.log(`⚠️ Unknown risk_level "${riskLevelRaw}", defaulting to "low"`);
        riskLevelRaw = 'low';
      }

      const probabilityRaw = finalResult?.diabetes_probability ?? 0;
      const confidenceRaw = finalResult?.confidence ?? 0;

      // Always create new report to preserve assessment history over time
      const reportDoc = await Report.create({
        user_id: userId,
        assessment_type: 'diabetes',
        risk_level: riskLevelRaw,
        probability: probabilityRaw,
        confidence: confidenceRaw,
        features: features,
        ml_results: finalResult,
        answer_hash: answerHash,
        answer_ids: linkedAnswerIds,
        assessment_date: new Date(),
        generated_on: new Date(),
        email_sent_at: null  // Will be set after email is sent
      });
      console.log('✅ Created new Report document (answers hash:', answerHash.substring(0, 8) + '...)');

      // Also update user record for quick dashboard access
      const updatedUser = await User.findByIdAndUpdate(userId, {
        last_assessment_risk_level: typeof riskLevelRaw === 'string' ? riskLevelRaw : String(riskLevelRaw),
        last_assessment_probability: Number(probabilityRaw) || 0,
        last_assessment_at: new Date(),
        // Reset popup handled flag so the new assessment can trigger a fresh prompt
        last_assessment_popup_handled_at: null,
      }, { new: true });

      // Check if we should send email (prevent duplicates)
      // Look for any report with this answer_hash created in the last 2 minutes
      const recentReport = await Report.findOne({
        user_id: userId,
        assessment_type: 'diabetes',
        answer_hash: answerHash,
        assessment_date: { $gte: new Date(Date.now() - 2 * 60 * 1000) }, // Last 2 minutes
        deleted_at: null,
        _id: { $ne: reportDoc._id } // Exclude the report we just created
      });

      const shouldSendEmail = !recentReport;
      
      if (recentReport) {
        console.log('⚠️ Another report with same answer_hash was created recently. Skipping email to prevent duplicates.');
        console.log('   Recent report ID:', recentReport._id, 'Created:', recentReport.assessment_date);
      }

      // Email delivery is best-effort. If the email on the account is missing/invalid,
      // we still return assessment results and simply skip the email job.
      const emailAddress = updatedUser?.email;
      const isEmailFormatValid = typeof emailAddress === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress);
      const isEmailServiceConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

      // Generate and send risk assessment report email in background (ONLY if no recent duplicate)
      if (shouldSendEmail && isEmailFormatValid && isEmailServiceConfigured) {
        setImmediate(async () => {
          try {
            console.log('📊 Generating risk assessment report for user:', emailAddress);
            
            // Fetch personal and medical info
            const personalInfo = await UserPersonalInfo.findOne({ user_id: userId });
            const medicalInfo = await UserMedicalInfo.findOne({ user_id: userId });
          
          // Decrypt if available
          let decryptedPersonalInfo = null;
          let decryptedMedicalInfo = null;
          
          if (personalInfo) {
            decryptedPersonalInfo = {
              date_of_birth: encryptionService.decrypt(personalInfo.date_of_birth),
              gender: encryptionService.decrypt(personalInfo.gender),
              height: encryptionService.decrypt(personalInfo.height),
              weight: encryptionService.decrypt(personalInfo.weight),
              activity_level: encryptionService.decrypt(personalInfo.activity_level),
              dietary_preference: encryptionService.decrypt(personalInfo.dietary_preference),
              smoking_status: encryptionService.decrypt(personalInfo.smoking_status),
              alcohol_use: encryptionService.decrypt(personalInfo.alcohol_use),
              sleep_hours: encryptionService.decrypt(personalInfo.sleep_hours)
            };
          }
          
          if (medicalInfo) {
            decryptedMedicalInfo = {
              diabetes_type: medicalInfo.diabetes_type ? encryptionService.decrypt(medicalInfo.diabetes_type) : null,
              diagnosis_date: medicalInfo.diagnosis_date ? encryptionService.decrypt(medicalInfo.diagnosis_date) : null,
              current_medications: medicalInfo.current_medications ? medicalInfo.current_medications.map(med => ({
                medication_name: encryptionService.decrypt(med.medication_name),
                dosage: encryptionService.decrypt(med.dosage),
                frequency: encryptionService.decrypt(med.frequency)
              })) : [],
              chronic_conditions: medicalInfo.chronic_conditions ? medicalInfo.chronic_conditions.map(cond => ({
                condition_name: encryptionService.decrypt(cond.condition_name)
              })) : [],
              blood_glucose_data: medicalInfo.blood_glucose_data ? {
                fasting_glucose: medicalInfo.blood_glucose_data.fasting_glucose ? encryptionService.decrypt(medicalInfo.blood_glucose_data.fasting_glucose) : null,
                hba1c: medicalInfo.blood_glucose_data.hba1c ? encryptionService.decrypt(medicalInfo.blood_glucose_data.hba1c) : null,
                postprandial_glucose: medicalInfo.blood_glucose_data.postprandial_glucose ? encryptionService.decrypt(medicalInfo.blood_glucose_data.postprandial_glucose) : null
              } : null
            };
          }
          
          // Prepare risk data with actual assessment results
          const riskData = {
            risk_level: updatedUser.last_assessment_risk_level || 'low',
            probability: updatedUser.last_assessment_probability || 0,
            confidence: finalResult?.confidence || 0,
            total_symptoms: finalResult?.total_symptoms || 0,
            assessment_date: new Date()
          };
          
          // Generate PDF
          const pdfPath = await generateRiskAssessmentPDF(
            updatedUser,
            decryptedPersonalInfo,
            decryptedMedicalInfo,
            riskData
          );

          // Persist PDF path (email_sent_at should ONLY be set after a successful send)
          await Report.findByIdAndUpdate(reportDoc._id, { pdf_path: pdfPath });

          // Send email with PDF
          await sendRiskAssessmentEmail(
            emailAddress,
            updatedUser.fullName,
            riskData.risk_level,
            pdfPath
          );

          // Mark email as sent after successful delivery
          await Report.findByIdAndUpdate(reportDoc._id, { email_sent_at: new Date() });
          
          console.log('✅ Risk assessment report email sent successfully to:', emailAddress);
        } catch (reportError) {
          console.error('❌ Error generating/sending risk assessment report:', reportError.message);
          console.error('Full error:', reportError);
        }
        });
      } else {
        if (!shouldSendEmail) {
          // Still update the report with a note that email was skipped (duplicate)
          await Report.findByIdAndUpdate(reportDoc._id, {
            email_sent_at: new Date(), // Mark as "processed" to prevent future attempts
          });
          console.log('📝 Report marked as processed (email skipped due to duplicate)');
        } else {
          console.warn('⚠️ Skipping assessment email: missing/invalid email or email service not configured');
          // Keep email_sent_at as null so UI/admin can detect that email wasn't delivered.
        }
      }

    } catch (persistErr) {
      console.error('Failed to persist latest assessment summary on user:', persistErr);
    }

    // Log assessment to audit trail
    try {
      await createAuditLog('CREATE', 'Assessment', req, res, userId, {
        before: null,
        after: {
          risk_level: finalResult?.risk_level || 'low',
          probability: finalResult?.diabetes_probability ?? 0,
          enhanced: enhancementStatus.enhanced,
          model_used: enhancementStatus.enhanced ? 'Hybrid (XGBoost + Diabetica 7B)' : 'XGBoost'
        }
      });
    } catch (auditErr) {
      console.error('Failed to log assessment to audit trail:', auditErr);
    }

    const notices = [];
    // If user has an invalid/missing email, warn client in a single professional message.
    // Note: we only validate format here; actual delivery can still fail asynchronously.
    const emailMissingOrInvalid = !user?.email || (typeof user.email === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email));
    const emailServiceNotConfigured = !(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

    if (emailMissingOrInvalid || emailServiceNotConfigured) {
      notices.push(
        "Your assessment results are ready, but we couldn't email your report. The email address on your account may be invalid, or the email service may be temporarily unavailable. Please verify/update your email and try again."
      );
    }

    // Return enhanced result with metadata
    return res.status(200).json({ 
      success: true, 
      data: { 
        features, 
        result: finalResult,
        has_assessment: true,
        is_cached: false,
        assessment_date: new Date(),
        notices,
        enhancement_status: enhancementStatus,
        model_info: {
          primary_model: 'XGBoost (512 records)',
          enhancement_model: enhancementStatus.enhanced ? 'Diabetica 7B LLM' : 'None',
          assessment_type: enhancementStatus.enhanced ? 'Hybrid (Statistical + Medical Reasoning)' : 'Statistical Only'
        }
      } 
    });
  } catch (err) {
    console.error('Assessment error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Assessment failed', 
      error: err.message,
      details: 'An error occurred while processing the diabetes risk assessment'
    });
  }
};






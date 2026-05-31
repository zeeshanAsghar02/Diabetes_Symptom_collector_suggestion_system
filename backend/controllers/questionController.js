import { Question } from "../models/Question.js";
import { Symptom } from "../models/Symptom.js";
import { Answer } from '../models/Answer.js';
import { QuestionsAnswers } from '../models/Questions_Answers.js';
import { UsersAnswers } from '../models/Users_Answers.js';
import { UserPersonalInfo } from '../models/UserPersonalInfo.js';
import mongoose from "mongoose";
import { generateRiskAssessmentPDF } from '../services/pdfGenerationService.js';
import { sendRiskAssessmentEmail } from '../services/emailService.js';
import encryptionService from '../services/encryptionService.js';

const normalizeMeasurement = (featureName, answerText) => {
  const feature = String(featureName || '').toLowerCase();
  if (!feature.includes('height') && !feature.includes('weight')) return {};

  const numeric = Number.parseFloat(String(answerText || '').replace(/[^\d.]/g, ''));
  if (!Number.isFinite(numeric)) return {};

  if (feature.includes('height')) {
    const height = Math.round(numeric);
    return height >= 80 && height <= 260 ? { height } : {};
  }

  const weight = Number(numeric.toFixed(1));
  return weight >= 20 && weight <= 400 ? { weight } : {};
};

const syncProfileMeasurementsFromAnswer = async (userId, question, answerText) => {
  const measurement = normalizeMeasurement(question?.ml_feature_mapping?.feature_name, answerText);
  if (!measurement.height && !measurement.weight) return;

  let personalInfo = await UserPersonalInfo.findOne({ user_id: userId });
  if (!personalInfo) {
    personalInfo = new UserPersonalInfo({ user_id: userId });
  }

  if (measurement.height) personalInfo.height = measurement.height;
  if (measurement.weight) personalInfo.weight = measurement.weight;
  await personalInfo.save();

  console.log('Synced assessment measurement into personal profile:', {
    userId: String(userId),
    ...measurement,
  });
};

// Get all questions for a disease (populate symptom)
export const getQuestionsByDisease = async (req, res) => {
  try {
    const { diseaseId } = req.params;
    const questions = await Question.find({ disease: diseaseId });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: "Error fetching questions", error: err.message });
  }
};



// Get all questions for a symptom
export const getQuestionsBySymptom = async (req, res) => {
  try {
    const { symptomId } = req.params;
    console.log('Fetching questions for symptomId:', symptomId);
    const questions = await Question.find({ symptom_id: new mongoose.Types.ObjectId(symptomId), deleted_at: null });
    console.log('Questions found:', questions);
    res.status(200).json({ success: true, data: questions });
  } catch (err) {
    console.error('Error in getQuestionsBySymptom:', err);
    res.status(500).json({ success: false, message: 'Error fetching questions for symptom', error: err.message });
  }
};

// Add a question to a symptom
export const addQuestion = async (req, res) => {
  try {
    const { symptomId } = req.params;
    const { question_text, question_type, options } = req.body;
    
    const newQuestion = new Question({
      question_text,
      question_type,
      options: options || [],
      symptom_id: symptomId
    });
    
    await newQuestion.save();
    res.status(201).json({ success: true, data: newQuestion });
  } catch (err) {
    console.error('Error adding question:', err);
    res.status(500).json({ success: false, message: 'Error adding question', error: err.message });
  }
};

// Update a question
export const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { question_text, question_type, options } = req.body;
    
    const updatedQuestion = await Question.findByIdAndUpdate(
      id,
      { question_text, question_type, options: options || [] },
      { new: true }
    );
    
    if (!updatedQuestion) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }
    
    res.json({ success: true, data: updatedQuestion });
  } catch (err) {
    console.error('Error updating question:', err);
    res.status(500).json({ success: false, message: 'Error updating question', error: err.message });
  }
};

// Delete a question
export const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedQuestion = await Question.findByIdAndDelete(id);
    
    if (!deletedQuestion) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }
    
    res.json({ success: true, message: 'Question deleted successfully' });
  } catch (err) {
    console.error('Error deleting question:', err);
    res.status(500).json({ success: false, message: 'Error deleting question', error: err.message });
  }
};

// Save user's answer for onboarding
export const saveUserAnswer = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { questionId, answerText } = req.body;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });
    if (!questionId || !answerText) return res.status(400).json({ message: 'Missing questionId or answerText' });

    // 1. Find or create the answer
    let answer = await Answer.findOne({ answer_text: answerText, deleted_at: null });
    if (!answer) {
      answer = await Answer.create({ answer_text: answerText });
    }

    // 2. Ensure Questions_Answers entry exists
    let qa = await QuestionsAnswers.findOne({ question_id: questionId, answer_id: answer._id, deleted_at: null });
    if (!qa) {
      qa = await QuestionsAnswers.create({ question_id: questionId, answer_id: answer._id });
    }

    // 3. Remove previous Users_Answers entries for this user and question (soft delete)
    await UsersAnswers.updateMany({ user_id: userId, question_id: questionId, deleted_at: null }, { $set: { deleted_at: new Date() } });

    // 4. Create Users_Answers entry
    const ua = await UsersAnswers.create({ user_id: userId, question_id: questionId, answer_id: answer._id });

    // Check if user has now completed all onboarding questions
    // Use findOneAndUpdate with atomic operation to prevent race conditions
    const user = await (await import('../models/User.js')).User.findById(userId);
    
    // Find the user's disease (from the most recent answer)
    const question = await Question.findById(questionId).populate({ path: 'symptom_id', populate: { path: 'disease_id' } });
    await syncProfileMeasurementsFromAnswer(userId, question, answerText);
    const disease = question?.symptom_id?.disease_id;
    
    if (disease && !user.onboardingCompleted) {
      // Count total questions for this disease
      const allSymptoms = await Symptom.find({ disease_id: disease._id, deleted_at: null });
      const symptomIds = allSymptoms.map(s => s._id);
      const totalQuestions = await Question.countDocuments({ symptom_id: { $in: symptomIds }, deleted_at: null });
      
      // Count user's answered questions (not deleted)
      const userAnswers = await UsersAnswers.find({ user_id: userId, deleted_at: null });
      const answeredQuestions = new Set(userAnswers.map(ua => String(ua.question_id))).size;
      
      console.log('📊 Completion check:', {
        totalQuestions,
        answeredQuestions,
        isComplete: totalQuestions > 0 && answeredQuestions === totalQuestions
      });
      
      if (totalQuestions > 0 && answeredQuestions === totalQuestions) {
        console.log('🎉 User has completed all questions! Attempting to update...');
        
        // Use atomic operation to prevent multiple emails
        const updatedUser = await (await import('../models/User.js')).User.findOneAndUpdate(
          { 
            _id: userId, 
            onboardingCompleted: { $ne: true } // Only update if not already completed
          },
          {
            $set: {
              onboardingCompleted: true,
              onboardingCompletedAt: new Date(),
              diseaseDataSubmittedAt: new Date(),
              diseaseDataEditingExpiresAt: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)), // 7 days
              diseaseDataStatus: 'draft'
            }
          },
          { new: true } // Return the updated document
        );
        
        // Only send email if the user was actually updated (not already completed)
        if (updatedUser) {
          console.log('✅ User updated successfully, checking email conditions...');
          
          // Additional check to prevent duplicate emails
          const { canSendOnboardingEmail } = await import('../utils/emailUtils.js');
          
          const canSend = await canSendOnboardingEmail(userId, user.email);
          console.log('📧 Can send email:', canSend);
          
          if (canSend) {
            console.log('📧 Fetching user answers for email...');
            
            // Fetch all user's answers for this disease
            const detailedAnswers = await UsersAnswers.find({ user_id: userId, deleted_at: null })
              .populate({
                path: 'question_id',
                populate: {
                  path: 'symptom_id',
                  model: 'Symptom',
                },
                model: 'Question',
              })
              .populate({
                path: 'answer_id',
                model: 'Answer'
              });
            
            console.log('📧 Found answers:', detailedAnswers.length);
            
            // Group answers by symptom
            const symptomMap = {};
            detailedAnswers.forEach(ua => {
              const symptom = ua.question_id?.symptom_id;
              if (!symptom) return;
              const symptomName = symptom.name || 'Unknown Symptom';
              if (!symptomMap[symptomName]) {
                symptomMap[symptomName] = [];
              }
              symptomMap[symptomName].push({
                question: ua.question_id?.question_text || 'Unknown Question',
                answer: ua.answer_id?.answer_text || 'N/A',
              });
            });
            
            console.log('📧 Symptom map created:', Object.keys(symptomMap));
            
            // Send onboarding completion email with details
            try {
              console.log('📧 Attempting to send email to:', user.email);
              console.log('📧 User details:', { fullName: user.fullName, diseaseName: disease.name });
              console.log('📧 Symptom map keys:', Object.keys(symptomMap));
              
              const { sendOnboardingCompletionEmail } = await import('../services/emailService.js');
              console.log('📧 Email service imported successfully');
              
              await sendOnboardingCompletionEmail(user.email, user.fullName, disease.name, symptomMap);
              console.log('✅ Onboarding completion email sent successfully!');
              console.log('ℹ️ Risk assessment report will be sent after user completes the assessment.');
              
            } catch (emailError) {
              console.error('❌ Email sending failed:', emailError.message);
              console.error('❌ Full email error:', emailError);
              console.error('❌ Error stack:', emailError.stack);
              // Don't fail the entire request if email fails
            }
          } else {
            console.log('⚠️ Email sending blocked by duplicate prevention');
          }
        } else {
          console.log('⚠️ User was not updated (already completed)');
        }
      }
    }

    return res.status(201).json({ success: true, message: 'Answer saved', answerId: answer._id });
  } catch (err) {
    console.error('Error saving user answer:', err);
    res.status(500).json({ success: false, message: 'Error saving answer', error: err.message });
  }
}; 

// Complete onboarding without submitting a new answer (frontend action)
export const completeOnboarding = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });

    const UserModel = (await import('../models/User.js')).User;
    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.onboardingCompleted) {
      return res.status(200).json({ success: true, message: 'Onboarding already completed' });
    }

    // Determine disease by looking at user's latest answered questions if any
    const userAnswers = await UsersAnswers.find({ user_id: userId, deleted_at: null })
      .populate({ path: 'question_id', populate: { path: 'symptom_id', model: 'Symptom' }, model: 'Question' });

    if (!userAnswers || userAnswers.length === 0) {
      return res.status(400).json({ success: false, message: 'No answers found for user' });
    }

    // Infer disease from the first populated answer's symptom
    const disease = userAnswers[0]?.question_id?.symptom_id?.disease_id;
    if (!disease) {
      return res.status(400).json({ success: false, message: 'Unable to determine disease for completion' });
    }

    // Count total questions for this disease
    const allSymptoms = await Symptom.find({ disease_id: disease._id, deleted_at: null });
    const symptomIds = allSymptoms.map(s => s._id);
    const totalQuestions = await Question.countDocuments({ symptom_id: { $in: symptomIds }, deleted_at: null });

    const answeredQuestions = new Set(userAnswers.map(ua => String(ua.question_id._id))).size;

    if (totalQuestions === 0) {
      return res.status(400).json({ success: false, message: 'No questions defined for disease' });
    }

    if (answeredQuestions !== totalQuestions) {
      return res.status(400).json({ success: false, message: 'User has not answered all questions', totalQuestions, answeredQuestions });
    }

    // Update user atomically
    const updatedUser = await UserModel.findOneAndUpdate(
      { _id: userId, onboardingCompleted: { $ne: true } },
      {
        $set: {
          onboardingCompleted: true,
          onboardingCompletedAt: new Date(),
          diseaseDataSubmittedAt: new Date(),
          diseaseDataEditingExpiresAt: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)),
          diseaseDataStatus: 'draft'
        }
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(200).json({ success: true, message: 'Onboarding already completed' });
    }

    // Prepare symptom map for email
    const detailedAnswers = await UsersAnswers.find({ user_id: userId, deleted_at: null })
      .populate({ path: 'question_id', populate: { path: 'symptom_id', model: 'Symptom' }, model: 'Question' })
      .populate({ path: 'answer_id', model: 'Answer' });

    const symptomMap = {};
    detailedAnswers.forEach(ua => {
      const symptom = ua.question_id?.symptom_id;
      if (!symptom) return;
      const symptomName = symptom.name || 'Unknown Symptom';
      if (!symptomMap[symptomName]) symptomMap[symptomName] = [];
      symptomMap[symptomName].push({ question: ua.question_id?.question_text || 'Unknown', answer: ua.answer_id?.answer_text || 'N/A' });
    });

    // Send onboarding completion email if allowed
    try {
      const { canSendOnboardingEmail } = await import('../utils/emailUtils.js');
      const canSend = await canSendOnboardingEmail(userId, user.email);
      if (canSend) {
        const { sendOnboardingCompletionEmail } = await import('../services/emailService.js');
        await sendOnboardingCompletionEmail(user.email, user.fullName, disease.name, symptomMap);
      }
    } catch (emailErr) {
      console.error('Email send failed during completeOnboarding:', emailErr);
    }

    return res.status(200).json({ success: true, message: 'Onboarding completed' });
  } catch (err) {
    console.error('Error in completeOnboarding:', err);
    return res.status(500).json({ success: false, message: 'Error completing onboarding', error: err.message });
  }
};

// Batch save onboarding answers (for post-login submission)
export const batchSaveOnboardingAnswers = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { answers } = req.body; // Array of { questionId, answerText }
    
    console.log('\n🔵 ========== BATCH SAVE ANSWERS START ==========');
    console.log('📥 User ID:', userId);
    console.log('📥 Received answers count:', answers?.length);
    console.log('📥 Answers data:', JSON.stringify(answers, null, 2));
    
    if (!userId) {
      console.error('❌ Not authenticated - no user ID');
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      console.error('❌ Invalid answers array');
      return res.status(400).json({ success: false, message: 'Invalid answers array' });
    }

    const savedAnswers = [];
    const errors = [];
    
    // Process each answer
    for (const item of answers) {
      const { questionId, answerText } = item;
      
      console.log(`\n📝 Processing answer for question ${questionId}...`);
      console.log(`   Answer text: "${answerText}"`);
      
      if (!questionId || !answerText) {
        console.warn('⚠️  Skipping invalid answer (missing questionId or answerText):', item);
        errors.push({ questionId, error: 'Missing questionId or answerText' });
        continue;
      }

      try {
        // Find or create the answer
        console.log(`   🔍 Looking for existing answer: "${answerText}"`);
        let answer = await Answer.findOne({ answer_text: answerText, deleted_at: null });
        if (!answer) {
          console.log('   ➕ Creating new answer in database...');
          answer = await Answer.create({ answer_text: answerText });
          console.log(`   ✅ Answer created with ID: ${answer._id}`);
        } else {
          console.log(`   ✅ Found existing answer with ID: ${answer._id}`);
        }

        // Ensure Questions_Answers entry exists
        console.log(`   🔗 Linking question ${questionId} with answer ${answer._id}...`);
        let qa = await QuestionsAnswers.findOne({ 
          question_id: questionId, 
          answer_id: answer._id, 
          deleted_at: null 
        });
        if (!qa) {
          console.log('   ➕ Creating Questions_Answers link...');
          qa = await QuestionsAnswers.create({ 
            question_id: questionId, 
            answer_id: answer._id 
          });
          console.log(`   ✅ Link created with ID: ${qa._id}`);
        } else {
          console.log(`   ✅ Link already exists with ID: ${qa._id}`);
        }

        // Remove previous Users_Answers entries for this user and question
        console.log(`   🗑️  Soft-deleting any previous answers...`);
        const deleteResult = await UsersAnswers.updateMany(
          { user_id: userId, question_id: questionId, deleted_at: null },
          { $set: { deleted_at: new Date() } }
        );
        console.log(`   🗑️  Deleted ${deleteResult.modifiedCount} previous answers`);

        // Create new Users_Answers entry
        console.log(`   ➕ Creating Users_Answers entry...`);
        const ua = await UsersAnswers.create({ 
          user_id: userId, 
          question_id: questionId, 
          answer_id: answer._id 
        });
        console.log(`   ✅ Users_Answers created with ID: ${ua._id}`);

        const answeredQuestion = await Question.findById(questionId).select('question_text ml_feature_mapping');
        await syncProfileMeasurementsFromAnswer(userId, answeredQuestion, answerText);

        savedAnswers.push({ questionId, answerId: answer._id, usersAnswersId: ua._id });
        console.log(`   ✅ Successfully saved answer for question ${questionId}`);
      } catch (err) {
        console.error(`   ❌ Error saving answer for question ${questionId}:`, err.message);
        console.error('   Error stack:', err.stack);
        errors.push({ questionId, error: err.message });
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Successfully saved: ${savedAnswers.length} answers`);
    console.log(`   ❌ Failed: ${errors.length} answers`);
    if (errors.length > 0) {
      console.log('   ❌ Errors:', errors);
    }
    
    // Verify data was actually written to database
    console.log('\n🔍 Verifying database writes...');
    const verifyCount = await UsersAnswers.countDocuments({ 
      user_id: userId, 
      deleted_at: null 
    });
    console.log(`✅ Total answers in database for user: ${verifyCount}`);

    // Check if user has completed onboarding
    console.log('\n🔍 Checking onboarding completion status...');
    const user = await (await import('../models/User.js')).User.findById(userId);
    
    // Find the disease from the first question
    if (answers.length > 0) {
      const firstQuestion = await Question.findById(answers[0].questionId)
        .populate({ path: 'symptom_id', populate: { path: 'disease_id' } });
      const disease = firstQuestion?.symptom_id?.disease_id;
      
      if (disease && !user.onboardingCompleted) {
        // Count total questions for this disease
        const allSymptoms = await Symptom.find({ disease_id: disease._id, deleted_at: null });
        const symptomIds = allSymptoms.map(s => s._id);
        const totalQuestions = await Question.countDocuments({ 
          symptom_id: { $in: symptomIds }, 
          deleted_at: null 
        });
        
        // Count user's answered questions
        const userAnswers = await UsersAnswers.find({ user_id: userId, deleted_at: null });
        const answeredQuestions = new Set(userAnswers.map(ua => String(ua.question_id))).size;
        
        console.log(`📊 Progress: ${answeredQuestions}/${totalQuestions} questions answered`);
        
        if (totalQuestions > 0 && answeredQuestions >= totalQuestions) {
          user.onboardingCompleted = true;
          user.onboardingCompletedAt = user.onboardingCompletedAt || new Date();
          user.diseaseDataSubmittedAt = user.diseaseDataSubmittedAt || new Date();
          user.diseaseDataEditingExpiresAt = user.diseaseDataEditingExpiresAt || new Date(Date.now() + (7 * 24 * 60 * 60 * 1000));
          user.diseaseDataStatus = user.diseaseDataStatus || 'draft';
          await user.save();
          console.log('🎉 User completed onboarding via batch save!');
        }
      }
    }
    
    console.log('🔵 ========== BATCH SAVE ANSWERS END ==========\n');

    return res.status(200).json({ 
      success: true, 
      message: `Successfully saved ${savedAnswers.length} answers`,
      savedCount: savedAnswers.length,
      totalSubmitted: answers.length,
      errors: errors.length > 0 ? errors : undefined,
      verifiedCount: verifyCount
    });
  } catch (err) {
    console.error('Error in batchSaveOnboardingAnswers:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Error batch saving answers', 
      error: err.message 
    });
  }
};

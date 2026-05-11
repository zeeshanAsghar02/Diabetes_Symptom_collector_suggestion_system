import { UserPersonalInfo } from '../models/UserPersonalInfo.js';
import { UserMedicalInfo } from '../models/UserMedicalInfo.js';
import { User } from '../models/User.js';
import { createAuditLog } from '../middlewares/auditMiddleware.js';
import encryptionService from '../services/encryptionService.js';

// Get user's personal information
export const getPersonalInfo = async (req, res) => {
    try {
        const userId = req.user._id;
        
        console.log('📥 getPersonalInfo called for user:', userId);
        
        const personalInfo = await UserPersonalInfo.findOne({ user_id: userId });
        const user = await User.findById(userId).select('fullName country country_code phone_number');
        
        console.log('👤 User data:', {
            country: user?.country,
            country_code: user?.country_code,
            phone_number: user?.phone_number ? String(user.phone_number).substring(0, 50) + '...' : 'none'
        });
        
        if (!personalInfo) {
            // Return user data even if personal info doesn't exist yet
            return res.status(200).json({
                success: true,
                data: {
                    fullName: user?.fullName || '',
                    country: user?.country || '',
                    country_code: user?.country_code || '',
                    phone_number: user?.phone_number || ''
                }
            });
        }
        
        console.log('📋 Personal info found - merging with user data');
        
        // Helper function to decrypt if still encrypted
        const decryptIfNeeded = (value) => {
            if (!value) return value;
            if (typeof value === 'string' && encryptionService.isEncrypted(value)) {
                try {
                    return encryptionService.decrypt(value);
                } catch (err) {
                    console.error('Decryption error:', err.message);
                    return value;
                }
            }
            return value;
        };
        
        // Manually decrypt all fields as fallback (in case middleware didn't run)
        const date_of_birth = decryptIfNeeded(personalInfo.date_of_birth);
        const gender = decryptIfNeeded(personalInfo.gender);
        const height = decryptIfNeeded(personalInfo.height);
        const weight = decryptIfNeeded(personalInfo.weight);
        const activity_level = decryptIfNeeded(personalInfo.activity_level);
        const dietary_preference = decryptIfNeeded(personalInfo.dietary_preference);
        const smoking_status = decryptIfNeeded(personalInfo.smoking_status);
        const alcohol_use = decryptIfNeeded(personalInfo.alcohol_use);
        const sleep_hours = decryptIfNeeded(personalInfo.sleep_hours);
        
        console.log('🔍 Decrypted values check:', {
            gender: typeof gender === 'string' && gender.includes(':') ? 'STILL ENCRYPTED' : 'OK',
            height: typeof height === 'string' && height.includes(':') ? 'STILL ENCRYPTED' : 'OK',
            weight: typeof weight === 'string' && weight.includes(':') ? 'STILL ENCRYPTED' : 'OK'
        });
        
        // Decrypt nested objects
        const emergency_contact = personalInfo.emergency_contact ? {
            name: decryptIfNeeded(personalInfo.emergency_contact.name),
            phone: decryptIfNeeded(personalInfo.emergency_contact.phone),
            relationship: decryptIfNeeded(personalInfo.emergency_contact.relationship)
        } : undefined;
        
        const address = personalInfo.address ? {
            street: decryptIfNeeded(personalInfo.address.street),
            city: decryptIfNeeded(personalInfo.address.city),
            state: decryptIfNeeded(personalInfo.address.state),
            zip_code: decryptIfNeeded(personalInfo.address.zip_code),
            country: decryptIfNeeded(personalInfo.address.country)
        } : undefined;
        
        const responseData = {
            _id: personalInfo._id,
            user_id: personalInfo.user_id,
            date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
            gender,
            height: height ? parseFloat(height) : null,
            weight: weight ? parseFloat(weight) : null,
            activity_level,
            dietary_preference,
            smoking_status,
            alcohol_use,
            sleep_hours: sleep_hours ? parseInt(sleep_hours) : null,
            emergency_contact,
            address,
            fullName: user?.fullName || '',
            country: user?.country || '',
            country_code: user?.country_code || '',
            phone_number: user?.phone_number || '',
            createdAt: personalInfo.createdAt,
            updatedAt: personalInfo.updatedAt
        };
        
        console.log('✅ Sending response with manually decrypted data');
        
        return res.status(200).json({
            success: true,
            data: responseData,
        });
    } catch (err) {
        console.error('❌ Error fetching personal info:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error.',
        });
    }
};

// Create or update user's personal information
export const upsertPersonalInfo = async (req, res) => {
    try {
        const userId = req.user._id;
        
        console.log('🔍 FULL REQUEST BODY:', JSON.stringify(req.body, null, 2));
        
        const {
            date_of_birth,
            gender,
            country,
            country_code,
            phone_number,
            height,
            weight,
            activity_level,
            dietary_preference,
            smoking_status,
            alcohol_use,
            sleep_hours,
            emergency_contact,
            address,
        } = req.body;
        
        console.log('📝 Extracted fields:', { 
            date_of_birth, 
            gender, 
            country, 
            country_code, 
            phone_number,
            height,
            weight
        });
        
        // Validate required fields (temporarily make country optional for testing)
        if (!date_of_birth || !gender || !height || !weight) {
            console.log('❌ Validation failed - missing required fields');
            return res.status(400).json({
                success: false,
                message: 'Date of birth, gender, height, and weight are required.',
            });
        }
        
        // Log what we're about to save
        console.log('💾 Attempting to save country data:', { country, country_code, phone_number });
        
        // Update User model with country, phone, gender, and date_of_birth - use .save() to trigger encryption middleware
        const oldUser = await User.findById(userId);
        let userUpdated = false;
        
        if (oldUser) {
            const userBefore = { 
                country: oldUser.country, 
                country_code: oldUser.country_code, 
                phone_number: oldUser.phone_number,
                gender: oldUser.gender,
                date_of_birth: oldUser.date_of_birth
            };
            
            // Update fields if values are provided
            if (country !== undefined) oldUser.country = country;
            if (country_code !== undefined) oldUser.country_code = country_code;
            if (phone_number !== undefined) oldUser.phone_number = phone_number;
            if (gender !== undefined) oldUser.gender = gender;
            if (date_of_birth !== undefined) oldUser.date_of_birth = date_of_birth;
            
            await oldUser.save(); // Triggers pre-save encryption middleware
            
            console.log('✅ User updated with country and personal data:', oldUser.country, oldUser.country_code, oldUser.phone_number, oldUser.gender, oldUser.date_of_birth);
            
            await createAuditLog('UPDATE', 'User', req, res, userId, {
                before: userBefore,
                after: { 
                    country: oldUser.country, 
                    country_code: oldUser.country_code, 
                    phone_number: oldUser.phone_number,
                    gender: oldUser.gender,
                    date_of_birth: oldUser.date_of_birth
                }
            });
            userUpdated = true;
        }
        
        const updatedUser = await User.findById(userId);
        
        const personalInfoData = {
            user_id: userId,
            date_of_birth,
            gender,
            height,
            weight,
            activity_level,
            dietary_preference,
            smoking_status,
            alcohol_use,
            sleep_hours,
            emergency_contact,
            address,
        };
        
        // Update or create - use findOne + save to trigger encryption middleware
        let personalInfo = await UserPersonalInfo.findOne({ user_id: userId });
        
        if (personalInfo) {
            // Update existing document
            const oldPersonalInfo = JSON.parse(JSON.stringify(personalInfo.toObject()));
            Object.assign(personalInfo, personalInfoData);
            personalInfo = await personalInfo.save(); // Triggers pre-save encryption middleware
            
            await createAuditLog('UPDATE', 'UserPersonalInfo', req, res, userId, {
                before: { date_of_birth: oldPersonalInfo.date_of_birth, gender: oldPersonalInfo.gender, height: oldPersonalInfo.height, weight: oldPersonalInfo.weight },
                after: { date_of_birth: personalInfo.date_of_birth, gender: personalInfo.gender, height: personalInfo.height, weight: personalInfo.weight }
            });
        } else {
            // Create new document
            personalInfo = new UserPersonalInfo(personalInfoData);
            personalInfo = await personalInfo.save(); // Triggers pre-save encryption middleware
            
            await createAuditLog('CREATE', 'UserPersonalInfo', req, res, userId, {
                before: null,
                after: { date_of_birth: personalInfo.date_of_birth, gender: personalInfo.gender, height: personalInfo.height, weight: personalInfo.weight }
            });
        }
        
        // Mark onboarding as complete once the four required fields are present
        const hasRequired = personalInfoData.date_of_birth && personalInfoData.gender &&
                            personalInfoData.height && personalInfoData.weight;
        let onboardingCompleted = false;
        if (hasRequired) {
            await User.findByIdAndUpdate(userId, {
                onboardingCompleted: true,
                onboardingCompletedAt: new Date(),
            });
            onboardingCompleted = true;
        }

        return res.status(200).json({
            success: true,
            message: 'Personal information saved successfully.',
            data: personalInfo,
            onboardingCompleted,
        });
    } catch (err) {
        console.error('❌ Error saving personal info:', err);
        console.error('❌ Error stack:', err.stack);
        console.error('❌ Error name:', err.name);
        console.error('❌ Error message:', err.message);
        
        return res.status(500).json({
            success: false,
            message: err.message || 'Server error while saving personal information.',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

// Get user's medical information
export const getMedicalInfo = async (req, res) => {
    try {
        const userId = req.user._id;
        
        const medicalInfo = await UserMedicalInfo.findOne({ user_id: userId });
        
        if (!medicalInfo) {
            return res.status(200).json({
                success: true,
                data: {},
                message: 'Medical information not found.',
            });
        }
        
        // Helper function to decrypt if still encrypted
        const decryptIfNeeded = (value) => {
            if (!value) return value;
            if (typeof value === 'string' && encryptionService.isEncrypted(value)) {
                try {
                    return encryptionService.decrypt(value);
                } catch (err) {
                    console.error('Decryption error:', err.message);
                    return value;
                }
            }
            return value;
        };
        
        // Manually decrypt all fields as fallback
        const diabetes_type = decryptIfNeeded(medicalInfo.diabetes_type);
        const diagnosis_date = decryptIfNeeded(medicalInfo.diagnosis_date);
        const last_medical_checkup = decryptIfNeeded(medicalInfo.last_medical_checkup);
        
        // Decrypt medications
        const current_medications = medicalInfo.current_medications?.map(med => ({
            medication_name: decryptIfNeeded(med.medication_name),
            dosage: decryptIfNeeded(med.dosage),
            frequency: decryptIfNeeded(med.frequency),
            _id: med._id
        }));
        
        // Decrypt allergies
        const allergies = medicalInfo.allergies?.map(allergy => ({
            allergen: decryptIfNeeded(allergy.allergen),
            reaction: decryptIfNeeded(allergy.reaction),
            _id: allergy._id
        }));
        
        // Decrypt chronic conditions
        const chronic_conditions = medicalInfo.chronic_conditions?.map(condition => ({
            condition_name: decryptIfNeeded(condition.condition_name),
            diagnosed_date: decryptIfNeeded(condition.diagnosed_date),
            _id: condition._id
        }));
        
        // Decrypt family history
        const family_history = medicalInfo.family_history?.map(history => ({
            relation: decryptIfNeeded(history.relation),
            condition: decryptIfNeeded(history.condition),
            _id: history._id
        }));
        
        // Decrypt lab results
        const recent_lab_results = medicalInfo.recent_lab_results ? {
            hba1c: medicalInfo.recent_lab_results.hba1c ? {
                value: decryptIfNeeded(medicalInfo.recent_lab_results.hba1c.value),
                date: decryptIfNeeded(medicalInfo.recent_lab_results.hba1c.date),
                unit: decryptIfNeeded(medicalInfo.recent_lab_results.hba1c.unit)
            } : undefined,
            fasting_glucose: medicalInfo.recent_lab_results.fasting_glucose ? {
                value: decryptIfNeeded(medicalInfo.recent_lab_results.fasting_glucose.value),
                date: decryptIfNeeded(medicalInfo.recent_lab_results.fasting_glucose.date),
                unit: decryptIfNeeded(medicalInfo.recent_lab_results.fasting_glucose.unit)
            } : undefined,
            cholesterol: medicalInfo.recent_lab_results.cholesterol ? {
                total: decryptIfNeeded(medicalInfo.recent_lab_results.cholesterol.total),
                ldl: decryptIfNeeded(medicalInfo.recent_lab_results.cholesterol.ldl),
                hdl: decryptIfNeeded(medicalInfo.recent_lab_results.cholesterol.hdl),
                date: decryptIfNeeded(medicalInfo.recent_lab_results.cholesterol.date),
                unit: decryptIfNeeded(medicalInfo.recent_lab_results.cholesterol.unit)
            } : undefined
        } : undefined;
        
        // Decrypt blood pressure
        const blood_pressure = medicalInfo.blood_pressure ? {
            systolic: decryptIfNeeded(medicalInfo.blood_pressure.systolic),
            diastolic: decryptIfNeeded(medicalInfo.blood_pressure.diastolic),
            last_recorded: decryptIfNeeded(medicalInfo.blood_pressure.last_recorded)
        } : undefined;
        
        const responseData = {
            _id: medicalInfo._id,
            user_id: medicalInfo.user_id,
            diabetes_type,
            diagnosis_date: diagnosis_date ? new Date(diagnosis_date) : null,
            current_medications,
            allergies,
            chronic_conditions,
            family_history,
            recent_lab_results,
            blood_pressure,
            last_medical_checkup: last_medical_checkup ? new Date(last_medical_checkup) : null,
            createdAt: medicalInfo.createdAt,
            updatedAt: medicalInfo.updatedAt
        };
        
        console.log('✅ Sending medical info with manually decrypted data');
        
        return res.status(200).json({
            success: true,
            data: responseData,
        });
    } catch (err) {
        console.error('Error fetching medical info:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error.',
        });
    }
};

// Create or update user's medical information
export const upsertMedicalInfo = async (req, res) => {
    try {
        const userId = req.user._id;
        const {
            diabetes_type,
            diagnosis_date,
            current_medications,
            allergies,
            chronic_conditions,
            family_history,
            recent_lab_results,
            blood_pressure,
            last_medical_checkup,
        } = req.body;
        
        // Validate required fields
        if (!diabetes_type || !diagnosis_date) {
            return res.status(400).json({
                success: false,
                message: 'Diabetes type and diagnosis date are required.',
            });
        }
        
        const medicalInfoData = {
            user_id: userId,
            diabetes_type,
            diagnosis_date,
            current_medications: Array.isArray(current_medications) ? current_medications : [],
            allergies: Array.isArray(allergies) ? allergies : [],
            chronic_conditions: Array.isArray(chronic_conditions) ? chronic_conditions : [],
            family_history: Array.isArray(family_history) ? family_history : [],
            recent_lab_results,
            blood_pressure,
            last_medical_checkup,
        };
        
        // Update or create - use findOne + save to trigger encryption middleware
        let medicalInfo = await UserMedicalInfo.findOne({ user_id: userId });
        
        if (medicalInfo) {
            // Update existing document
            const oldMedicalInfo = JSON.parse(JSON.stringify(medicalInfo.toObject()));
            Object.assign(medicalInfo, medicalInfoData);
            medicalInfo = await medicalInfo.save(); // Triggers pre-save encryption middleware
            
            await createAuditLog('UPDATE', 'UserMedicalInfo', req, res, userId, {
                before: { diabetes_type: oldMedicalInfo.diabetes_type, diagnosis_date: oldMedicalInfo.diagnosis_date, current_medications: oldMedicalInfo.current_medications },
                after: { diabetes_type: medicalInfo.diabetes_type, diagnosis_date: medicalInfo.diagnosis_date, current_medications: medicalInfo.current_medications }
            });
        } else {
            // Create new document
            medicalInfo = new UserMedicalInfo(medicalInfoData);
            medicalInfo = await medicalInfo.save(); // Triggers pre-save encryption middleware
            
            await createAuditLog('CREATE', 'UserMedicalInfo', req, res, userId, {
                before: null,
                after: { diabetes_type: medicalInfo.diabetes_type, diagnosis_date: medicalInfo.diagnosis_date, current_medications: medicalInfo.current_medications }
            });
        }
        
        return res.status(200).json({
            success: true,
            message: 'Medical information saved successfully.',
            data: medicalInfo,
        });
    } catch (err) {
        console.error('❌ Error saving medical info:', err);
        console.error('❌ Error stack:', err.stack);
        console.error('❌ Error name:', err.name);
        console.error('❌ Error message:', err.message);
        
        return res.status(500).json({
            success: false,
            message: err.message || 'Server error while saving medical information.',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

// Update diabetes diagnosis status
export const updateDiabetesDiagnosis = async (req, res) => {
    try {
        console.log('=== updateDiabetesDiagnosis called ===');
        console.log('User ID:', req.user?._id);
        console.log('Request body:', req.body);
        
        const userId = req.user._id;
        const { diabetes_diagnosed } = req.body;
        
        // Validate input
        if (!diabetes_diagnosed || !['yes', 'no'].includes(diabetes_diagnosed)) {
            console.log('Validation failed:', diabetes_diagnosed);
            return res.status(400).json({
                success: false,
                message: 'Invalid diabetes diagnosis status. Must be "yes" or "no".',
            });
        }
        
        const user = await User.findById(userId);
        console.log('User found:', user ? 'Yes' : 'No');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.',
            });
        }
        
        // Update diabetes diagnosis status
        user.diabetes_diagnosed = diabetes_diagnosed;
        user.diabetes_diagnosed_answered_at = new Date();
        await user.save();
        
        console.log('User updated successfully');
        
        return res.status(200).json({
            success: true,
            message: 'Diabetes diagnosis status updated successfully.',
            data: {
                diabetes_diagnosed: user.diabetes_diagnosed,
                diabetes_diagnosed_answered_at: user.diabetes_diagnosed_answered_at,
            },
        });
    } catch (err) {
        console.error('Error updating diabetes diagnosis:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error.',
        });
    }
};

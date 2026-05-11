import { User } from '../models/User.js';
import { UsersRoles } from '../models/User_Role.js';
import { UsersAnswers } from '../models/Users_Answers.js';
import { Question } from '../models/Question.js';
import { Symptom } from '../models/Symptom.js';
import { Disease } from '../models/Disease.js';
import { Answer } from '../models/Answer.js';
import { QuestionsAnswers } from '../models/Questions_Answers.js';
import { Role } from '../models/Role.js';
import { createAuditLog } from '../middlewares/auditMiddleware.js';
import { UserPersonalInfo } from '../models/UserPersonalInfo.js';
import { UserMedicalInfo } from '../models/UserMedicalInfo.js';
import { Habit } from '../models/Habit.js';

const normalizeRoleName = (roleName) => {
    if (!roleName || typeof roleName !== 'string') return '';
    return roleName.trim().toLowerCase().replace(/\s+/g, '_');
};


// Get current user controller
export const getProfile = async (req, res) => {
    try {
        const userId = req.user._id;

        const [user, personalInfo, medicalInfo] = await Promise.all([
            User.findById(userId).select('-password -refreshToken -activationToken -resetPasswordToken'),
            UserPersonalInfo.findOne({ user_id: userId }),
            UserMedicalInfo.findOne({ user_id: userId })
        ]);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.status(200).json({
            success: true,
            data: {
                user: user.toObject(),
                personalInfo: personalInfo ? personalInfo.toObject() : {},
                medicalInfo: medicalInfo ? medicalInfo.toObject() : {},
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching user profile'
        });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const { personalInfo, medicalInfo } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Update Personal Info
        if (personalInfo) {
            // If personal info contains fullName, update the main User model as well
            if (personalInfo.fullName) {
                user.fullName = personalInfo.fullName;
                await user.save();
            }
            await UserPersonalInfo.findOneAndUpdate({ user_id: userId }, personalInfo, { upsert: true, new: true, runValidators: true });
        }

        // Update Medical Info
        if (medicalInfo) {
            await UserMedicalInfo.findOneAndUpdate({ user_id: userId }, medicalInfo, { upsert: true, new: true, runValidators: true });
        }

        // Refetch the updated profile to return the latest state
        const [updatedUser, updatedPersonalInfo, updatedMedicalInfo] = await Promise.all([
            User.findById(userId).select('-password -refreshToken -activationToken -resetPasswordToken'),
            UserPersonalInfo.findOne({ user_id: userId }),
            UserMedicalInfo.findOne({ user_id: userId })
        ]);

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: updatedUser.toObject(),
                personalInfo: updatedPersonalInfo ? updatedPersonalInfo.toObject() : {},
                medicalInfo: updatedMedicalInfo ? updatedMedicalInfo.toObject() : {},
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: error.message,
        });
    }
};

export const getCurrentUser = async (req, res) => {
    try {
        const user = req.user;
        // Fetch user roles
        const userRoles = await UsersRoles.find({ user_id: user._id }).populate('role_id');
        const roles = userRoles.map(ur => ur.role_id.role_name);
        return res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    gender: user.gender,
                    date_of_birth: user.date_of_birth,
                    phone_number: user.phone_number,
                    country: user.country,
                    whatsapp_number: user.whatsapp_number,
                    diabetes_diagnosed: user.diabetes_diagnosed,
                    isActivated: user.isActivated,
                    roles: roles
                }
            }
        });
    } catch (error) {
        console.error('Get current user error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching user data'
        });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        // Fetch roles for each user
        const usersWithRoles = await Promise.all(users.map(async (user) => {
            const userRoles = await UsersRoles.find({ user_id: user._id }).populate('role_id');
            const roles = userRoles
                .map(ur => normalizeRoleName(ur.role_id?.role_name))
                .filter(Boolean);
            // Exclude sensitive fields
            const { password, refreshToken, activationToken, resetPasswordToken, ...safeUser } = user.toObject();
            return { ...safeUser, roles };
        }));
        return res.status(200).json({
            success: true,
            data: usersWithRoles
        });
    } catch (error) {
        console.error('Get all users error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching users'
        });
    }
};


export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, email, gender, date_of_birth, isActivated, phone_number, whatsapp_number, country } = req.body;

        // Find user
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Validate required fields
        if (!fullName || !fullName.trim()) {
            return res.status(400).json({ success: false, message: "Full name is required and cannot be empty" });
        }
        if (!email || !email.trim()) {
            return res.status(400).json({ success: false, message: "Email is required and cannot be empty" });
        }

        // Normalize email (lowercase and trim)
        const normalizeEmail = (email) => {
            if (!email || typeof email !== 'string') return email;
            return email.trim().toLowerCase();
        };
        const normalizedEmail = normalizeEmail(email);
        
        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({ 
                success: false, 
                message: "Please enter a valid email address" 
            });
        }
        
        // Check for email uniqueness if email is being changed (compare normalized emails)
        if (normalizedEmail !== normalizeEmail(user.email)) {
            const existingUser = await User.findOne({ email: normalizedEmail });
            if (existingUser) {
                return res.status(400).json({ success: false, message: "Email is already in use by another user" });
            }
        }

        // Validate date of birth if provided
        if (date_of_birth) {
            const dobDate = new Date(date_of_birth);
            const today = new Date();
            
            if (isNaN(dobDate.getTime())) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Invalid date of birth format" 
                });
            }
            
            if (dobDate > today) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Date of birth cannot be in the future" 
                });
            }
            
            // Check if user is at least 5 years old (reasonable minimum)
            const minAge = new Date();
            minAge.setFullYear(minAge.getFullYear() - 5);
            if (dobDate > minAge) {
                return res.status(400).json({ 
                    success: false, 
                    message: "User must be at least 5 years old" 
                });
            }
        }

        // Build update object with only provided fields
        const updateData = {
            fullName: fullName.trim(),
            email: normalizedEmail,
        };
        
        if (gender) updateData.gender = gender;
        if (date_of_birth) updateData.date_of_birth = date_of_birth;
        if (phone_number !== undefined) updateData.phone_number = phone_number;
        if (whatsapp_number !== undefined) updateData.whatsapp_number = whatsapp_number;
        if (country !== undefined) updateData.country = country;
        if (isActivated !== undefined) updateData.isActivated = isActivated;

        // Update user (store normalized email)
        const updatedUser = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        // Log user update to audit trail
        try {
            await createAuditLog('UPDATE', 'User', req, res, id, {
                before: { email: user.email, fullName: user.fullName },
                after: { email: updatedUser.email, fullName: updatedUser.fullName },
                fields_modified: Object.keys(updateData)
            });
        } catch (auditErr) {
            console.error('Failed to log user update to audit trail:', auditErr);
        }

        return res.status(200).json({
            success: true,
            message: "User updated successfully",
            data: updatedUser
        });
    } catch (error) {
        console.error('Update user error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating user'
        });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        
        // CRITICAL PROTECTION: Check if user has super_admin role
        const userRoles = await UsersRoles.find({ user_id: id }).populate('role_id');
        const isSuperAdmin = userRoles.some(ur => ur.role_id?.role_name === 'super_admin');
        
        if (isSuperAdmin) {
            return res.status(403).json({
                success: false,
                message: "Super Admins cannot be deleted! This is a protected role for system security."
            });
        }
        
        // PROTECTION: Prevent self-deletion
        // Log user deletion to audit trail
        try {
            await createAuditLog('DELETE', 'User', req, res, id, {
                email: user.email,
                fullName: user.fullName,
                deleted_at: user.deleted_at
            });
        } catch (auditErr) {
            console.error('Failed to log user deletion to audit trail:', auditErr);
        }

        if (user._id.toString() === req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "You cannot delete your own account!"
            });
        }
        
        // Soft delete: set deleted_at and anonymize the email so the unique
        // index doesn't block future re-registration with the same address.
        const originalEmail = user.email;
        user.deleted_at = new Date();
        user.deleted_email = originalEmail;           // preserve for audit
        user.email = `deleted_${Date.now()}_${id}@deleted.local`; // free the slot
        await user.save();

        console.log(`User with id ${id} soft deleted by admin at ${user.deleted_at}`);
        return res.status(200).json({
            success: true,
            message: "User deleted successfully (soft delete)",
            deleted_at: user.deleted_at
        });
    } catch (error) {
        console.error('Delete user error:', error);
        return res.status(500).json({
            success: false,
            message: "Error deleting user"
        });
    }
};

// GET /users/my-disease-data
export const getMyDiseaseData = async (req, res) => {
    try {
        const userId = req.user._id;
        // Fetch all user's answers (not deleted)
        const userAnswers = await UsersAnswers.find({ user_id: userId, deleted_at: null })
            .populate({
                path: 'question_id',
                populate: {
                    path: 'symptom_id',
                    populate: {
                        path: 'disease_id',
                        model: 'Disease',
                    },
                    model: 'Symptom',
                },
                model: 'Question',
            })
            .populate('answer_id');

        if (!userAnswers.length) {
            return res.status(200).json({
                success: true,
                data: {}
            });
        }

        // Assume all answers are for the same disease (if not, pick the first)
        const firstSymptom = userAnswers[0]?.question_id?.symptom_id;
        const disease = firstSymptom?.disease_id;
        const diseaseName = disease?.name || 'Unknown Disease';
        const lastUpdated = userAnswers.reduce((latest, ua) => {
            const date = ua.createdAt || ua.updatedAt;
            return (!latest || (date && date > latest)) ? date : latest;
        }, null);

        // Group answers by symptom
        const symptomMap = {};
        userAnswers.forEach(ua => {
            const symptom = ua.question_id?.symptom_id;
            if (!symptom) return;
            const symptomName = symptom.name || 'Unknown Symptom';
            if (!symptomMap[symptomName]) {
                symptomMap[symptomName] = [];
            }
            symptomMap[symptomName].push({
                question_id: ua.question_id?._id,
                question: ua.question_id?.question_text || 'Unknown Question',
                answer: ua.answer_id?.answer_text || 'N/A',
                date: ua.createdAt,
            });
        });

        // Format for frontend
        const symptoms = Object.entries(symptomMap).map(([name, questions]) => ({
            name,
            questions,
        }));

        // Find all questions for this disease
        let totalQuestions = 0;
        if (disease && disease._id) {
          const allSymptoms = await Symptom.find({ disease_id: disease._id, deleted_at: null });
          const symptomIds = allSymptoms.map(s => s._id);
          totalQuestions = await Question.countDocuments({ symptom_id: { $in: symptomIds }, deleted_at: null });
        }
        // Count answered questions (unique question_ids in userAnswers)
        const answeredQuestions = new Set(userAnswers.map(ua => String(ua.question_id?._id))).size;

        return res.status(200).json({
            success: true,
            data: {
                disease: diseaseName,
                lastUpdated,
                symptoms,
                totalQuestions,
                answeredQuestions,
            }
        });
    } catch (error) {
        console.error('Error in getMyDiseaseData:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch disease data.'
        });
    }
};

// Get user's disease data for editing
export const getUserDiseaseDataForEditing = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    if (!user.onboardingCompleted) {
      return res.status(400).json({
        success: false,
        message: 'You must complete your details first before editing.'
      });
    }

    // Check if editing window is still open
    const now = new Date();
    if (user.diseaseDataEditingExpiresAt && now > user.diseaseDataEditingExpiresAt) {
      // Auto-submit if editing window has expired
      if (user.diseaseDataStatus === 'draft') {
        user.diseaseDataStatus = 'submitted';
        await user.save();
      }
      return res.status(400).json({
        success: false,
        message: 'Editing window has expired. Your disease data has been submitted and can no longer be edited.'
      });
    }

    // Get user's answers with full details
    const userAnswers = await UsersAnswers.find({ user_id: userId, deleted_at: null })
      .populate({
        path: 'question_id',
        populate: {
          path: 'symptom_id',
          populate: {
            path: 'disease_id',
            model: 'Disease'
          },
          model: 'Symptom'
        },
        model: 'Question'
      })
      .populate('answer_id');

    // Group by disease, then by symptom
    const diseaseMap = {};
    userAnswers.forEach(ua => {
      const disease = ua.question_id?.symptom_id?.disease_id;
      const symptom = ua.question_id?.symptom_id;
      
      if (!disease || !symptom) return;
      
      if (!diseaseMap[disease._id]) {
        diseaseMap[disease._id] = {
          _id: disease._id,
          name: disease.name,
          description: disease.description,
          symptoms: {}
        };
      }
      
      if (!diseaseMap[disease._id].symptoms[symptom._id]) {
        diseaseMap[disease._id].symptoms[symptom._id] = {
          _id: symptom._id,
          name: symptom.name,
          description: symptom.description,
          questions: []
        };
      }
      
      diseaseMap[disease._id].symptoms[symptom._id].questions.push({
        _id: ua.question_id._id,
        question_text: ua.question_id.question_text,
        question_type: ua.question_id.question_type,
        options: ua.question_id.options || [],
        current_answer: ua.answer_id.answer_text,
        answer_id: ua.answer_id._id,
        user_answer_id: ua._id
      });
    });

    const diseases = Object.values(diseaseMap);
    
    return res.status(200).json({
      success: true,
      data: {
        diseases,
        editingWindow: {
          expiresAt: user.diseaseDataEditingExpiresAt,
          status: user.diseaseDataStatus,
          canEdit: user.diseaseDataStatus === 'draft' && (!user.diseaseDataEditingExpiresAt || now <= user.diseaseDataEditingExpiresAt)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user disease data for editing:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching disease data for editing'
    });
  }
};

// Update user's disease data answer
export const updateUserDiseaseDataAnswer = async (req, res) => {
  try {
    const userId = req.user._id;
    const { questionId, answerText } = req.body;
    
    if (!questionId || !answerText) {
      return res.status(400).json({
        success: false,
        message: 'Missing questionId or answerText'
      });
    }

    const user = await User.findById(userId);
    
    if (!user.onboardingCompleted) {
      return res.status(400).json({
        success: false,
        message: 'You must complete your details first before editing.'
      });
    }

    // Check if editing window is still open
    const now = new Date();
    if (user.diseaseDataEditingExpiresAt && now > user.diseaseDataEditingExpiresAt) {
      // Auto-submit if editing window has expired
      if (user.diseaseDataStatus === 'draft') {
        user.diseaseDataStatus = 'submitted';
        await user.save();
      }
      return res.status(400).json({
        success: false,
        message: 'Editing window has expired. Your disease data has been submitted and can no longer be edited.'
      });
    }

    if (user.diseaseDataStatus !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Disease data has already been submitted and cannot be edited.'
      });
    }

    // Find or create the answer
    let answer = await Answer.findOne({ answer_text: answerText, deleted_at: null });
    if (!answer) {
      answer = await Answer.create({ answer_text: answerText });
    }

    // Ensure Questions_Answers entry exists
    let qa = await QuestionsAnswers.findOne({ question_id: questionId, answer_id: answer._id, deleted_at: null });
    if (!qa) {
      qa = await QuestionsAnswers.create({ question_id: questionId, answer_id: answer._id });
    }

    // Update the user's answer
    const updatedUserAnswer = await UsersAnswers.findOneAndUpdate(
      { user_id: userId, question_id: questionId, deleted_at: null },
      { answer_id: answer._id },
      { new: true }
    );

    if (!updatedUserAnswer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found for this question'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Answer updated successfully',
      data: {
        answerId: answer._id,
        answerText: answer.answer_text
      }
    });
  } catch (error) {
    console.error('Error updating user disease data answer:', error);
    console.error('Error details:', {
      userId: req.user._id,
      questionId: req.body.questionId,
      answerText: req.body.answerText,
      errorMessage: error.message,
      errorStack: error.stack
    });
    return res.status(500).json({
      success: false,
      message: 'Error updating answer'
    });
  }
};

// Submit disease data (mark as submitted)
export const submitDiseaseData = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    if (!user.onboardingCompleted) {
      return res.status(400).json({
        success: false,
        message: 'You must complete your details first before submitting.'
      });
    }

    if (user.diseaseDataStatus === 'submitted') {
      return res.status(400).json({
        success: false,
        message: 'Disease data has already been submitted.'
      });
    }

    // Check if editing window is still open
    const now = new Date();
    if (user.diseaseDataEditingExpiresAt && now > user.diseaseDataEditingExpiresAt) {
      return res.status(400).json({
        success: false,
        message: 'Editing window has expired. Your disease data has been automatically submitted.'
      });
    }

    // Mark as submitted
    user.diseaseDataStatus = 'submitted';
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Disease data submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting disease data:', error);
    return res.status(500).json({
      success: false,
      message: 'Error submitting disease data'
    });
  }
};

// Get all admins (users with admin or super_admin role)
export const getAllAdmins = async (req, res) => {
    try {
        // Get *all* matching role IDs (handles duplicate role docs)
        const roles = await Role.find({
            role_name: { $in: ['admin', 'super_admin'] },
            deleted_at: null,
        }).select('_id role_name');

        if (!roles || roles.length === 0) {
            return res.status(500).json({
                success: false,
                message: 'Admin roles not found'
            });
        }

        const roleIds = roles.map(r => r._id);

        // Find users with admin or super_admin roles
        const adminUsers = await UsersRoles.find({
            role_id: { $in: roleIds },
            deleted_at: null,
        }).populate('user_id').populate('role_id');

        // Format the response
        const admins = adminUsers
            .filter(ur => ur?.user_id && ur?.role_id)
            .filter(ur => ur.user_id.deleted_at == null)
            .filter(ur => ['admin', 'super_admin'].includes(normalizeRoleName(ur.role_id.role_name)))
            .map(ur => {
                const user = ur.user_id;
                const role = ur.role_id;
                const { password, refreshToken, activationToken, resetPasswordToken, ...safeUser } = user.toObject();
                return {
                    ...safeUser,
                    roles: [normalizeRoleName(role.role_name)].filter(Boolean)
                };
            })
            .sort((a, b) => (a.email || '').localeCompare(b.email || ''));

        return res.status(200).json({
            success: true,
            data: admins
        });
    } catch (error) {
        console.error('Get all admins error:', error);
        console.error('Error details:', error.stack);
        return res.status(500).json({
            success: false,
            message: 'Error fetching admins',
            error: error.message
        });
    }
};

// Get user roles
export const getUserRoles = async (req, res) => {
    try {
        const user = req.user;
        const userRoles = await UsersRoles.find({ user_id: user._id }).populate('role_id');
        const roles = userRoles
            .map(ur => normalizeRoleName(ur.role_id?.role_name))
            .filter(Boolean);
        
        return res.status(200).json({
            success: true,
            data: roles
        });
    } catch (error) {
        console.error('Get user roles error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching user roles'
        });
    }
};

// Update user role
export const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!role) {
            return res.status(400).json({
                success: false,
                message: 'Role is required'
            });
        }

        // Find the target role
        const targetRole = await Role.findOne({ role_name: role });
        if (!targetRole) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role'
            });
        }

        // Get current roles of the user being updated
        const currentUserRoles = await UsersRoles.find({ user_id: id }).populate('role_id');
        const isTargetSuperAdmin = currentUserRoles.some(ur => ur.role_id?.role_name === 'super_admin');
        
        // CRITICAL PROTECTION: Prevent changing a super admin's role to something lower
        if (isTargetSuperAdmin && role !== 'super_admin') {
            // Check if the user is trying to change their own role
            const isSelfUpdate = id === req.user._id.toString();
            
            if (isSelfUpdate) {
                return res.status(403).json({
                    success: false,
                    message: 'You cannot downgrade your own Super Admin role! This would permanently lock you out of the system.'
                });
            } else {
                return res.status(403).json({
                    success: false,
                    message: 'You cannot change another Super Admin\'s role! Super Admins are protected.'
                });
            }
        }

        // Remove existing roles for this user
        await UsersRoles.deleteMany({ user_id: id });

        // Assign new role
        await UsersRoles.create({
            user_id: id,
            role_id: targetRole._id
        });

        // Get user details for audit log
        const user = await User.findById(id);

        // Log role change to audit trail
        try {
            const oldRoles = currentUserRoles.map(ur => ur.role_id?.role_name);
            await createAuditLog('UPDATE', 'UserRole', req, res, id, {
                before: { roles: oldRoles },
                after: { roles: [role] },
                user_email: user?.email,
                action: 'Role Change'
            });
        } catch (auditErr) {
            console.error('Failed to log role change to audit trail:', auditErr);
        }

        return res.status(200).json({
            success: true,
            message: 'User role updated successfully'
        });
    } catch (error) {
        console.error('Update user role error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating user role'
        });
    }
};



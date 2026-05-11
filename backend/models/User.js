import mongoose from 'mongoose';
import { 
    encryptUserData, 
    decryptUserData, 
    decryptUserArrayData 
} from '../middlewares/encryption/userEncryption.js';

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    deleted_email: {
        type: String,
        default: null,
    },
    password: {
        type: String,
        required: true,
    },
    authProvider: {
        type: String,
        enum: ['local', 'google'],
        default: 'local',
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true,
    },
    avatar: {
        type: String,
    },
    phone_number: {
        type: String,
    },
    country: {
        type: String,
        required: false,
        trim: true,
    },
    country_code: {
        type: String,
        trim: true,
    },
    whatsapp_number: {
        type: String,
    },
    date_of_birth: {
        type: Date,
        required: false,  // Required by assessment flow; may be missing for social sign-in until completed
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'male', 'female'],
        required: false,  // Required by assessment flow; may be missing for social sign-in until completed
    },
    isActivated: {
        type: Boolean,
        default: false,
    },
    diabetes_diagnosed: {
        type: String,
        enum: ['yes', 'no', null],
        default: null, // null means not yet answered
    },
    diabetes_diagnosed_answered_at: {
        type: Date,
    },
    activationToken: {
        type: String,
    },
    activationTokenExpires: {
        type: Date,
    },
    refreshToken: {
        type: String,
    },
    resetPasswordToken: {
        type: String,
    },
    resetPasswordExpires: {
        type: Date,
    },
    deleted_at: {
        type: Date,
        default: null,
    },
    onboardingCompleted: {
        type: Boolean,
        default: false,
    },
    onboardingCompletedAt: {
        type: Date,
    },
    // New fields for disease data editing window
    diseaseDataSubmittedAt: {
        type: Date,
    },
    diseaseDataEditingExpiresAt: {
        type: Date,
    },
    diseaseDataStatus: {
        type: String,
        enum: ['draft', 'submitted'],
        default: 'draft',
    },
    // Latest diabetes risk assessment summary
    last_assessment_risk_level: {
        type: String,
    },
    last_assessment_probability: {
        type: Number,
    },
    last_assessment_at: {
        type: Date,
    },
    last_assessment_popup_handled_at: {
        type: Date,
    },
}, { timestamps: true });

// Add index for onboarding completion check
userSchema.index({ _id: 1, onboardingCompleted: 1 });

// Apply encryption middleware
userSchema.pre('save', encryptUserData);
userSchema.post('save', decryptUserData);
userSchema.post('findOne', decryptUserData);
userSchema.post('findById', decryptUserData);
userSchema.post('find', decryptUserArrayData);
userSchema.post('findOneAndUpdate', decryptUserData);

export const User = mongoose.model('User', userSchema);
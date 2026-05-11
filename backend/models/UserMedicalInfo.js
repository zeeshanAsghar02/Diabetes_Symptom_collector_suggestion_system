import mongoose from 'mongoose';
import { 
    encryptMedicalData, 
    decryptMedicalData, 
    decryptMedicalArrayData 
} from '../middlewares/encryption/userMedicalInfoEncryption.js';

const userMedicalInfoSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    diabetes_type: {
        type: mongoose.Schema.Types.Mixed, // Encrypted
    },
    diagnosis_date: {
        type: mongoose.Schema.Types.Mixed, // Can be encrypted string or Date
    },
    current_medications: [{
        medication_name: {
            type: mongoose.Schema.Types.Mixed, // Encrypted
        },
        dosage: {
            type: mongoose.Schema.Types.Mixed, // Encrypted
        },
        frequency: {
            type: mongoose.Schema.Types.Mixed, // Encrypted
        },
    }],
    allergies: [{
        allergen: {
            type: mongoose.Schema.Types.Mixed, // Encrypted
        },
        reaction: {
            type: mongoose.Schema.Types.Mixed, // Encrypted
        },
    }],
    chronic_conditions: [{
        condition_name: {
            type: mongoose.Schema.Types.Mixed, // Encrypted
        },
        diagnosed_date: {
            type: mongoose.Schema.Types.Mixed, // Encrypted
        },
    }],
    family_history: [{
        relation: {
            type: mongoose.Schema.Types.Mixed, // Encrypted
        },
        condition: {
            type: mongoose.Schema.Types.Mixed, // Encrypted
        },
    }],
    recent_lab_results: {
        hba1c: {
            value: {
                type: mongoose.Schema.Types.Mixed, // Encrypted
            },
            date: {
                type: mongoose.Schema.Types.Mixed, // Encrypted
            },
            unit: {
                type: mongoose.Schema.Types.Mixed, // Encrypted
                default: '%',
            },
        },
        fasting_glucose: {
            value: {
                type: mongoose.Schema.Types.Mixed, // Encrypted
            },
            date: {
                type: mongoose.Schema.Types.Mixed, // Encrypted
            },
            unit: {
                type: mongoose.Schema.Types.Mixed, // Encrypted
                default: 'mg/dL',
            },
        },
        cholesterol: {
            total: {
                type: mongoose.Schema.Types.Mixed, // Encrypted
            },
            ldl: {
                type: mongoose.Schema.Types.Mixed, // Encrypted
            },
            hdl: {
                type: mongoose.Schema.Types.Mixed, // Encrypted
            },
            date: {
                type: mongoose.Schema.Types.Mixed, // Encrypted
            },
            unit: {
                type: mongoose.Schema.Types.Mixed, // Encrypted
                default: 'mg/dL',
            },
        },
    },
    blood_pressure: {
        systolic: {
            type: mongoose.Schema.Types.Mixed, // Encrypted
        },
        diastolic: {
            type: mongoose.Schema.Types.Mixed, // Encrypted
        },
        last_recorded: {
            type: mongoose.Schema.Types.Mixed, // Encrypted
        },
    },
    last_medical_checkup: {
        type: mongoose.Schema.Types.Mixed, // Encrypted
    },
}, { timestamps: true });

// Apply encryption middleware
userMedicalInfoSchema.pre('save', encryptMedicalData);
userMedicalInfoSchema.post('save', decryptMedicalData);
userMedicalInfoSchema.post('findOne', decryptMedicalData);
userMedicalInfoSchema.post('find', decryptMedicalArrayData);
userMedicalInfoSchema.post('findOneAndUpdate', decryptMedicalData);

export const UserMedicalInfo = mongoose.model('UserMedicalInfo', userMedicalInfoSchema);

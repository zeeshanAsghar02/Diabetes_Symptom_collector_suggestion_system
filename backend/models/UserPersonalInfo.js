import mongoose from 'mongoose';
import { 
    encryptPersonalData, 
    decryptPersonalData, 
    decryptPersonalArrayData 
} from '../middlewares/encryption/userPersonalInfoEncryption.js';

const userPersonalInfoSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    date_of_birth: {
        type: mongoose.Schema.Types.Mixed, // Can be encrypted string or Date
    },
    gender: {
        type: mongoose.Schema.Types.Mixed, // Encrypted: can be string or encrypted value
    },
    height: {
        type: mongoose.Schema.Types.Mixed, // Can be encrypted string or number
    },
    weight: {
        type: mongoose.Schema.Types.Mixed, // Can be encrypted string or number
    },
    activity_level: {
        type: mongoose.Schema.Types.Mixed, // Encrypted: can be string or encrypted value
    },
    dietary_preference: {
        type: mongoose.Schema.Types.Mixed, // Encrypted: can be string or encrypted value
    },
    smoking_status: {
        type: mongoose.Schema.Types.Mixed, // Encrypted: can be string or encrypted value
    },
    alcohol_use: {
        type: mongoose.Schema.Types.Mixed, // Encrypted: can be string or encrypted value
    },
    sleep_hours: {
        type: mongoose.Schema.Types.Mixed, // Encrypted: average hours per night
    },
    emergency_contact: {
        name: {
            type: mongoose.Schema.Types.Mixed, // Encrypted
        },
        phone: {
            type: mongoose.Schema.Types.Mixed, // Encrypted
        },
        relationship: {
            type: mongoose.Schema.Types.Mixed, // Encrypted
        },
    },
    address: {
        street: {
            type: mongoose.Schema.Types.Mixed, // Encrypted
        },
        city: {
            type: mongoose.Schema.Types.Mixed, // Encrypted
        },
        state: {
            type: mongoose.Schema.Types.Mixed, // Encrypted
        },
        zip_code: {
            type: mongoose.Schema.Types.Mixed, // Encrypted
        },
        country: {
            type: mongoose.Schema.Types.Mixed, // Encrypted
        },
    },
}, { timestamps: true });

// Apply encryption middleware
userPersonalInfoSchema.pre('save', encryptPersonalData);
userPersonalInfoSchema.post('save', decryptPersonalData);
userPersonalInfoSchema.post('findOne', decryptPersonalData);
userPersonalInfoSchema.post('find', decryptPersonalArrayData);
userPersonalInfoSchema.post('findOneAndUpdate', decryptPersonalData);

export const UserPersonalInfo = mongoose.model('UserPersonalInfo', userPersonalInfoSchema);

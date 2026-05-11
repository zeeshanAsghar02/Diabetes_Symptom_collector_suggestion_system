import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
    // General Settings
    site_title: {
        type: String,
        default: 'DiabetesCare',
        trim: true,
    },
    site_description: {
        type: String,
        default: 'Comprehensive diabetes management and symptom tracking system',
    },
    contact_email: {
        type: String,
        default: 'support@diabetescare.com',
        trim: true,
        lowercase: true,
    },
    contact_phone: {
        type: String,
        default: '+92 323 300 4420',
        trim: true,
    },
    admin_email: {
        type: String,
        default: 'admin@diabetescare.com',
        trim: true,
        lowercase: true,
    },
    date_format: {
        type: String,
        default: 'DD MMMM, YYYY',
        trim: true,
    },
    // Meta fields
    updated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true,
});

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function() {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

// Update settings
settingsSchema.statics.updateSettings = async function(updates, updatedBy = null) {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    
    Object.assign(settings, updates);
    if (updatedBy) {
        settings.updated_by = updatedBy;
    }
    
    await settings.save();
    return settings;
};

export const Settings = mongoose.model('Settings', settingsSchema);

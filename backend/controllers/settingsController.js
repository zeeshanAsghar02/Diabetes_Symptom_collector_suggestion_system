import { Settings } from '../models/Settings.js';

// Get all settings (returns single document)
export const getAllSettings = async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        
        return res.status(200).json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Get all settings error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching settings'
        });
    }
};

// Get single setting field by key
export const getSettingByKey = async (req, res) => {
    try {
        const { key } = req.params;
        const settings = await Settings.getSettings();
        
        if (!(key in settings.toObject())) {
            return res.status(404).json({
                success: false,
                message: 'Setting field not found'
            });
        }
        
        return res.status(200).json({
            success: true,
            data: {
                key: key,
                value: settings[key]
            }
        });
    } catch (error) {
        console.error('Get setting by key error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching setting'
        });
    }
};

// Update single setting field
export const updateSetting = async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;
        const userId = req.user._id;
        
        const settings = await Settings.getSettings();
        
        if (!(key in settings.toObject())) {
            return res.status(404).json({
                success: false,
                message: 'Setting field not found'
            });
        }
        
        settings[key] = value;
        settings.updated_by = userId;
        await settings.save();
        
        return res.status(200).json({
            success: true,
            message: 'Setting updated successfully',
            data: settings
        });
    } catch (error) {
        console.error('Update setting error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating setting'
        });
    }
};

// Update multiple settings at once
export const bulkUpdateSettings = async (req, res) => {
    try {
        const updates = req.body;
        const userId = req.user._id;
        
        if (!updates || typeof updates !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Settings object is required'
            });
        }
        
        const settings = await Settings.updateSettings(updates, userId);
        
        return res.status(200).json({
            success: true,
            message: 'Settings updated successfully',
            data: settings
        });
    } catch (error) {
        console.error('Bulk update settings error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error updating settings'
        });
    }
};

// Get public settings (NO AUTH) — returns only non-sensitive fields.
export const getPublicSettings = async (req, res) => {
    try {
        const settings = await Settings.getSettings();

        return res.status(200).json({
            success: true,
            data: {
                site_title: settings.site_title,
                site_description: settings.site_description,
                contact_email: settings.contact_email,
                contact_phone: settings.contact_phone,
                date_format: settings.date_format,
            },
        });
    } catch (error) {
        console.error('Get public settings error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching public settings',
        });
    }
};

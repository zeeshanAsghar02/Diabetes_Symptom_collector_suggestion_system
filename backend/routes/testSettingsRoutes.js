import express from 'express';
import { Settings } from '../models/Settings.js';

const router = express.Router();

// Public test endpoint (NO AUTH) - for debugging only
router.get('/test-settings-public', async (req, res) => {
    try {
        const settings = await Settings.find();
        return res.status(200).json({
            success: true,
            message: 'Settings retrieved (public test endpoint)',
            count: settings.length,
            data: settings
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error fetching settings',
            error: error.message
        });
    }
});

export default router;

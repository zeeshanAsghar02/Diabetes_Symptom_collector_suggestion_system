import { schedulePushNotification } from '../services/notificationService.js';

// This would in reality be stored against a user record in the DB
const getPushTokenForUser = async (userId) => {
    // For demo, returning a placeholder.
    // In a real app, you'd query:
    // const user = await User.findById(userId);
    // return user.pushToken;
    return "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]";
}

export const scheduleMedicationReminder = async (req, res) => {
    const { userId, medicationName, time } = req.body; // time should be ISO 8601 string
    
    try {
        const pushToken = await getPushTokenForUser(userId);
        if (!pushToken) {
            return res.status(404).json({ success: false, message: 'Push token not found for user.' });
        }

        const date = new Date(time);

        await schedulePushNotification({
            to: pushToken,
            title: 'Medication Reminder',
            body: `It's time to take your ${medicationName}.`,
            data: { type: 'medication_reminder' },
        }, date);

        res.status(200).json({ success: true, message: 'Medication reminder scheduled.' });
    } catch (error) {
        console.error('Failed to schedule medication reminder:', error);
        res.status(500).json({ success: false, message: 'Error scheduling reminder.' });
    }
};

export const scheduleAppointmentReminder = async (req, res) => {
    const { userId, appointmentDetails, time } = req.body;
    
    try {
        const pushToken = await getPushTokenForUser(userId);
        if (!pushToken) {
            return res.status(404).json({ success: false, message: 'Push token not found for user.' });
        }

        // Schedule for 1 hour before the appointment
        const reminderTime = new Date(new Date(time).getTime() - 60 * 60 * 1000);

        await schedulePushNotification({
            to: pushToken,
            title: 'Appointment Reminder',
            body: `You have an appointment for ${appointmentDetails} in one hour.`,
            data: { type: 'appointment_reminder' },
        }, reminderTime);

        res.status(200).json({ success: true, message: 'Appointment reminder scheduled.' });
    } catch (error) {
        console.error('Failed to schedule appointment reminder:', error);
        res.status(500).json({ success: false, message: 'Error scheduling reminder.' });
    }
};

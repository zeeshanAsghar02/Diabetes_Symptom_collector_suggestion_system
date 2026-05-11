import Expo from 'expo-server-sdk';

const expo = new Expo();

export const sendPushNotification = async (message) => {
    if (!Expo.isExpoPushToken(message.to)) {
        console.error(`Push token ${message.to} is not a valid Expo push token`);
        return;
    }

    try {
        await expo.sendPushNotificationsAsync([message]);
    } catch (error) {
        console.error('Error sending push notification:', error);
    }
};

export const schedulePushNotification = async (message, date) => {
    // Expo does not support server-side scheduling.
    // This is a placeholder for a real implementation that would use a
    // task scheduler (like cron) or a third-party service (like OneSignal, Firebase).
    
    // For demonstration, we'll just send it immediately if the date is in the past.
    if (date.getTime() <= Date.now()) {
        await sendPushNotification(message);
    } else {
        // In a real app, you would store this in a database and have a worker
        // process check for notifications to send.
        console.log(`[DEMO] Notification for ${message.to} scheduled for ${date.toISOString()}`);
        console.log(`[DEMO] Message: ${message.body}`);
    }
};

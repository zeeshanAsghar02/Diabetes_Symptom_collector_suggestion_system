import { User } from '../models/User.js';

// Track recent email sends to prevent duplicates within a short time window
const recentEmailSends = new Map();

export async function canSendOnboardingEmail(userId, email) {
    const key = `${userId}-${email}`;
    const now = Date.now();
    const lastSent = recentEmailSends.get(key);
    
    // Prevent sending multiple emails within 5 minutes
    if (lastSent && (now - lastSent) < 5 * 60 * 1000) {
        console.log('⚠️ Email blocked: Recently sent within 5 minutes');
        return false;
    }
    
    // Check if user exists (but don't check onboardingCompleted since it's already been set to true)
    const user = await User.findById(userId);
    if (!user) {
        console.log('⚠️ Email blocked: User not found');
        return false;
    }
    
    // Mark this email as recently sent
    recentEmailSends.set(key, now);
    
    // Clean up old entries (older than 10 minutes)
    for (const [oldKey, oldTime] of recentEmailSends.entries()) {
        if (now - oldTime > 10 * 60 * 1000) {
            recentEmailSends.delete(oldKey);
        }
    }
    
    console.log('✅ Email allowed: User exists and no recent duplicate');
    return true;
} 
import { User } from '../models/User.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { Role } from '../models/Role.js';
import { 
    generateAccessToken, 
    generateRefreshToken, 
    verifyRefreshToken 
} from '../utils/generateJWT.js';
import { sendActivationEmail, sendResetPasswordEmail } from '../services/emailService.js';
import { createAuditLog } from '../middlewares/auditMiddleware.js';

// Helper: Normalize email (lowercase and trim)
const normalizeEmail = (email) => {
    if (!email || typeof email !== 'string') return email;
    return email.trim().toLowerCase();
};

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const getRefreshCookieOptions = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    const crossSiteCookies = process.env.AUTH_COOKIE_CROSS_SITE === 'true' || isProduction;
    return {
        httpOnly: true,
        secure: crossSiteCookies,
        sameSite: crossSiteCookies ? 'none' : 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    };
};

// Helper: Generate and store tokens
const generateAccessAndRefreshTokens = async (userId, email) => {
    try {
        const accessToken = generateAccessToken(userId, email);
        const refreshToken = generateRefreshToken(userId, email);

        // Store refresh token in database
        await User.findByIdAndUpdate(userId, {
            refreshToken: refreshToken
        });

        return { accessToken, refreshToken };
    } catch (error) {
        console.error('Token generation error:', error && error.message ? error.message : error);
        // Re-throw the original error so callers can see the cause
        throw error;
    }
};

// Registration controller
export const register = async (req, res) => {
    try {
        // Accept both snake_case (date_of_birth) and camelCase (dateOfBirth) from clients
        const { fullName, email, password, gender } = req.body;
        const date_of_birth = req.body.date_of_birth || req.body.dateOfBirth;
        
        // Validation
        if (!fullName || !email || !password || !date_of_birth || !gender) {
            return res.status(400).json({ 
                success: false,
                message: 'All fields are required (name, email, password, date of birth, and gender).' 
            });
        }
        
        // Normalize email (lowercase and trim)
        const normalizedEmail = normalizeEmail(email);
        
        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid email format.' 
            });
        }
        
        // Password strength validation
        if (password.length < 8) {
            return res.status(400).json({ 
                success: false,
                message: 'Password must be at least 8 characters.' 
            });
        }
        
        // Gender validation
        if (!['Male', 'Female', 'male', 'female'].includes(gender)) {
            return res.status(400).json({ 
                success: false,
                message: 'Gender must be either Male or Female.' 
            });
        }
        
        // Check if an ACTIVE user already has this email
        const existingUser = await User.findOne({ email: normalizedEmail, deleted_at: null });
        if (existingUser) {
            return res.status(400).json({ 
                success: false,
                message: 'Email already registered.' 
            });
        }

        // If a soft-deleted document still holds this email (unique index will block insert),
        // anonymize it now so the slot is freed before we create the new account.
        const deletedUser = await User.findOne({ email: normalizedEmail, deleted_at: { $ne: null } });
        if (deletedUser) {
            deletedUser.deleted_email = deletedUser.email;
            deletedUser.email = `deleted_${Date.now()}_${deletedUser._id}@deleted.local`;
            await deletedUser.save();
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user — activated immediately (email verification is optional / future feature)
        const user = new User({
            fullName,
            email: normalizedEmail,
            password: hashedPassword,
            date_of_birth: date_of_birth || null,
            gender: gender || null,
            isActivated: true,
        });
        
        await user.save();
        
        // Audit log — fire-and-forget (it already skips when user context is missing,
        // so awaiting it only adds latency without benefit).
        createAuditLog('CREATE', 'User', req, res, user._id, {
            before: null,
            after: { email: user.email, fullName: user.fullName, role: 'user' }
        }).catch((auditErr) => console.error('Failed to log user creation:', auditErr));

        // Assign 'user' role — must complete before we fetch roles for the token payload.
        try {
            const { assignDefaultUserRole } = await import('../utils/roleUtils.js');
            const roleAssigned = await assignDefaultUserRole(user._id);
            if (roleAssigned) {
                console.log('✅ Successfully assigned user role to new user:', user.email);
            } else {
                console.warn('⚠️ Failed to assign user role to new user:', user.email);
            }
        } catch (roleError) {
            console.error('❌ Error assigning user role:', roleError);
        }

        // Welcome email — fire-and-forget.
        const welcomeToken = crypto.randomBytes(32).toString('hex');
        sendActivationEmail(normalizedEmail, welcomeToken).catch((emailErr) => {
            console.warn('⚠️  Welcome email could not be sent (non-fatal):', emailErr?.message || emailErr);
        });

        // Fetch roles for token payload AND generate tokens in parallel to cut latency.
        const [roles, tokens] = await Promise.all([
            (async () => {
                try {
                    const { UsersRoles } = await import('../models/User_Role.js');
                    const userRoles = await UsersRoles.find({ user_id: user._id }).populate('role_id');
                    return userRoles.map(ur => ur.role_id?.role_name).filter(Boolean);
                } catch (_) { return []; }
            })(),
            generateAccessAndRefreshTokens(user._id, user.email),
        ]);

        const { accessToken, refreshToken } = tokens;

        res.cookie('refreshToken', refreshToken, getRefreshCookieOptions());

        return res.status(201).json({
            success: true,
            message: 'Account created successfully.',
            data: {
                user: {
                    id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    roles,
                    diabetes_diagnosed: user.diabetes_diagnosed,
                    onboardingCompleted: user.onboardingCompleted,
                },
                accessToken,
                refreshToken,
            },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ 
            success: false,
            message: 'Server error.' 
        });
    }
};

// Account activation controller
export const activateAccount = async (req, res) => {
    try {
        const { token } = req.params;
        const user = await User.findOne({ activationToken: token });
        if (!user) {
            // If not found by token, try to find by isActivated=true and token already cleared
            const activatedUser = await User.findOne({ isActivated: true });
            if (activatedUser) {
                return res.status(200).json({ message: 'Your account has already been activated. You can now log in.' });
            }
            return res.status(400).json({ message: 'Invalid or expired activation link.' });
        }
        if (user.isActivated) {
            return res.status(200).json({ message: 'Your account has already been activated. You can now log in.' });
        }
        if (!user.activationTokenExpires || user.activationTokenExpires < new Date()) {
            return res.status(400).json({ message: 'Activation link has expired.' });
        }
        user.isActivated = true;
        user.activationToken = undefined;
        user.activationTokenExpires = undefined;
        await user.save();
        return res.status(200).json({ message: 'Your account has been activated. You can now log in.' });
    } catch (err) {
        return res.status(500).json({ message: 'Server error.' });
    }
};

// Login controller
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                message: 'Email and password are required.' 
            });
        }
        
        // Normalize email (lowercase and trim) before lookup
        const normalizedEmail = normalizeEmail(email);
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid email or password.' 
            });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid email or password.' 
            });
        }
        
        // Fetch user roles
        let roles = [];
        try {
            const { UsersRoles } = await import('../models/User_Role.js');
            const userRoles = await UsersRoles.find({ user_id: user._id }).populate('role_id');
            roles = userRoles.map(ur => ur.role_id.role_name);
        } catch (roleErr) {
            console.error('Error fetching user roles during login:', roleErr);
        }
        
        // Generate access and refresh tokens
        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id, user.email);
        
        // Set refresh token as HTTP-only cookie
        res.cookie('refreshToken', refreshToken, getRefreshCookieOptions());
        
        // Log successful login to audit trail
        try {
            await createAuditLog('LOGIN', 'Auth', req, res, user._id, {
                email: user.email,
                roles: roles,
                timestamp: new Date()
            });
        } catch (auditErr) {
            console.error('Failed to log login to audit trail:', auditErr);
        }
        
        return res.status(200).json({
            success: true,
            message: 'Login successful.',
            data: {
                user: {
                    id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    avatar: user.avatar || null,
                    phone_number: user.phone_number,
                    country: user.country,
                    country_code: user.country_code,
                    roles: roles,
                    authProvider: user.authProvider || 'local',
                    profileCompletionRequired: !user.date_of_birth || !user.gender,
                    diabetes_diagnosed: user.diabetes_diagnosed,
                    onboardingCompleted: user.onboardingCompleted,
                    last_assessment_risk_level: user.last_assessment_risk_level,
                    last_assessment_probability: user.last_assessment_probability,
                    last_assessment_at: user.last_assessment_at,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                },
                accessToken,
                refreshToken
            }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ 
            success: false,
            message: 'Server error.' 
        });
    }
};

// Refresh access token controller
export const refreshAccessToken = async (req, res) => {
    try {
        // Get refresh token from cookies or body
        const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
        
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: "Refresh token is required",
                code: "REFRESH_TOKEN_MISSING"
            });
        }

        // Verify refresh token
        const decoded = verifyRefreshToken(refreshToken);
        
        // Find user by ID
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found",
                code: "USER_NOT_FOUND"
            });
        }

        // Compare refresh token with stored token in database
        if (user.refreshToken !== refreshToken) {
            return res.status(401).json({
                success: false,
                message: "Invalid refresh token",
                code: "INVALID_REFRESH_TOKEN"
            });
        }

        // Generate new access and refresh tokens
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user._id, user.email);

        // Set new refresh token as HTTP-only cookie
        res.cookie('refreshToken', newRefreshToken, getRefreshCookieOptions());

        return res.status(200).json({
            success: true,
            message: "Access token refreshed successfully",
            data: {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            }
        });

    } catch (error) {
        console.error('Refresh token error:', error);
        return res.status(401).json({
            success: false,
            message: "Invalid or expired refresh token",
            code: "REFRESH_TOKEN_EXPIRED"
        });
    }
};

// Logout controller
export const logout = async (req, res) => {
    try {
        // Get user ID from request (if authenticated)
        const userId = req.user?._id;
        const userEmail = req.user?.email;
        
        if (userId) {
            // Clear refresh token from database
            await User.findByIdAndUpdate(userId, {
                refreshToken: null
            });
            
            // Log logout to audit trail
            try {
                await createAuditLog('LOGOUT', 'Auth', req, res, userId, {
                    email: userEmail,
                    timestamp: new Date()
                });
            } catch (auditErr) {
                console.error('Failed to log logout to audit trail:', auditErr);
            }
        }

        // Clear cookies
        res.clearCookie('refreshToken');
        res.clearCookie('accessToken');
        
        return res.status(200).json({
            success: true,
            message: 'User logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error during logout'
        });
    }
};

// Get current user controller
export const getCurrentUser = async (req, res) => {
    try {
        const user = req.user;
        
        console.log('User ID:', user._id);
        console.log('Date of birth from User:', user.date_of_birth);
        console.log('Gender from User:', user.gender);
        
        return res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    avatar: user.avatar || null,
                    phone_number: user.phone_number,
                    country: user.country,
                    country_code: user.country_code,
                    isActivated: user.isActivated,
                    diabetes_diagnosed: user.diabetes_diagnosed,
                    onboardingCompleted: user.onboardingCompleted,
                    last_assessment_risk_level: user.last_assessment_risk_level,
                    last_assessment_probability: user.last_assessment_probability,
                    last_assessment_at: user.last_assessment_at,
                    date_of_birth: user.date_of_birth || null,
                    gender: user.gender || null,
                    avatar: user.avatar || null,
                    authProvider: user.authProvider || 'local',
                    profileCompletionRequired: !user.date_of_birth || !user.gender,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
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

// Forgot password controller
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        // Normalize email (lowercase and trim)
        const normalizedEmail = normalizeEmail(email);
        
        // Validate email format (fixed regex typo: removed double backslash)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
            return res.status(400).json({ message: 'Please enter a valid email address.' });
        }
        
        const user = await User.findOne({ email: normalizedEmail });
        if (user) {
            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
            user.resetPasswordToken = resetToken;
            user.resetPasswordExpires = resetTokenExpires;
            await user.save();
            // Send reset email (use normalized email)
            await sendResetPasswordEmail(normalizedEmail, resetToken);
        }
        // Always respond with a generic message
        return res.status(200).json({ message: 'If this email is registered, a password reset link has been sent.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error.' });
    }
};

// Reset password controller
export const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;
        if (!password || password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters.' });
        }
        const user = await User.findOne({ resetPasswordToken: token });
        if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired reset link.' });
        }
        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        // Invalidate all previous sessions (by changing password hash)
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        return res.status(200).json({ message: 'Your password has been reset. You can now log in.' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error.' });
    }
}; 

// Change password controller
export const changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const isMatch = await user.matchPassword(oldPassword);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid old password' });
        }

        user.password = newPassword;
        await user.save();

        // Log password change to audit trail
        try {
            await createAuditLog('UPDATE', 'Auth', req, res, userId, {
                action: 'Password Changed',
                email: user.email,
                timestamp: new Date()
            });
        } catch (auditErr) {
            console.error('Failed to log password change to audit trail:', auditErr);
        }

        return res.status(200).json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
}; 

// Resend activation link controller
export const resendActivationLink = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required.' });
        }
        
        // Normalize email (lowercase and trim) before lookup
        const normalizedEmail = normalizeEmail(email);
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        if (user.isActivated) {
            return res.status(400).json({ message: 'Account is already activated.' });
        }
        // Generate new activation token
        const activationToken = crypto.randomBytes(32).toString('hex');
        const activationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        user.activationToken = activationToken;
        user.activationTokenExpires = activationTokenExpires;
        await user.save();
        // Send activation email (use normalized email)
        await sendActivationEmail(normalizedEmail, activationToken);
        return res.status(200).json({ message: 'Activation link resent. Please check your email.' });
    } catch (error) {
        console.error('Resend activation link error:', error);
        return res.status(500).json({ message: 'Error resending activation link.' });
    }
};

// Google OAuth (ID token) controller
export const googleLogin = async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!process.env.GOOGLE_CLIENT_ID) {
            return res.status(500).json({
                success: false,
                message: 'Google OAuth is not configured on server.',
            });
        }

        if (!idToken || typeof idToken !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Google idToken is required.',
            });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        const googleSub = payload?.sub;
        const email = normalizeEmail(payload?.email);
        const fullName = payload?.name || 'Google User';
        const avatar = payload?.picture || null;
        const emailVerified = payload?.email_verified === true;

        if (!googleSub || !email) {
            return res.status(401).json({
                success: false,
                message: 'Invalid Google token payload.',
            });
        }

        if (!emailVerified) {
            return res.status(401).json({
                success: false,
                message: 'Google email is not verified.',
            });
        }

        let user = await User.findOne({ googleId: googleSub });

        // Edge case: existing local account with same email should be linked
        if (!user) {
            user = await User.findOne({ email });
            if (user) {
                user.googleId = googleSub;
                user.authProvider = 'google';
                if (avatar) user.avatar = avatar;
                if (!user.isActivated) user.isActivated = true;
                await user.save();
            }
        }

        // First time Google login
        if (!user) {
            const randomPassword = crypto.randomBytes(32).toString('hex');
            const hashedPassword = await bcrypt.hash(randomPassword, 10);
            user = new User({
                fullName,
                email,
                password: hashedPassword,
                isActivated: true,
                authProvider: 'google',
                googleId: googleSub,
                avatar,
            });
            await user.save();

            try {
                const { assignDefaultUserRole } = await import('../utils/roleUtils.js');
                await assignDefaultUserRole(user._id);
            } catch (roleError) {
                console.error('Error assigning default role for Google user:', roleError);
            }
        }

        // Keep profile current from Google while preserving custom profile edits
        let needsSave = false;
        if (!user.fullName && fullName) {
            user.fullName = fullName;
            needsSave = true;
        }
        if (avatar && user.avatar !== avatar) {
            user.avatar = avatar;
            needsSave = true;
        }
        if (needsSave) {
            await user.save();
        }

        let roles = [];
        try {
            const { UsersRoles } = await import('../models/User_Role.js');
            const userRoles = await UsersRoles.find({ user_id: user._id }).populate('role_id');
            roles = userRoles.map(ur => ur.role_id?.role_name).filter(Boolean);
        } catch (roleErr) {
            console.error('Error fetching user roles during Google login:', roleErr);
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id, user.email);
        res.cookie('refreshToken', refreshToken, getRefreshCookieOptions());

        return res.status(200).json({
            success: true,
            message: 'Google login successful.',
            data: {
                user: {
                    id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    avatar: user.avatar || null,
                    phone_number: user.phone_number,
                    country: user.country,
                    country_code: user.country_code,
                    roles,
                    authProvider: user.authProvider || 'local',
                    profileCompletionRequired: !user.date_of_birth || !user.gender,
                    diabetes_diagnosed: user.diabetes_diagnosed,
                    onboardingCompleted: user.onboardingCompleted,
                    last_assessment_risk_level: user.last_assessment_risk_level,
                    last_assessment_probability: user.last_assessment_probability,
                    last_assessment_at: user.last_assessment_at,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                },
                accessToken,
                refreshToken,
            },
        });
    } catch (err) {
        console.error('Google login error:', err);
        return res.status(401).json({
            success: false,
            message: 'Google authentication failed.',
        });
    }
};
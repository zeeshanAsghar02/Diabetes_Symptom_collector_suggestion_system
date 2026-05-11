import { verifyAccessToken } from '../utils/generateJWT.js';
import { User } from '../models/User.js';
import { UsersRoles } from '../models/User_Role.js';

export const verifyAccessTokenMiddleware = async (req, res, next) => {
    try {
        // Get token from header or cookies
        const token = req.cookies?.accessToken || 
                     req.header('Authorization')?.replace("Bearer ", "") ||
                     req.headers['x-access-token'];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access token is required",
                code: "ACCESS_TOKEN_MISSING"
            });
        }

        // Verify access token
        const decoded = verifyAccessToken(token);
        
        // Get user from database
        const user = await User.findById(decoded.userId).select("-password");
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found",
                code: "USER_NOT_FOUND"
            });
        }

        // Get user roles for audit logging
        const userRoles = await UsersRoles.find({ user_id: user._id }).populate('role_id');
        user.roles = userRoles.map(ur => ur.role_id?.name || 'user');

        // Check if user is activated
        // if (!user.isActivated) {
        //     return res.status(403).json({
        //         success: false,
        //         message: "Account not activated",
        //         code: "ACCOUNT_NOT_ACTIVATED"
        //     });
        // }

        // Attach user to request object
        req.user = user;
        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Access token expired or invalid",
            code: "ACCESS_TOKEN_EXPIRED"
        });
    }
}; 
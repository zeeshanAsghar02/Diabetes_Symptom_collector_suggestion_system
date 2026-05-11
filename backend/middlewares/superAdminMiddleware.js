import { UsersRoles } from '../models/User_Role.js';

export const superAdminMiddleware = async (req, res, next) => {
    try {
        console.log("SuperAdminCheck: Middleware called");
        // Check incoming user data
        const user = req.user;
        console.log("SuperAdminCheck: Incoming user", { id: user?._id, email: user?.email });

        // Fetch user roles
        const userRoles = await UsersRoles.find({ user_id: user._id }).populate('role_id');
        const roles = userRoles.map(ur => ur.role_id.role_name);
        console.log("SuperAdminCheck: User roles are", roles);

        // Check if user has super_admin role
        if (roles.includes("super_admin")) {
            console.log("SuperAdminCheck: Access granted to super_admin route for", user?.email);
            return next();
        } else {
            console.log("SuperAdminCheck: Access denied for", user?.email, "- not a super_admin");
            return res.status(403).json({
                success: false,
                message: "You are not authorized to access this resource. Super admin access required.",
                code: "SUPER_ADMIN_REQUIRED"
            });
        }
    } catch (error) {
        console.error("SuperAdminCheck: Internal server error", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            code: "INTERNAL_SERVER_ERROR"
        });
    }
};

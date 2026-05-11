import { UsersRoles } from '../models/User_Role.js';

export const roleCheckMiddleware = async (req, res, next) => {
    try {
        console.log("RoleCheck: Middleware called : jaty hwy mil k jna");
        // Check incoming user data
        const user = req.user;
        console.log("RoleCheck: Incoming user", { id: user?._id, email: user?.email , role: user?.role });

        // Fetch user roles
        const userRoles = await UsersRoles.find({ user_id: user._id }).populate('role_id');
        const roles = userRoles.map(ur => ur.role_id.role_name);
        console.log("RoleCheck: User roles are", roles);

        // Check if user has admin or super_admin role
        if (roles.includes("admin") || roles.includes("super_admin")) {
            console.log("RoleCheck: Access granted to admin/super_admin route for", user?.email);
            return next();
        } else {
            console.log("RoleCheck: Access denied for", user?.email, "- not an admin or super_admin");
            return res.status(403).json({
                success: false,
                message: "You are not authorized to access this resource",
                code: "UNAUTHORIZED"
            });
        }
    } catch (error) {
        console.error("RoleCheck: Internal server error", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            code: "INTERNAL_SERVER_ERROR"
        });
    }
};   
const { tenantManager } = require("../utils/firebase_admin");
const { tenantAuth } = require("../api/org/functions");
const jwt = require("jsonwebtoken");

module.exports.isAuthenticated = (allowed_roles) => async (req, res, next) => {
    try {
        const token = req.headers.authorization || req.cookies.idToken;

        if(!token) {
            throw new Error("Unauthorized");
        }

        // Decode the token
        const decoded = jwt.decode(token);
        if(!decoded) {
            throw new Error("Unauthorized");
        }
        
        // Get the tenant id
        const tenantId = decoded?.firebase?.tenant;
        if(!tenantId) {
            throw new Error("Unauthorized");
        }

        const tenant = await tenantAuth({tenant_id: tenantId});

        // Verify the token
        const user_data = await tenant.verifyIdToken(token);

        if(allowed_roles && !user_data.role.some(role => allowed_roles.includes(role))) {
            throw new Error("Unauthorized");
        }

        req.user = user_data;
        next();
    } catch (error) {
        next(error);
    }
}
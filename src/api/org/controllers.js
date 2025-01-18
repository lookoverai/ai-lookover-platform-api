const { auth, tenantManager } = require("../../utils/firebase_admin");
const prisma = require("../../utils/prisma_client");
const logger = require("../../utils/logger");
const { tenantAuth } = require("./functions");
module.exports.createOrg = async (req,res,next) => {
    try {
        const { name, description, user_name, user_email_id  } = req.body;

        if(!name || !description || !user_name || !user_email_id) {
            throw new Error("Organization name, description, user name and user email id are required");
        }

        const tenant = await tenantManager.createTenant({
            displayName: name
        })

        const organization = await prisma.organization.create({
            data:{
                id: Math.floor(100000000000 + Math.random() * 900000000000),
                name: name,
                description: description,
                tenant_id: tenant.tenantId
            }
        })

        logger.info(`Organization created successfully: ${organization.id}`);


        const user = await tenantManager.authForTenant(tenant.tenantId).createUser({
            email: user_email_id,
            displayName: user_name,  
        })

        await tenantManager.authForTenant(tenant.tenantId).setCustomUserClaims(user.uid, {
            role: ["admin"],
            org_id: organization.id
        })

        const user_on_prisma = await prisma.user.create({
            data: {
                id: user.uid,
                email_id: user_email_id,
                name: user_name,
                org_id: organization.id,
                role: "admin"
            }
        })

        res.status(200).json({
            message: "Organization created successfully",
            ...organization,
            user: user_on_prisma
        });

        
    } catch (error) {
        next(error);
    }
}

module.exports.getOrg = async (req,res,next) => {
    try {
        const { org_id } = req.params;

        if(!org_id) {
            throw new Error("Organization ID is required");
        }

        const organization = await prisma.organization.findUnique({
            where: {
                id: org_id
            }
        })

        res.status(200).json({
            message: "Organization fetched successfully",
            ...organization
        });

    } catch (error) {
        next(error);
    }
}

module.exports.addUser = async(req,res,next) => {
    try {
        const { user_email_id, user_name, role  } = req.body;

        if(!user_email_id || !user_name || !role) {
            throw new Error("User email id, user name and role are required");
        }

        const tenant = await tenantAuth({tenant_id: req.user.firebase.tenant});
        const user = await tenant.createUser({
            email: user_email_id,
            displayName: user_name,
        })

        await tenant.setCustomUserClaims(user.uid, {
            role: role,
            org_id: req.user.org_id
        })

        await prisma.user.create({
            data: {
                id: user.uid,
                email_id: user_email_id,
                name: user_name,
                org_id: req.user.org_id,
                role: role.join(',')
            }
        })

        res.status(200).json({
            message: "User added successfully"
        });
        
    } catch (error) {
        next(error);
    }
}

module.exports.getUsers = async(req,res,next) => {
    try {
        const users = await prisma.user.findMany({
            where: {
                org_id: req.user.org_id
            }
        })

        res.status(200).json({
            message: "Users fetched successfully",
            users: users.map(user => ({
                ...user,
                role: user.role.split(',')
            }))
        });
    } catch (error) {
        next(error);
    }
}
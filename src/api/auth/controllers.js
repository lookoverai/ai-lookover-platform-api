const { auth, tenantManager } = require("../../utils/firebase_admin");
const prisma = require("../../utils/prisma_client");
const logger = require("../../utils/logger");
const Functions = require("./functions");
const { tenantAuth } = require("../org/functions");
const { getClient } = require("../../utils/mongodb_client");
const { v4: uuidv4 } = require('uuid');

const getTenantId = async (org_id) => {
    const organization = await prisma.organization.findUnique({
        where: {
            id: org_id
        }
    })

    return organization.tenant_id;
}

module.exports.createUser = async (req, res, next) => {
    try {
        const { email, name, org_id } = req.body;

        if(!email || !name) {
            throw new Error("Email and name are required");
        }

        const tenantId = await getTenantId(org_id);

        const firebaseUser = await tenantManager.authForTenant(tenantId).createUser({
            email: email,
            displayName: name
        })

        const user = await prisma.user.create({
            data:{
                id: firebaseUser.uid,
                email_id: email,
                name: name,
                org_id: org_id,
            }
        });

        logger.info(`User created successfully: ${user.id}`);

        res.status(200).json({
            message: "User created successfully",
            ...user
        });

    } catch (error) {
        next(error);
    }
}

module.exports.getUser = async (req, res, next) => {
    try {
        const { user_id } = req.user;

        const user = await prisma.user.findUnique({
            where: {
                id: user_id
            }
        })

        if(!user) {
            throw new Error("User not found");
        }

        res.status(200).json({
            message: "User fetched successfully",
            ...user,
            role: user.role.split(',')
        });
    } catch (error) {
        next(error);
    }
}

module.exports.loginUser = async (req,res, next) => {
    try {
        const { email_id, stage } = req.body;
        const org_id = req.headers.org_id;

        if(!email_id || !stage || !org_id) {
            throw new Error("Email ID, Stage and Organization ID are required");
        }

        if(stage === "otp-request"){

            // Check if user exists
            const tenant = await tenantAuth({org_id});
            const user = await tenant.getUserByEmail(email_id);
            if(!user) {
                throw new Error("User not found in Organization");
            }

            const session_id = uuidv4();
            const otp = Math.floor(1000 + Math.random() * 9000).toString();

            const client = getClient();
            const db = client.db("lookover");
            const collection = db.collection("otp-verification");

            // Insert with TTL
            await collection.insertOne({
                session_id,
                otp,
                email_id,
                user_id: user.uid,
                org_id,
                tenant_id: tenant.tenantId,
                created_at: new Date(),
            }, {
                expireAfterSeconds: 60 * 10 // 10 minutes
            });

            res.status(200).json({
                message: "OTP sent successfully",
                session_id,
                otp
            });
        } else if(stage === "otp-verification"){
            const { session_id, otp, exchange } = req.body;

            const client = getClient();
            const db = client.db("lookover");
            const collection = db.collection("otp-verification");
            const result = await collection.findOne({ session_id });

            if(!result) {
                throw new Error("Invalid session ID");
            }

            if(result.otp !== otp) {
                throw new Error("Invalid OTP");
            }

            //await collection.deleteOne({ session_id });

            const tenant = await tenantAuth({tenant_id: result.tenant_id});

            const user = await prisma.user.findUnique({
                where: {
                    id: result.user_id
                }
            })

            const custom_roles = user.role.split(',');


            if(exchange === "login-token"){
                const token = await tenant.createCustomToken(result.user_id,{
                    org_id: result.org_id,
                    role: custom_roles
                });
                res.status(200).json({
                    message: "Login token generated successfully",
                    token
                });
            } else if(exchange === "token"){
                const token = await tenant.createCustomToken(result.user_id,{
                    org_id: result.org_id,
                    role: custom_roles
                });

                const resultToken = await Functions.loginUsingCustomToken(result.tenant_id, token);

                // Set Cookie
                res.cookie("idToken", resultToken.idToken, {
                    httpOnly: true,
                    secure: true,
                    sameSite: "strict",
                    expires: new Date(Date.now() + 1000 * 60 * 60) // 1 hour
                });

                res.cookie("refreshToken", resultToken.refreshToken, {
                    httpOnly: true,
                    secure: true,
                    sameSite: "strict",
                    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) // 30 days
                });

                res.status(200).json({
                    message: "Login successful"
                });
            }
        } else if(stage === "refresh-token"){
            const refreshToken = req.cookies.refreshToken;
            
            const result = await Functions.refreshToken(refreshToken);

            // Set Cookie
            res.cookie("idToken", result.idToken, {
                httpOnly: true,
                secure: true,
                sameSite: "strict",
                expires: new Date(Date.now() + 1000 * 60 * 60) // 1 hour
            });

            res.status(200).json({
                message: "Token refreshed successfully",
            });
        } else {
            throw new Error("Invalid stage");
        }
        
    } catch (error) {
        next(error);
    }
}

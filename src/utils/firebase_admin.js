const { initializeApp } = require('firebase-admin/app');
const { credential } = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');
const logger = require('./logger');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

const app = initializeApp({
    credential: credential.cert(serviceAccount)
});

const auth = getAuth(app);
const tenantManager = auth.tenantManager();

module.exports = { app, auth, tenantManager };

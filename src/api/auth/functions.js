

module.exports.loginUsingCustomToken = async (tenantId, customToken) => {
    const data = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${process.env.FIREBASE_WEB_API_KEY}`, {
        method: "POST",
        body: JSON.stringify({
            token: customToken, 
            tenantId: tenantId,
            returnSecureToken: true
        })
    });

    const result = await data.json();

    if(result.error) {
        throw new Error(result.error.message);
    }

    return result;
}

module.exports.refreshToken = async (tenantId, refreshToken) => {
    const data = await fetch(`https://securetoken.googleapis.com/v1/token?key=${process.env.FIREBASE_WEB_API_KEY}`, {
        method: "POST",
        body: JSON.stringify({
            grant_type: "refresh_token",
            refresh_token: refreshToken,
            tenantId: tenantId
        })
    });

    const result = await data.json();

    if(result.error) {
        throw new Error(result.error.message);
    }

    return result;
}
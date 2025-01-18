const express = require("express");
const Controller = require("./controllers");
const router = express.Router();
const { isAuthenticated } = require("../../utils/is_auth");

// Health Check
router.get("/", isAuthenticated(), (req, res) => {
    console.log(req.user);
    res.status(200).json({
        message: "OK"
    });
});

// Login User
router.post("/login", Controller.loginUser);

// Get User
router.get("/info", isAuthenticated(), Controller.getUser);

module.exports = router;

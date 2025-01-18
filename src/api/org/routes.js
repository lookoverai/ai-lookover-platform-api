const express = require("express");
const Controller = require("./controllers");
const router = express.Router();
const { isAuthenticated } = require("../../utils/is_auth");


// Create Organization
router.post("/", Controller.createOrg);

// Add User
router.post("/users", isAuthenticated(["admin"]), Controller.addUser);

// Get Users
router.get("/users", isAuthenticated(["admin"]), Controller.getUsers);

// Get Organization
router.get("/:org_id", isAuthenticated(), Controller.getOrg);



module.exports = router;

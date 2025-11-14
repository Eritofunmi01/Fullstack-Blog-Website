const express = require("express");
const router = express.Router();
const suspendedController = require("../controllers/suspendedController");

// PATCH /api/suspend/:id
// Handles both suspension and manual ban
router.patch("/api/suspend/:id", suspendedController.suspendOrBanUser);

module.exports = router;

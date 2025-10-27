const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { authenticate } = require("../middleware/auth.js");

// Protect both routes with JWT auth
router.get("/unread", authenticate, notificationController.getUnreadNotifications);
router.put("/read/:id", authenticate, notificationController.markNotificationAsRead);

module.exports = router;

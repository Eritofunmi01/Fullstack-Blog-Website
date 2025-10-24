const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const paymentController = require("../controllers/paymentController");

// Initiate subscription payment
router.post("/subscription/initiate", authenticate, paymentController.initiatePayment);

// Verify subscription payment
router.post("/subscription/verify", authenticate, paymentController.verifyPayment);

module.exports = router;

const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticate, isAdmin } = require("../middleware/auth");
const multer = require("multer");

// Multer setup for image uploads (temp storage before Cloudinary)
// (we’ll use this later when we add updateProfile with Cloudinary)
const upload = multer({ dest: "uploads/" });

// ================== AUTH ================== //
router.post("/signup", authController.signup);
router.post("/login", authController.login);

// ================== USERS ================== //
router.get("/users", authController.getAllUsers);
router.delete("/users/:id", authenticate, authController.deleteUser);
router.put("/make-admin/:id", authenticate, authController.makeAdmin);
router.post("/fix-admin-roles", authController.fixAdminRoles);
router.post("/forgotPassword", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// ================== PROFILE ================== //
router.get("/api/auth/profile", authenticate, authController.getProfile);
router.put(
  "/api/profile",
  authenticate,
  upload.single("profilePic"), // multer handles file
  authController.updateProfile
);
router.get("/api/users/:id/profile", authController.getPublicUserProfile);
router.put("/api/profile", authenticate, upload.single("profilePic"), authController.updateProfile);

module.exports = router;

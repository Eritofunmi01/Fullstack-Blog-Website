const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const {
  toggleFavorite,
  getUserFavorites,
} = require("../controllers/favoriteController");

// Add / Remove favorite
router.post("/toggle/:blogId", authenticate, toggleFavorite);

// Get user favorites
router.get("/user", authenticate, getUserFavorites);

module.exports = router;

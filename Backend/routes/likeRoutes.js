const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const { toggleLike, getBlogLikes } = require("../controllers/likeController");

// Toggle like/unlike a blog
router.post("/:blogId/like", authenticate, toggleLike);

// Get like count & user’s like status
router.get("/:blogId/likes", authenticate, getBlogLikes);

module.exports = router;

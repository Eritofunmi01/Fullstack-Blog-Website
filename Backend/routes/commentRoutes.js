const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");
const { authenticate,} = require("../middleware/auth"); // if you have auth middleware
const { isCommentAuthorOrAdmin} = require("../middleware/auth")

// Create a comment (or reply)
router.post("/api/blogs/:id/comments", authenticate, commentController.createComment);

// Fetch all comments for a blog
router.get("/api/blogs/:id/comments", commentController.getComments);

// Delete a comment (and its replies)
router.delete("/api/comments/:id", authenticate ,isCommentAuthorOrAdmin, commentController.deleteComment);

module.exports = router;

const express = require("express");
const router = express.Router();
const blogController = require("../controllers/blogControllers");
const upload = require("../middleware/upload");
const { authenticate, isAuthorOrAdmin, isCreator } = require("../middleware/auth");

/* -------------------------- BLOG ROUTES -------------------------- */
router.post("/api/create-blog", authenticate, upload.single("img"), blogController.createBlog);
router.put("/api/blog/:id", authenticate, upload.single("img"), blogController.updateBlog);
router.get("/api/blogs", blogController.getBlogs);
router.get("/api/blog/:id", blogController.getBlogById);
router.delete("/api/blog/:id", authenticate, isAuthorOrAdmin, isCreator, blogController.deleteBlog);
router.get("/api/blogs/search", blogController.searchBlogs);

module.exports = router;

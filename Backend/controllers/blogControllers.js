const { PrismaClient } = require("@prisma/client");
const cloudinary = require("cloudinary").v2;

const prisma = new PrismaClient();

// ✅ Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* --------------------------- HELPER: Fetch all blogs --------------------------- */
const fetchAllBlogs = async () => {
  const blogs = await prisma.blog.findMany({
    include: {
      author: {
        select: { id: true, username: true, profilePic: true },
      },
      Category: {
        select: { id: true, name: true },
      },
      likes: { select: { id: true } },
      comments: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return blogs.map((b) => ({
    ...b,
    likeCount: b.likes.length,
    commentCount: b.comments.length,
  }));
};

/* --------------------------- CREATE BLOG --------------------------- */
const createBlog = async (req, res) => {
  try {
    const { title, content, categoryId } = req.body;
    const authorId = req.user?.id;

    if (!title || !content || !categoryId) {
      console.log("🚫 Missing fields:", { title, content, categoryId });
      return res.status(400).json({ message: "Please fill all fields" });
    }

    let imgUrl = null;

    if (req.file && req.file.buffer) {
      try {
        const uploadResult = await cloudinary.uploader.upload(
          `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
          { folder: "blog_images" }
        );
        imgUrl = uploadResult.secure_url;
      } catch (error) {
        console.error("❌ Cloudinary upload error:", error);
        return res.status(500).json({ message: "Image upload failed" });
      }
    }

    const blog = await prisma.blog.create({
      data: {
        title,
        content,
        categoryId: Number(categoryId),
        authorId,
        img: imgUrl,
      },
      include: {
        author: { select: { id: true, username: true } },
        Category: { select: { id: true, name: true } },
      },
    });

    const updatedBlogs = await fetchAllBlogs();

    return res.status(201).json({
      message: "Blog created successfully",
      blog,
      updatedBlogs,
    });
  } catch (error) {
    console.error("❌ Create Blog Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/* --------------------------- GET BLOGS --------------------------- */
const getBlogs = async (req, res) => {
  try {
    const blogs = await fetchAllBlogs();
    res.json(blogs);
  } catch (err) {
    console.error("❌ Get Blogs Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/* --------------------------- GET SINGLE BLOG --------------------------- */
const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    const blogId = parseInt(id);

    const blog = await prisma.blog.findUnique({
      where: { id: blogId },
      include: {
        author: {
          select: { id: true, username: true, profilePic: true, role: true },
        },
        Category: { select: { id: true, name: true } },
        likes: true,
        comments: {
          include: {
            author: { select: { id: true, username: true, profilePic: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!blog) {
      console.log(`⚠️ Blog with ID ${blogId} not found`);
      return res.status(404).json({ message: "Blog not found" });
    }

    const likeCount = blog.likes.length;
    const commentCount = blog.comments.length;
    res.json({ ...blog, likeCount, commentCount });
  } catch (err) {
    console.error("❌ Error in getBlogById:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/* --------------------------- UPDATE BLOG --------------------------- */
const updateBlog = async (req, res) => {
  const { id } = req.params;
  const { categoryId, title, content } = req.body;

  try {
    const blogId = parseInt(id, 10);
    if (isNaN(blogId)) return res.status(400).json({ message: "Invalid blog ID" });

    const blog = await prisma.blog.findUnique({ where: { id: blogId } });
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    if (blog.authorId !== req.user?.id && req.user?.role !== "ADMIN")
      return res.status(403).json({ message: "Not allowed to edit this blog" });

    let validCategoryId = blog.categoryId;
    if (categoryId) {
      const catId = parseInt(categoryId, 10);
      const category = await prisma.category.findUnique({ where: { id: catId } });
      if (!category)
        return res.status(400).json({ message: "Category does not exist" });
      validCategoryId = catId;
    }

    let imgUrl = blog.img;
    if (req.file && req.file.buffer) {
      try {
        const uploaded = await cloudinary.uploader.upload(
          `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
          { folder: "blog_images" }
        );
        imgUrl = uploaded.secure_url;
      } catch (error) {
        console.error("❌ Cloudinary Error:", error.message);
        return res.status(500).json({ message: "Image upload failed" });
      }
    }

    const updatedBlog = await prisma.blog.update({
      where: { id: blogId },
      data: {
        categoryId: validCategoryId,
        title: title || blog.title,
        content: content || blog.content,
        img: imgUrl,
      },
      include: {
        author: { select: { username: true } },
        Category: { select: { name: true } },
      },
    });

    const updatedBlogs = await fetchAllBlogs();

    return res.status(200).json({
      message: "Blog updated successfully",
      data: updatedBlog,
      updatedBlogs,
    });
  } catch (error) {
    console.error("❌ Update Blog Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/* --------------------------- DELETE BLOG --------------------------- */
const deleteBlog = async (req, res) => {
  const { id } = req.params;
  try {
    const blog = await prisma.blog.findUnique({ where: { id: parseInt(id) } });
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    if (blog.authorId !== req.user?.id && req.user?.role !== "ADMIN")
      return res.status(403).json({ message: "Forbidden" });

    await prisma.blog.delete({ where: { id: parseInt(id) } });

    const updatedBlogs = await fetchAllBlogs();

    return res.status(200).json({
      message: "Blog deleted successfully",
      updatedBlogs,
    });
  } catch (error) {
    console.error("❌ Delete Blog Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/* --------------------------- SEARCH BLOGS --------------------------- */
const searchBlogs = async (req, res) => {
  const { query } = req.query;
  if (!query || !query.trim())
    return res.status(400).json({ message: "Query is required" });

  try {
    const blogs = await prisma.blog.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { author: { is: { username: { contains: query, mode: "insensitive" } } } },
          { Category: { is: { name: { contains: query, mode: "insensitive" } } } },
        ],
      },
      include: {
        author: { select: { username: true } },
        Category: { select: { name: true } },
      },
      take: 5,
    });

    return res.status(200).json({ data: blogs });
  } catch (error) {
    console.error("❌ SEARCH ERROR:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  createBlog,
  getBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  searchBlogs,
};

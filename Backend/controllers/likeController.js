const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ✅ Toggle Like / Unlike and auto-fetch updated data
const toggleLike = async (req, res) => {
  try {
    const { blogId } = req.params;
    const userId = req.user.id;
    const blogIdInt = parseInt(blogId);

    // ✅ Ensure blog exists
    const blog = await prisma.blog.findUnique({
      where: { id: blogIdInt },
      select: { id: true, authorId: true, trending: true, latest: true },
    });
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    // ✅ Check if user already liked this blog
    const existingLike = await prisma.blogLike.findUnique({
      where: { blogId_userId: { blogId: blogIdInt, userId } },
    });

    let liked;
    if (existingLike) {
      // 🧹 Unlike → delete record
      await prisma.blogLike.delete({
        where: { blogId_userId: { blogId: blogIdInt, userId } },
      });
      liked = false;
    } else {
      // ❤️ Like → create record
      await prisma.blogLike.create({
        data: { blogId: blogIdInt, userId, liked: true },
      });
      liked = true;
    }

    // ✅ Count total likes for this blog (from BlogLike table)
    const blogLikeCount = await prisma.blogLike.count({
      where: { blogId: blogIdInt, liked: true },
    });

    // ✅ Trending logic (if a blog gets 3+ likes)
    if (blogLikeCount >= 3 && !blog.trending) {
      await prisma.blog.update({
        where: { id: blogIdInt },
        data: { trending: true, latest: false },
      });
    }

    // ✅ Auto-fetch updated like info (no page refresh needed)
    const updatedLikes = await prisma.blogLike.count({
      where: { blogId: blogIdInt, liked: true },
    });

    const userLiked = await prisma.blogLike.findUnique({
      where: { blogId_userId: { blogId: blogIdInt, userId } },
    });

    return res.json({
      message: "Like toggled successfully",
      liked,
      count: updatedLikes,
      userLiked: !!userLiked,
    });
  } catch (err) {
    console.error("Error in toggleLike:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

// ✅ Get like count & user's like status
const getBlogLikes = async (req, res) => {
  try {
    const { blogId } = req.params;
    const userId = req.user?.id;
    const blogIdInt = parseInt(blogId);

    // Ensure blog exists
    const blog = await prisma.blog.findUnique({
      where: { id: blogIdInt },
    });
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    // ✅ Get total like count from BlogLike table
    const likeCount = await prisma.blogLike.count({
      where: { blogId: blogIdInt, liked: true },
    });

    // ✅ Check if current user liked it
    let userLiked = false;
    if (userId) {
      const existing = await prisma.blogLike.findUnique({
        where: { blogId_userId: { blogId: blogIdInt, userId } },
      });
      userLiked = !!existing && existing.liked;
    }

    res.json({ count: likeCount, userLiked });
  } catch (err) {
    console.error("Error in getBlogLikes:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = { toggleLike, getBlogLikes };

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ✅ Toggle Favorite / Unfavorite
const toggleFavorite = async (req, res) => {
  try {
    const { blogId } = req.params;
    const userId = req.user.id;
    const blogIdInt = parseInt(blogId);

    // 🔒 Ensure blog exists
    const blog = await prisma.blog.findUnique({ where: { id: blogIdInt } });
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Check if favorite already exists
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_blogId: { userId, blogId: blogIdInt },
      },
    });

    if (existing) {
      // Remove from favorites
      await prisma.favorite.delete({
        where: { userId_blogId: { userId, blogId: blogIdInt } },
      });
      return res.json({ favorited: false, message: "Removed from favorites" });
    } else {
      // Add to favorites
      await prisma.favorite.create({
        data: { userId, blogId: blogIdInt },
      });
      return res.json({ favorited: true, message: "Added to favorites" });
    }
  } catch (err) {
    console.error("Error in toggleFavorite:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get all favorites for logged-in user
const getUserFavorites = async (req, res) => {
  try {
    const userId = req.user.id;

    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        blog: {
          include: {
            author: {
              select: { id: true, username: true, profilePic: true },
            },
            Category: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Flatten to just blog details
    const blogs = favorites.map((fav) => fav.blog);

    return res.status(200).json({ count: blogs.length, blogs });
  } catch (err) {
    console.error("Error in getUserFavorites:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  toggleFavorite,
  getUserFavorites,
};

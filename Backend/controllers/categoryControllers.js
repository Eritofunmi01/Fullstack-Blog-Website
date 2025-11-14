const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient()


exports.createCategory = async (req, res) => {
const category = await prisma.category.create({ data: req.body })
  try {
        if(!category) return res.status(400).json({ message: "Unable to Create Category!"})
        return res.status(201).json({ message: "Category created Successfully!", data: category})
    } catch (error) {
        console.log({ message: error.message })
        return res.status(500).json({ message: "Internal Server Error", message: error.message })
    }
}


exports.getCategories = async (req, res) => {
    try {
        const category = await prisma.category.findMany()
        if(!category || category.length === 0){
            return res.status(400).json({ message: "No Category found"})
        }
        return res.status(200).json({ message: "Fetched Categories Successfully", data: category})
    } catch (error) {
        connsole.log({ message: error.message})
        return res.status(500).json({ message: "Internal Server Error"})
    }
}

// categoryControllers.js
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params; // category ID from URL
    const { name, description } = req.body; // fields to update

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: Number(id) },
    });
    if (!existingCategory) {
      return res.status(404).json({ message: "Category not found!" });
    }

    // Update category
    const updatedCategory = await prisma.category.update({
      where: { id: Number(id) },
      data: {
        ...(name && { name }),
        ...(description && { description }),
      },
    });

    return res.status(200).json({
      message: "Category updated successfully!",
      data: updatedCategory,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
exports.getTopCategories = async (req, res) => {
  try {
    // ✅ Fetch all categories and include their blogs
    const categories = await prisma.category.findMany({
      include: {
        blog: {
          include: {
            author: {
              select: { id: true, username: true, profilePic: true },
            },
            likes: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    // ✅ Filter categories that have at least 3 blogs
    const categoriesWithEnoughBlogs = categories.filter(
      (cat) => cat.blog.length >= 3
    );

    // ✅ Sort these categories by total likes (optional for ranking)
    const sortedCategories = categoriesWithEnoughBlogs
      .map((cat) => {
        const totalLikes = cat.blog.reduce(
          (sum, blog) => sum + blog.likes.length,
          0
        );
        return { ...cat, totalLikes };
      })
      .sort((a, b) => b.totalLikes - a.totalLikes);

    // ✅ Limit to top 3 categories
    const topCategories = sortedCategories.slice(0, 3);

    res.status(200).json(topCategories);
  } catch (error) {
    console.error("Top Categories Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

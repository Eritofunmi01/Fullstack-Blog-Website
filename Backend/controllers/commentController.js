const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ✅ Create comment or reply
exports.createComment = async (req, res) => {
  try {
    const { content, parentId } = req.body;
    const { id: blogId } = req.params;

    if (!content)
      return res.status(400).json({ message: "Content is required" });

    await prisma.comment.create({
      data: {
        content,
        blogId: Number(blogId),
        authorId: req.user.id,
        parentId: parentId ? Number(parentId) : null,
      },
    });

    // ✅ Immediately fetch all updated comments
    const updatedComments = await prisma.comment.findMany({
      where: { blogId: Number(blogId), parentId: null },
      include: {
        author: { select: { id: true, username: true, profilePic: true } },
        replies: {
          include: {
            author: { select: { id: true, username: true, profilePic: true } },
            replies: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return res.status(201).json({
      message: "Comment created successfully!",
      comments: updatedComments,
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// ✅ Fetch all comments
exports.getComments = async (req, res) => {
  try {
    const { id } = req.params;

    const comments = await prisma.comment.findMany({
      where: { blogId: Number(id), parentId: null },
      include: {
        author: { select: { id: true, username: true, profilePic: true } },
        replies: {
          include: {
            author: { select: { id: true, username: true, profilePic: true } },
            replies: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    res.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Error fetching comments" });
  }
};

// ✅ Delete comment (cascade replies)
exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    const existingComment = await prisma.comment.findUnique({
      where: { id: Number(id) },
    });

    if (!existingComment)
      return res.status(404).json({ message: "Comment not found!" });

    await prisma.comment.delete({ where: { id: Number(id) } });

    const updatedComments = await prisma.comment.findMany({
      where: { blogId: existingComment.blogId, parentId: null },
      include: {
        author: { select: { id: true, username: true, profilePic: true } },
        replies: {
          include: {
            author: { select: { id: true, username: true, profilePic: true } },
            replies: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return res.status(200).json({
      message: "Comment deleted successfully!",
      comments: updatedComments,
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("❌ JWT_SECRET is not set in environment variables!");
  process.exit(1);
}

// -------------------- VERIFY JWT --------------------
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized. Token missing" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user)
      return res.status(401).json({ message: "Unauthorized. User not found." });

    // -------------------- BAN CHECK --------------------
    if (user.isBanned) {
      return res.status(403).json({
        message: "Your account has been permanently banned.",
        status: "BANNED",
      });
    }

    // -------------------- SUSPENSION CHECK --------------------
    if (user.isSuspended) {
      const now = new Date();
      if (user.suspendedUntil && now < user.suspendedUntil) {
        const remainingMs = user.suspendedUntil - now;
        return res.status(403).json({
          message: "Your account is suspended.",
          status: "SUSPENDED",
          suspendedUntil: user.suspendedUntil,
          remainingHours: Math.floor(remainingMs / (1000 * 60 * 60)),
        });
      } else {
        // auto unsuspend when time is up
        await prisma.user.update({
          where: { id: user.id },
          data: { isSuspended: false, suspendedUntil: null },
        });
      }
    }

    next();
  } catch (err) {
    console.error("JWT Error:", err);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

// -------------------- CREATOR CHECK --------------------
const isCreator = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  if (req.user.role.toUpperCase() !== "CREATOR") {
    return res.status(403).json({ message: "Access denied. Creator only." });
  }
  next();
};

// -------------------- ADMIN CHECK (CREATOR INCLUDED) --------------------
const isAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const role = req.user.role?.toUpperCase();
  if (role !== "ADMIN" && role !== "CREATOR") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  next();
};

// -------------------- AUTHOR (WITH SUBSCRIPTION) OR ADMIN/CREATOR --------------------
const authorizeAuthor = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const role = user.role?.toUpperCase();
    // Creator or Admin always allowed
    if (role === "CREATOR" || role === "ADMIN") return next();

    if (role === "AUTHOR") {
      if (!user.subscriptionExpiresAt || new Date() > user.subscriptionExpiresAt) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            role: "USER",
            subscriptionPlan: null,
            subscriptionExpiresAt: null,
          },
        });
        return res
          .status(403)
          .json({ message: "Subscription expired. Please renew." });
      }
      return next(); // valid author
    }

    return res.status(403).json({
      message: "Access denied. Please subscribe to become an Author.",
    });
  } catch (error) {
    console.error("Authorize Author Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// -------------------- BLOG AUTHOR OR ADMIN/CREATOR --------------------
const isAuthorOrAdmin = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    const blog = await prisma.blog.findUnique({ where: { id: parseInt(id) } });
    if (!blog) return res.status(404).json({ message: "Blog not found" });

    const role = req.user.role?.toUpperCase();
    if (parseInt(req.user.id) !== blog.authorId && role !== "ADMIN" && role !== "CREATOR") {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  } catch (error) {
    console.error("Author/Admin Middleware Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// -------------------- COMMENT AUTHOR OR ADMIN/CREATOR --------------------
const isCommentAuthorOrAdmin = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const { id } = req.params;
    const comment = await prisma.comment.findUnique({
      where: { id: parseInt(id) },
    });
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const role = req.user.role?.toUpperCase();
    if (parseInt(req.user.id) !== comment.authorId && role !== "ADMIN" && role !== "CREATOR") {
      return res.status(403).json({ message: "Access denied" });
    }

    next();
  } catch (error) {
    console.error("Comment Author/Admin Middleware Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  authenticate,
  isCreator,
  isAdmin,
  authorizeAuthor,
  isAuthorOrAdmin,
  isCommentAuthorOrAdmin,
};

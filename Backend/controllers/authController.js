import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { Resend } from "resend";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import cloudinary from "../config/cloudinary.js";
import fs from "fs";
const resend = new Resend(process.env.RESEND_API_KEY);


const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("❌ JWT_SECRET is not set in environment variables!");
  process.exit(1);
}

// -------------------- HELPERS --------------------
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPassword = (password) =>
  password.length >= 8 &&
  /[A-Z]/.test(password) &&
  /[a-z]/.test(password) &&
  /\d/.test(password);

// -------------------- REGISTER --------------------
export const signup = async (req, res) => {
  try {
    let { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    email = email.toLowerCase();
    if (!isValidEmail(email))
      return res.status(400).json({ message: "Invalid email format" });
    if (!isValidPassword(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long, include uppercase, lowercase, and a number",
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: { username, email, password: hashedPassword, role: "USER" },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    const token = jwt.sign({ id: newUser.id, role: newUser.role }, JWT_SECRET, {
      expiresIn: "1d",
    });

    res
      .status(201)
      .json({ message: "User registered successfully", user: newUser, token });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// -------------------- LOGIN --------------------
export const login = async (req, res) => {
  try {
    let { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email and password are required" });

    email = email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // 🔒 BAN CHECK
    if (user.isBanned) {
      return res.status(403).json({
        message: "Your account has been permanently banned.",
        status: "BANNED",
      });
    }

    // 🔒 SUSPENSION CHECK
    if (user.isSuspended) {
      const now = new Date();
      if (user.suspendedUntil && now < user.suspendedUntil) {
        const remainingMs = user.suspendedUntil - now;
        const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));

        return res.status(403).json({
          message: `Your account is suspended. Try again in ${remainingHours} hour(s).`,
          status: "SUSPENDED",
          suspendedUntil: user.suspendedUntil,
        });
      } else {
        // Auto-unsuspend if time is over
        await prisma.user.update({
          where: { id: user.id },
          data: { isSuspended: false, suspendedUntil: null },
        });
      }
    }

    // ✅ Password Check
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    // ✅ Generate JWT
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "1d",
    });

    // ✅ Success Response
    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
        subscriptionExpiresAt: user.subscriptionExpiresAt,
        isSuspended: user.isSuspended,
        isBanned: user.isBanned,
      },
      token,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// -------------------- GET ALL USERS --------------------

export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
    });

    res.json({ users });
  } catch (error) {
    console.error("❌ Get All Users Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// -------------------- DELETE USER --------------------
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id: parseInt(id) } });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete User Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// -------------------- MAKE ADMIN --------------------
export const makeAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { role: "ADMIN" },
      select: { id: true, username: true, email: true, role: true },
    });
    res.json({ message: "User promoted to admin", user });
  } catch (error) {
    console.error("Make Admin Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET PROFILE (FIXED)
export const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        bio: true,
        profilePic: true,
        createdAt: true,
        subscriptionPlan: true,
        subscriptionExpiresAt: true,
        Blog: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            img: true,
            createdAt: true,
            likes: {
              // ✅ Correct relation name
              where: { liked: true },
              select: { id: true },
            },
          },
        },
      },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    const BASE_URL = process.env.BASE_URL || "https://blug-be-api.onrender.com";

    // Format profilePic
    const formattedUser = {
      ...user,
      blogs: user.Blog.map((b) => ({
        ...b,
        img: b.img
          ? b.img.startsWith("http")
            ? b.img
            : `${BASE_URL}/${b.img}`
          : null,
        likeCount: b.BlogLike?.length || 0, // ✅ count likes per blog
      })),
      totalLikes: user.Blog.reduce(
        (acc, b) => acc + (b.BlogLike?.length || 0),
        0
      ), // ✅ sum total likes
      Blog: undefined,
      profilePic: user.profilePic
        ? user.profilePic.startsWith("http")
          ? user.profilePic
          : `${BASE_URL}/${user.profilePic}`
        : null,
    };

    res.json({ user: formattedUser });
  } catch (error) {
    console.error("❌ Get Profile Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getPublicUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        username: true,
        bio: true,
        role: true,
        profilePic: true,
        Blog: {
          select: {
            id: true,
            title: true,
            content: true,
            img: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    // Format blogs with a short content preview
    const formatted = {
      ...user,
      blogs: user.Blog.map((b) => ({
        id: b.id,
        title: b.title,
        img: b.img,
        createdAt: b.createdAt,
        contentSnippet: b.content ? b.content.slice(0, 120) + "..." : "",
      })),
    };

    delete formatted.Blog;

    res.json({ user: formatted });
  } catch (error) {
    console.error("Get Public User Profile Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// -------------------- UPDATE PROFILE --------------------
export const updateProfile = async (req, res) => {
  try {
    const { username, bio } = req.body;

    // Prepare fields to update
    let data = { username, bio };

    // If a new image was uploaded, send it to Cloudinary
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "profiles",
        transformation: [
          { width: 400, height: 400, crop: "fill", gravity: "face" },
        ],
      });

      // Delete local file after upload
      fs.unlinkSync(req.file.path);

      // Save Cloudinary URL
      data.profilePic = result.secure_url;
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        bio: true,
        profilePic: true,
      },
    });

    res.json({ message: "Profile updated", user });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// -------------------- CHANGE PASSWORD --------------------
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Old password is incorrect" });

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// -------------------- FORGOT PASSWORD --------------------
export const forgotPassword = async (req, res) => {
  try {
    const { token, email } = req.body;
    let userEmail = email;

    // ✅ If token exists, decode it to get the user’s email
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (!user) return res.status(404).json({ message: "User not found" });
        userEmail = user.email;
      } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }
    }

    // ✅ If still no email, stop
    if (!userEmail)
      return res.status(400).json({ message: "Email is required if token is not provided" });

    // ✅ Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: userEmail.toLowerCase() },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ Generate reset token (expires in 15 mins)
    const resetToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "15m" });

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // ✅ Send email using Resend
    await resend.emails.send({
      from: "Blug Support <onboarding@resend.dev>",
      to: user.email,
      subject: "Reset Your Password",
      html: `
        <p>Hello Blogger</p>
        <p>You requested to reset your password.</p>
        <p>Click the link below to reset it. This link will expire in 15 minutes.</p>
        <a href="${resetLink}" style="color:#2563eb; text-decoration:none;">Reset Password</a>
        <p>If you didn’t request this, you can safely ignore this email.</p>
      `,
    });

    res.json({
      message: `✅ Password reset link sent to ${user.email}`,
      resetLink, // optional for testing
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


// -------------------- UPGRADE TO AUTHOR --------------------
export const upgradeToAuthor = async (req, res) => {
  try {
    const { plan } = req.body; // "MONTHLY" | "YEARLY"
    const userId = req.user.id;

    if (!["MONTHLY", "YEARLY"].includes(plan)) {
      return res.status(400).json({ message: "Invalid subscription plan" });
    }

    let expiresAt = new Date();
    if (plan === "MONTHLY") expiresAt.setMonth(expiresAt.getMonth() + 1);
    if (plan === "YEARLY") expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role: "AUTHOR",
        subscriptionPlan: plan,
        subscriptionExpiresAt: expiresAt,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        subscriptionPlan: true,
        subscriptionExpiresAt: true,
      },
    });

    res.json({ message: `Upgraded to ${plan} plan.`, user: updatedUser });
  } catch (error) {
    console.error("Upgrade Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const fixAdminRoles = async (req, res) => {
  try {
    const { id } = req.body; // Get the user ID from request body

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Find the user first
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // If user is already USER, no need to update
    if (user.role === "USER") {
      return res.status(200).json({
        success: true,
        message: "This user is already a USER",
      });
    }

    // Update the role to USER
    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: { role: "USER" },
    });

    return res.status(200).json({
      success: true,
      message: `✅ User '${updatedUser.username}' (ID: ${updatedUser.id}) role changed to USER.`,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error("Error fixing admin role:", error);
    return res.status(500).json({
      success: false,
      message: "❌ Server error while updating role.",
      error: error.message,
    });
  }
};

// -------------------- RESET PASSWORD (after forgot) --------------------
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword)
      return res.status(400).json({ message: "Token and new password required" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    res.json({ message: "✅ Password reset successful. You can now log in." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Invalid or expired token" });
  }
};
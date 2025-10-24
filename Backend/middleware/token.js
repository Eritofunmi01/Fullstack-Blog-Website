const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("❌ JWT_SECRET is not set in environment variables!");
}

// -------------------- GENERATE TOKEN --------------------
const generateToken = (user) => {
  if (!user?.id || !user?.role) {
    throw new Error("❌ User must have id and role to generate token");
  }

  return jwt.sign(
    {
      id: user.id,
      role: user.role.toLowerCase(), // ✅ normalize role
    },
    JWT_SECRET,
    { expiresIn: "5h" }
  );
};

// -------------------- VERIFY TOKEN --------------------
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.error("❌ JWT verification failed:", err.message);
    return null; // return null so middleware can handle it
  }
};

module.exports = { generateToken, verifyToken };

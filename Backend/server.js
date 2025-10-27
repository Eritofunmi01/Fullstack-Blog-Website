const express = require("express");
const { connectDB } = require("./config/db");
const categoryRoutes = require("./routes/categoryRoutes");
const blogRoutes = require("./routes/blogRoutes");
const commentRoutes = require("./routes/commentRoutes");
const authRoutes = require("./routes/authRoutes");
const likeRoutes = require("./routes/likeRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const suspendRoutes = require("./routes/suspendRoutes");
const notificationRoutes = require("./routes/notificationRoutes")
const favoriteRoutes = require("./routes/favoriteRoutes");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

dotenv.config();
connectDB();

const app = express();

// 🔹 Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 🔹 Serve uploads folder publicly
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 🔹 CORS config
const allowedOrigins = [
  "http://localhost:5173",       // Vite dev
  "http://localhost:3000",       // other dev port if used
  "https://phantombluggers.vercel.app", // production frontend
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow mobile, curl, server-side requests
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.warn("Blocked CORS request from origin:", origin);
        return callback(new Error("The CORS policy for this site does not allow access from the specified Origin."), false);
      }
    },
    credentials: true,
  })
);

// ✅ Mount routes
app.use("/", categoryRoutes);
app.use("/", authRoutes);
app.use("/", blogRoutes);
app.use("/", commentRoutes);
app.use("/api/blogs", likeRoutes);
app.use("/", suspendRoutes);
app.use("/", paymentRoutes);
app.use("/", notificationRoutes);
app.use("/favorites", favoriteRoutes);

// Root route
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// ✅ Server start
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Listening on port ${port}...`);
});

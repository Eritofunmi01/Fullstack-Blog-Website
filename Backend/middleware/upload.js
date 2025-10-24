const multer = require("multer");

// Use memory storage so files can be sent directly to Cloudinary
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

module.exports = upload;

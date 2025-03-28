const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  sendMessage,
  allMessages,
  uploadFileMessage,
  deleteMessage,
  addReaction,
  editMessage,
  forwardMessage,
  pinMessage,
  markAsRead,
} = require("../controllers/messageController");
const multer = require("multer");
const path = require("path");

// Set up Multer storage and file handling for specific formats
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename with timestamp
  },
});

// Filter allowed file types (images, PDFs, and videos)
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = /jpeg|jpg|png|pdf|mp4|mov/;
  const extname = allowedFileTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb("Error: Only images, videos, and PDFs are allowed!");
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
});
const router = express.Router();

router.route("/").post(protect, sendMessage);
router.route("/:chatId").get(protect, allMessages);
router.route("/upload").post(protect, upload.single("file"), uploadFileMessage);
router.route("/:messageId").delete(protect, deleteMessage);
router.route("/:messageId/reaction").post(protect, addReaction);
router.route("/:messageId/edit").put(protect, editMessage);
router.route("/:messageId/forward").post(protect, forwardMessage);
router.route("/:messageId/pin").put(protect, pinMessage);
router.route("/:messageId/read").post(protect, markAsRead);

module.exports = router;

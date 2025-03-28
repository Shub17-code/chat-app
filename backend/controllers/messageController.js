const asyncHandler = require("express-async-handler");
const Message = require("../models/messageModel");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");
const path = require("path");
const fs = require("fs");

const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId } = req.body;
  if (!content || !chatId) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }
  // Send message to chat
  var newMessage = {
    sender: req.user._id,
    content: content,
    chat: chatId,
  };
  try {
    var message = await Message.create(newMessage);
    message = await message.populate("sender", "name pic");
    message = await message.populate("chat");
    //populate every user of message model
    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });

    await Chat.findByIdAndUpdate(req.body.chatId, {
      latestMessage: message,
    });

    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

const allMessages = asyncHandler(async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name pic email")
      .populate("chat");
    res.json(messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});
const uploadFileMessage = async (req, res) => {
  const { chatId } = req.body;
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded!" });
  }
  try {
    const newMessage = {
      sender: req.user._id,
      content: `${req.protocol}://${req.get("host")}/uploads/${
        req.file.filename
      }`,
      chat: chatId,
      isFile: true, // Mark as a file message
      fileType: path.extname(req.file.originalname).toLowerCase(),
    };

    const message = await Message.create(newMessage);
    await message.populate("sender", "name pic");
    await message.populate("chat");
    await User.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });
    // Update the latest message in the chat
    await Chat.findByIdAndUpdate(chatId, { latestMessage: message });

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "File upload failed.", error: error.message });
  }
};
const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
console.log(messageId);
console.log("Type of messageId:", typeof messageId);

  try {
    const message = await Message.findById(messageId);
console.log(message);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Check if the requesting user is the sender of the message
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "You can only delete your own messages" });
    }
       // Remove the associated file if the message contains a file and isFile is true
       if (message.isFile && message.content) {
        const filePath = path.join(__dirname, "../uploads", path.basename(message.content));
        console.log("Attempting to delete file:", filePath);
  
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(`Failed to delete file: ${filePath}`, err);
          } else {
            console.log(`File deleted: ${filePath}`);
          }
        });
      }
  
    // Directly delete the message using findByIdAndDelete
    await Message.findByIdAndDelete(messageId);
    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete message" });
  }
});

const addReaction = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { reaction } = req.body;
  const userId = req.user._id;

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      res.status(404);
      throw new Error("Message not found");
    }

    // Check if user has already reacted with this emoji
    const existingReaction = message.reactions.find(
      (r) => r.emoji === reaction && r.users.includes(userId)
    );

    if (existingReaction) {
      // Remove user's reaction
      existingReaction.users = existingReaction.users.filter(
        (id) => id.toString() !== userId.toString()
      );
      existingReaction.count -= 1;

      // Remove reaction if count is 0
      message.reactions = message.reactions.filter((r) => r.count > 0);
    } else {
      // Add new reaction
      const reactionIndex = message.reactions.findIndex((r) => r.emoji === reaction);
      if (reactionIndex !== -1) {
        // Update existing reaction
        message.reactions[reactionIndex].users.push(userId);
        message.reactions[reactionIndex].count += 1;
      } else {
        // Add new reaction
        message.reactions.push({
          emoji: reaction,
          count: 1,
          users: [userId],
        });
      }
    }

    await message.save();
    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

const editMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { content } = req.body;
  const userId = req.user._id;

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      res.status(404);
      throw new Error("Message not found");
    }

    if (message.sender.toString() !== userId.toString()) {
      res.status(403);
      throw new Error("You can only edit your own messages");
    }

    // Save the current content to edit history
    message.editHistory.push({
      content: message.content,
      editedAt: new Date(),
    });

    message.content = content;
    message.edited = true;
    await message.save();

    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

const forwardMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { targetChatId } = req.body;
  const userId = req.user._id;

  try {
    const originalMessage = await Message.findById(messageId);
    if (!originalMessage) {
      res.status(404);
      throw new Error("Original message not found");
    }

    const newMessage = await Message.create({
      sender: userId,
      content: originalMessage.content,
      chat: targetChatId,
      forwardedFrom: messageId,
      isFile: originalMessage.isFile,
      fileType: originalMessage.fileType,
    });

    await newMessage.populate("sender", "name pic");
    await newMessage.populate("chat");
    await User.populate(newMessage, {
      path: "chat.users",
      select: "name pic email",
    });

    await Chat.findByIdAndUpdate(targetChatId, {
      latestMessage: newMessage,
    });

    res.json(newMessage);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

const pinMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id;

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      res.status(404);
      throw new Error("Message not found");
    }

    message.isPinned = !message.isPinned;
    message.pinnedBy = message.isPinned ? userId : null;
    await message.save();

    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

const markAsRead = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id;

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      res.status(404);
      throw new Error("Message not found");
    }

    // Check if user has already read the message
    const hasRead = message.readBy.some(
      (read) => read.user.toString() === userId.toString()
    );

    if (!hasRead) {
      message.readBy.push({
        user: userId,
        readAt: new Date(),
      });
      await message.save();
    }

    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

module.exports = {
  sendMessage,
  allMessages,
  uploadFileMessage,
  deleteMessage,
  addReaction,
  editMessage,
  forwardMessage,
  pinMessage,
  markAsRead,
};

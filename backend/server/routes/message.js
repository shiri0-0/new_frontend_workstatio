import express from "express";
import Message from "../models/Message.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Send Message (with optional reply)
router.post("/send", authMiddleware, async (req, res) => {
  try {
    const { roomId, content, fileUrl, fileType, replyTo } = req.body;

    const message = new Message({
      room: roomId,
      sender: req.userId,
      content,
      fileUrl,
      fileType: fileType || 'text',
      readBy: [req.userId],
      replyTo: replyTo || null
    });

    await message.save();
    
    await message.populate('sender', 'name email _id');
    await message.populate('readBy', 'name');
    
    // ✅ Populate reply if exists
    if (message.replyTo) {
      await message.populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'name' }
      });
    }
    
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Room Messages (with replies populated)
router.get("/:roomId", authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.roomId })
      .populate('sender', 'name email _id')
      .populate('readBy', 'name')
      .populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'name' }
      })
      .sort({ createdAt: 1 });
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark as Read
router.patch("/:messageId/read", authMiddleware, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    
    if (!message.readBy.includes(req.userId)) {
      message.readBy.push(req.userId);
      await message.save();
    }

    await message.populate('sender', 'name');
    await message.populate('readBy', 'name');
    
    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
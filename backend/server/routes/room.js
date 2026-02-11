import express from "express";
import Room from "../models/Room.js";
import User from "../models/User.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// Create Room
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const { name, type, maxMembers } = req.body;
    
    const room = new Room({
      name,
      type,
      admin: req.userId,
      members: [req.userId],
      maxMembers: maxMembers || 10
    });

    await room.save();
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/active", authMiddleware, async (req, res) => {
  try {
    const rooms = await Room.find()
      .populate('admin', 'name')
      .populate('members', 'name');

    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Join Room
router.post("/:roomId/join", authMiddleware, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);
    
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Check if room is full
    if (room.members.length >= room.maxMembers) {
      // Add to pending requests
      room.pendingRequests.push({ user: req.userId });
      await room.save();
      return res.status(403).json({ 
        message: "Room is full. Request sent to admin." 
      });
    }

    // Check if entry is closed
    if (room.isEntryClosed) {
      return res.status(403).json({ message: "Entry is closed" });
    }

    // Add member
    if (!room.members.includes(req.userId)) {
      room.members.push(req.userId);
      await room.save();
    }

    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Pending Requests (Admin only)
router.get("/:roomId/requests", authMiddleware, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId)
      .populate('pendingRequests.user', 'name email');
    
    if (room.admin.toString() !== req.userId) {
      return res.status(403).json({ message: "Only admin can view requests" });
    }

    res.json(room.pendingRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Approve Request (Admin only)
router.post("/:roomId/approve/:userId", authMiddleware, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);
    
    if (room.admin.toString() !== req.userId) {
      return res.status(403).json({ message: "Only admin can approve" });
    }

    // Remove from pending and add to members
    room.pendingRequests = room.pendingRequests.filter(
      r => r.user.toString() !== req.params.userId
    );
    
    if (!room.members.includes(req.params.userId)) {
      room.members.push(req.params.userId);
    }

    await room.save();
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove Member (Admin only)
router.delete("/:roomId/remove/:userId", authMiddleware, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);
    
    if (room.admin.toString() !== req.userId) {
      return res.status(403).json({ message: "Only admin can remove members" });
    }

    room.members = room.members.filter(
      m => m.toString() !== req.params.userId
    );

    await room.save();
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Toggle Entry Close (Admin only)
router.patch("/:roomId/toggle-entry", authMiddleware, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);
    
    if (room.admin.toString() !== req.userId) {
      return res.status(403).json({ message: "Only admin can toggle entry" });
    }

    room.isEntryClosed = !room.isEntryClosed;
    await room.save();
    
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
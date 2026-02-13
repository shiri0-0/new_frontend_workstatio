import express from "express";
import Room from "../models/Room.js";
import User from "../models/User.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();
const generateCode = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

// Create Room
router.post("/create", authMiddleware, async (req, res) => {
  try {
    const { name, type, maxMembers } = req.body;

    // ✅ LIMIT PRIVATE ROOMS
    if (type === "private") {
      const count = await Room.countDocuments({
        admin: req.userId,
        type: "private"
      });

      if (count >= 10) {
        return res.status(400).json({ message: "Private room limit reached (max 10)" });
      }
    }

    const room = new Room({
      name,
      type,
      inviteCode: type === "private" ? generateCode() : null,
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

// Get Active Rooms
router.get("/active", authMiddleware, async (req, res) => {
  try {
    const rooms = await Room.find({
      $or: [
        { type: "public" },
        { members: req.userId }   // private rooms visible only if member
      ]
    })
      .populate('admin', 'name')
      .populate('members', 'name');

    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Join Room by Code (Private Rooms)
router.post("/join-by-code", authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;

    const room = await Room.findOne({ inviteCode: code });

    if (!room) {
      return res.status(404).json({ message: "Invalid invite code" });
    }

    if (room.members.includes(req.userId)) {
      return res.json({ message: "You are already a member" });
    }

    // Check if already requested
    const alreadyRequested = room.pendingRequests.some(
      r => r.user.toString() === req.userId
    );

    if (alreadyRequested) {
      return res.json({ message: "Request already sent to admin" });
    }

    // Add to pending requests
    room.pendingRequests.push({ user: req.userId });
    await room.save();

    res.json({ message: "Request sent to admin for approval" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Join Public Room
router.post("/:roomId/join", authMiddleware, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);
    
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Private rooms should use join-by-code
    if (room.type === "private") {
      return res.status(403).json({ message: "Use invite code to join private rooms" });
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

// Edit Room (Admin only)
router.patch("/:roomId/edit", authMiddleware, async (req, res) => {
  try {
    const { name, maxMembers } = req.body;
    const room = await Room.findById(req.params.roomId);
    
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (room.admin.toString() !== req.userId) {
      return res.status(403).json({ message: "Only admin can edit room" });
    }

    // Validate maxMembers - cannot be less than current members
    if (maxMembers < room.members.length) {
      return res.status(400).json({ 
        message: `Cannot set max members below current member count (${room.members.length})` 
      });
    }

    if (name) room.name = name;
    if (maxMembers) room.maxMembers = maxMembers;

    await room.save();
    
    const updatedRoom = await Room.findById(req.params.roomId)
      .populate('admin', 'name')
      .populate('members', 'name');
    
    res.json(updatedRoom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search Users (Admin only)
router.get("/:roomId/search-users", authMiddleware, async (req, res) => {
  try {
    const { email } = req.query;
    const room = await Room.findById(req.params.roomId);
    
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (room.admin.toString() !== req.userId) {
      return res.status(403).json({ message: "Only admin can search users" });
    }

    // Search for users by email
    const users = await User.find({
      email: { $regex: email, $options: 'i' },
      _id: { $nin: room.members } // Exclude already members
    }).select('name email').limit(5);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add Member Directly (Admin only)
router.post("/:roomId/add-member/:userId", authMiddleware, async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);
    
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (room.admin.toString() !== req.userId) {
      return res.status(403).json({ message: "Only admin can add members" });
    }

    // Check if room is full
    if (room.members.length >= room.maxMembers) {
      return res.status(400).json({ message: "Room is full" });
    }

    // Check if user exists
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already a member
    if (room.members.includes(req.params.userId)) {
      return res.status(400).json({ message: "User is already a member" });
    }

    // Add member
    room.members.push(req.params.userId);
    await room.save();

    const updatedRoom = await Room.findById(req.params.roomId)
      .populate('admin', 'name')
      .populate('members', 'name');

    res.json(updatedRoom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
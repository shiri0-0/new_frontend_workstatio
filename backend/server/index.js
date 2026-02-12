import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import textRoutes from "./routes/text.js";
import { createServer } from "http";
import { Server } from "socket.io";
import filesRoutes from "./routes/chatfiles.js";
import fileRoutes from "./routes/file.js";
import cors from "cors";
import roomRoutes from "./routes/room.js";
import messageRoutes from "./routes/message.js";

dotenv.config();

const app = express();

/* ✅ HTTP SERVER CREATE */
const httpServer = createServer(app);

/* ✅ Socket.IO Setup */
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3001",
    credentials: true
  }
});
/* ================= SOCKET.IO ================= */

const onlineUsers = new Map(); // userId -> socketId

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  /* JOIN ROOM */
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });

  /* SEND MESSAGE */
  socket.on("send-message", (data) => {
    socket.broadcast.to(data.roomId).emit("new-message", data);
  });

  /* =========================================
     ✅ USER ONLINE
  ==========================================*/
  socket.on("user-online", ({ userId, roomId }) => {
    onlineUsers.set(userId, socket.id);

    socket.to(roomId).emit("user-status-change", {
      userId,
      status: "online"
    });
  });

  /* =========================================
     ✅ TYPING START
  ==========================================*/
  socket.on("typing-start", ({ roomId, userId, userName }) => {
    socket.to(roomId).emit("user-typing", {
      userId,
      userName
    });
  });

  /* =========================================
     ✅ TYPING STOP
  ==========================================*/
  socket.on("typing-stop", ({ roomId, userId }) => {
    socket.to(roomId).emit("user-stopped-typing", {
      userId
    });
  });

  /* =========================================
     ✅ MESSAGE READ
  ==========================================*/
  socket.on("message-read", ({ roomId, messageId, userId }) => {
    socket.to(roomId).emit("message-read-update", {
      messageId,
      userId
    });
  });

  /* =========================================
     ✅ DISCONNECT → OFFLINE
  ==========================================*/
  socket.on("disconnect", () => {
    let disconnectedUser = null;

    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        disconnectedUser = userId;
        onlineUsers.delete(userId);
        break;
      }
    }

    if (disconnectedUser) {
      io.emit("user-status-change", {
        userId: disconnectedUser,
        status: "offline"
      });
    }

    console.log("User disconnected:", socket.id);
  });
});

/* ✅ CORS */
app.use(cors({
  origin: "http://localhost:3001",
  credentials: true
}));

/* ✅ Body Limits */
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

/* ✅ SERVE STATIC FILES - ADD THIS */
app.use("/uploads", express.static("uploads"));

/* ✅ Routes */
app.use("/api/auth", authRoutes);
app.use("/api/text", textRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/chatfiles", filesRoutes);  

/* ✅ Socket Events */
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });

  socket.on("send-message", (data) => {
    socket.broadcast.to(data.roomId).emit("new-message", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

/* ✅ MongoDB */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch(err => console.log("❌ MongoDB connection error:", err));

/* ✅ Start Server */
const PORT = process.env.PORT || 5001;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 File upload API ready at http://localhost:${PORT}/api/files`);
});

export { io };
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import textRoutes from "./routes/text.js";

import fileRoutes from "./routes/file.js";
import cors from "cors";

dotenv.config();
const app = express();

// ✅ CORS MIDDLEWARE - Frontend ko access dene ke liye
app.use(cors({
  origin: 'http://localhost:3001', // Your Next.js frontend URL
  credentials: true
}));

// ✅ Increase payload size limit for file uploads (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ✅ Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/text", textRoutes); // New text route
// ✅ Routes
app.use("/api/files", fileRoutes);

// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch(err => console.log("❌ MongoDB connection error:", err));

// ✅ Server Start
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 File upload API ready at http://localhost:${PORT}/api/files`);
});
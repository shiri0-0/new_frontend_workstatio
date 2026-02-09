import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import cors from "cors";

dotenv.config();
const app = express();


// ✅ ADD CORS MIDDLEWARE - Put this BEFORE other middleware
app.use(cors({
  origin: 'http://localhost:3001', // Your frontend URL
  credentials: true
}));

app.use(express.json());


app.use(express.urlencoded({ extended: true }));
app.use("/api/auth", authRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

app.listen(5001, () => {
  console.log("Server running on port 5001");
});

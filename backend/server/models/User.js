import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  otp: String,
  otpExpiry: Date,

  verified: {
    type: Boolean,
    default: false
  },

   role: {
    type: String,
    enum: ["user"],   // sirf admin allowed
    default: "user"
  }


}, { timestamps: true });

export default mongoose.model("User", userSchema, "main_user");


import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String },
  fileUrl: { type: String },
  fileType: { type: String, enum: ['image', 'file', 'text'] },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // ✅ Add reply feature
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Message", messageSchema);
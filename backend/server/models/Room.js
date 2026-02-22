import mongoose from "mongoose";
const roomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['public', 'private'], required: true },
  inviteCode: { type: String , unique: true,
  sparse: true,},   // ✅ NEW
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  maxMembers: { type: Number, default: 10 },
  isEntryClosed: { type: Boolean, default: false },
  pendingRequests: [{ 
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    requestedAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
  
});


export default mongoose.model("Room", roomSchema);
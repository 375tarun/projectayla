// models/Hashtag.js
import mongoose from "mongoose";

const hashtagSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true 
  },
  description: { 
    type: String,
    default: ""
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  }
}, {
  timestamps: true
});

// Create a text index on name for better search performance
hashtagSchema.index({ name: 'text' });

export default mongoose.model("Hashtag", hashtagSchema);
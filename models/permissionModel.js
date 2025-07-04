import mongoose from "mongoose";
const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
}, {
  timestamps: true
});

export default mongoose.model("Permission", permissionSchema);

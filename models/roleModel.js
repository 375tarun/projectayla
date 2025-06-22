import mongoose from "mongoose";

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  permissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Permission",
    required: true
  }],
  description: {
    type: String,
    trim: true
    },
}, {
  timestamps: true
});
export default mongoose.model("Role", roleSchema);



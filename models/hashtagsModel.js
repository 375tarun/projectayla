import mongoose from "mongoose";

const hashtagSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
  count:{
    type : Number
  }
});
export default mongoose.model("HashTag", hashtagSchema);

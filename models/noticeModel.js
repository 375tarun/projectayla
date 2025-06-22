import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema({
  content: { type: String, required: true },
  date: { type: Date, default: Date.now },
  type: {
    type: String,
    enum: ['all', 'specific', 'group'],
    required: true
  },
  recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // For 'specific' and 'group' types
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null }
}, { timestamps: true });

export default mongoose.model('Notice', noticeSchema);

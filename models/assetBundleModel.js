import mongoose from 'mongoose';

const assetBundleSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  description: { type: String, default: '' },
  assets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isPublic: { type: Boolean, default: true },
  tags: { type: [String], default: [], index: true },
  assetType: { type: String, enum: ['emoji', 'sticker', 'profilebackground'], required: true },
}, { timestamps: true });

assetBundleSchema.index({ name: 'text', tags: 'text' });

export default mongoose.model('AssetBundle', assetBundleSchema);

// models/Asset.js
import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  assetType: { type: String, enum: ['emoji', 'sticker', 'profilebackground'], required: true },
  assetUrl: { type: String, required: true },
  tags: { type: [String], default: [], index: true },
  sizeInBytes: { type: Number, default: 0 },
  dimensions: {
    width: Number,
    height: Number
  },
  format: { type: String, default: '' },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isPublic: { type: Boolean, default: true },
  usedInBundles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AssetBundle', default: [] }],
}, { timestamps: true });

assetSchema.index({ assetType: 1, tags: 1 });
assetSchema.index({ name: 'text', tags: 'text' });

export default mongoose.model('Asset', assetSchema);

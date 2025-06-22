// models/UserResource.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const UserResourceSchema = new Schema({
  // ——— Link back to the user (aylaId is your 10-digit numeric user ID) ———
  aylaId: {
    type: Number,
    required: true,
    index: true,
  },

  // ——— Which master Resource (from Resource collection) does the user “own”? ———
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Resource",
    required: true,
    index: true,
  },

  // ——— How many units of that resource they have (e.g. 3 roses) ———
  quantity: {
    type: Number,
    default: 1,
    min: 1,
  },

  // ——— When did they acquire it? ———
  acquiredAt: {
    type: Date,
    default: () => new Date(),
  },

  // ——— If this is a **rental**, when does it expire? (null for permanent) ———
  expiresAt: {
    type: Date,
    default: null,
  },

  // ——— How was this resource obtained? ———
  //   • "coin_purchase"    – user bought it directly with coins  
  //   • "gift_received"    – some other user sent it to them  
  //   • "event_reward"     – unlocked via event logic  
  //   • (future possibility: "real_money_purchase", etc.)
  obtainedBy: {
    type: String,
    required: true,
    index: true,
  },

  // ——— If it was rented: how many days was it rented for? ———
  rentDurationDays: {
    type: Number,
    default: 0,
    min: 0,
  },

  // ——— Is this resource still “active” (not expired or used up)? ———
  active: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

/*
  TTL index on expiresAt:
  If expiresAt is non-null and passes, MongoDB will automatically remove that document.
  This makes “rented” items disappear from a user’s inventory when the rent runs out.
*/
UserResourceSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { expiresAt: { $exists: true, $ne: null } } }
);

export default mongoose.model("UserResource", UserResourceSchema);
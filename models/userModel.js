import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    phoneNumber: { type: String, required: true, unique: true, trim: true },
    gender: { type: String, required: true, enum: ["Male", "Female", "Other"] },
    country: { type: String, required: true },
    bio: { type: String, maxlength: 500 },
    password: { type: String, required: true }, // Password must be required
    isEmailVerified: { type: Boolean, default: false }, // Email verification status
    emailOTP: { type: String }, // Stores OTP
    emailOTPExpires: { type: Date }, // OTP expiration time
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    phoneNumber: {
      type: String,
      required: false,
      default: null,
      trim: true,
    },
    profileImg: {
      type: String,
      default: "",
      required: false,
    },
    gender: {
      type: String,
      required: true,
      enum: ["Male", "Female", "Other"],
    },
    country: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
      maxlength: 500,
    },
    password: {
      type: String,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    }, // For Google OAuth users
    isEmailVerified: {
      type: Boolean,
      default: false,
    }, // Email verification status
    refreshToken: {
      type: String,
      required: false,
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Changed from "user" to "User"
        default: [],
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Changed from "user" to "User"
        default: [],
      },]
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateToken = async function () {
  return await jwt.sign(
    { _id: this._id },
    process.env.JWT_SECRET_ACCESS_TOKEN,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY }
  );
};

userSchema.methods.generateRefreshToken = async function () {
  return await jwt.sign(
    { _id: this._id },
    process.env.JWT_SECRET_REFRESH_TOKEN,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY }
  );
};

export default mongoose.model("User", userSchema);

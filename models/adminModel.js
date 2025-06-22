// models/User.js
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const adminSchema = new mongoose.Schema(
  {
    name: String,
    
    email: { 
      type: String, 
      required: true, 
      unique: true },
    password: String,
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to hash password before saving to database
adminSchema.pre("save", async function (next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified("password")) return next();

  try {
    // Generate a salt with cost factor 12
    const salt = await bcrypt.genSalt(12);
    // Hash password with the salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare entered password with hashed password in database
adminSchema.methods.matchPassword = async function (enteredPassword) {
  // bcrypt.compare handles the salt extraction and secure comparison
  return await bcrypt.compare(enteredPassword, this.password);
};

adminSchema.methods.generateToken = async function () {
  return await jwt.sign(
    { _id: this._id },
    process.env.JWT_SECRET_ACCESS_TOKEN,
    { expiresIn: process.env.JWT_ACCESS_EXPIRY }
  );
};

adminSchema.methods.generateRefreshToken = async function () {
  return await jwt.sign(
    { _id: this._id },
    process.env.JWT_SECRET_REFRESH_TOKEN,
    { expiresIn: process.env.JWT_REFRESH_EXPIRY }
  );
};
export default mongoose.model("Admin", adminSchema);

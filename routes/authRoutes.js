import express from "express";
import { signup, login, sendEmailOTP, verifyEmailOTP } from "../controllers/authController.js";

const router = express.Router();

// Send OTP to email
// router.post("/send-otp", sendEmailOTP);

// Verify OTP before allowing signup
// router.post("/verify-otp", verifyEmailOTP);

// Signup (Only allowed after email verification)
router.post("/signup", signup);

// Login
router.post("/login", login);

export default router;

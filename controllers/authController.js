import userModel from "../models/userModel.js";
import { hashPasword , comparePassword} from "../utils/authUtils.js";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
// Function to generate OTP
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// Email transporter setup (use environment variables)
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send OTP to email
export const sendEmailOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ error: "Email is required" });

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // Expires in 10 min

    let user = await userModel.findOne({ email });

    if (!user) {
      user = new userModel({
        email,
        emailOTP: otp,
        emailOTPExpires: otpExpires,
      });
    } else {
      user.emailOTP = otp;
      user.emailOTPExpires = otpExpires;
    }

    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Email Verification OTP",
      text: `Your OTP for email verification is: ${otp}`,
    });

    res.json({ success: true, message: "OTP sent to email" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        success: false,
        message: "Error sending OTP",
        error: error.message,
      });
  }
};

// Verify OTP before allowing signup
export const verifyEmailOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await userModel.findOne({ email });

    if (!user || user.emailOTP !== otp || user.emailOTPExpires < new Date()) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    user.isEmailVerified = true;
    user.emailOTP = null;
    user.emailOTPExpires = null;
    await user.save();

    res.json({ success: true, message: "Email verified successfully!" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        success: false,
        message: "Error verifying OTP",
        error: error.message,
      });
  }
};

// Signup (Only after email verification)
export const signup = async (req, res) => {
  try {
    const { username, email, phoneNumber, password, gender, country, bio } =
      req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    
    // Validation
    if (
      !username ||
      !email ||
      !phoneNumber ||
      !gender ||
      !password ||
      !country ||
      !bio
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
        return res.status(400).json({
            success: false,
            message: "User already exists, please login",
        });
    }

    // Check if user exists
    // const existingUser = await userModel.findOne({ email });
    // if (!existingUser || !existingUser.isEmailVerified) {
    //   return res.status(400).json({ success: false, message: "Please verify your email first" });
    // }

    // password validation
    if (password.length < 6) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Password must be at least 6 characters long",
        });
    }

    // Hash password & create user
    const hashedPassword = await hashPasword(password);

    // new user creation

    const newUser = await new userModel({
      username,
      email,
      phoneNumber,
      password: hashedPassword,
      gender,
      country,
      bio,
    }).save();

    // Generate JWT token
    const token = jwt.sign({ _id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
   
      res.status(201).json({
        success: true,
        message: "User signed up successfully",
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        gender: newUser.gender,
        country: newUser.country,
        bio: newUser.bio,
        phoneNumber: newUser.phoneNumber,
        token,
      });
    }
   catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        success: false,
        message: "Error in signup",
        error: error.message,
      });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required",
        });
    }

    // Check user existence
    const user = await userModel.findOne({ email });
    if (!user) {
        return res.status(404).json({
            success: false,
            message: "Email not registered, please signup",
        });
    }

    // Compare password
    const match = await comparePassword(password, user.password);
    if (!match) {
        return res.status(401).json({
            success: false,
            message: "Incorrect password",
        });
    }

    // Generate JWT token
    const token = jwt.sign(
        { _id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );

    res.status(200).json({
        success: true,
        message: "User logged in successfully",
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          gender: user.gender,
          country: user.country,
          bio: user.bio,
          phoneNumber: user.phoneNumber
        },
        token,
    });
} catch (error) {
    console.error(error);
    res.status(500).json({
        success: false,
        message: "Error in login",
        error: error.message,
    });
}
};

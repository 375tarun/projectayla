import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/sendEmail.js";
import { encryptRefreshToken, generateOTP } from './../utils/encryptionAndOtp.js';
import bcrypt from 'bcrypt';


export const signup = async (req, res) => {
  try {
    const { username, email, password, gender, country, bio ,profileImg,dob} = req.body;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email."
      })
    }

    if (
      !username ||
      !gender ||
      !password ||
      !country ||
      !bio ||
      !dob
    ) {
      return res.status(400).json({ success: false, error: "All fields are required" });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists, please login",
      });
    }

    if (!/^(?=.*[A-Z])(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?/~\\-])(?=.{8,}).*$/.test(password)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Password must be at least 8 characters long and must have a special character and one capital letter",
        });
    }

    const newUser = await new userModel({
      username,
      email,
      password,
      gender,
      country,
      bio,
      profileImg,
      dob:new Date(dob),
      isEmailVerified: true
    }).save();

    const accessToken = await newUser.generateToken();
    let refreshToken = await newUser.generateRefreshToken();

    newUser.refreshToken = refreshToken;
    await newUser.save()

    refreshToken = encryptRefreshToken(refreshToken);

    res.status(201).json({
      success: true,
      message: "User signed up successfully",
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        gender: newUser.gender,
        country: newUser.country,
        bio: newUser.bio,
        profileImg: newUser.profileImg,
        isEmailVerified: newUser.isEmailVerified,
        dob: newUser.dob
      },
      token: {
        accessToken,
        refreshToken
      }
    });
  }
  catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        success: false,
        message: "Something Went Wrong. Please try again sometime later.",
      });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: "User not verified.",
      });
    }

    const match = await user.matchPassword(password);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Email or Password is not correct",
      });
    }

    const accessToken = await user.generateToken();
    let refreshToken = await user.generateRefreshToken();
    console.log(refreshToken)

    user.refreshToken = refreshToken;
    await user.save()

    refreshToken = encryptRefreshToken(refreshToken);

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
        isEmailVerified: user.isEmailVerified,
        aylaId: user.aylaId,
      },
      token: {
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Something Went Wrong. Please try again sometime later.",
    });
  }
};

export const sendOtpEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email."
      })
    }

    const user = await userModel.findOne({ email: email });

    if (user) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email."
      })
    }

    const otp = generateOTP();
    const encryptedOtp = await bcrypt.hash(otp, 10);

    const messageToSend = `Hello,\n\nYour OTP for email verification is: ${otp}\n\nPlease use this OTP to verify your email address.\n\nThank you!`;

    const result = await sendEmail({
      email: email,
      subject: "OTP for Ayla Registration.",
      message: messageToSend,
    });
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: "OTP sent to email successfully",
        otp: encryptedOtp
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Something Went Wrong. Please try again sometime later.",
    });
  }
}

export const newAccessToken = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await userModel.findOne({ _id: userId });

    const token = req.token;

    if (token !== user.refreshToken)
      return res
        .status(403)
        .json({ success: false, message: "Invalid refresh token" });

    const accesstoken = await user.generateToken();

    return res.status(200).json({
      success: true,
      message: "new access token",
      data: accesstoken,
    });
  } catch (error) {
    console.error("Error refreshing token:", error);
    return res
      .status(403)
      .json({ success: false, message: "Invalid or expired refresh token" });
  }
};
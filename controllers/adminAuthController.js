import adminModel from "../models/adminModel.js";
import jwt from "jsonwebtoken";
import { encryptRefreshToken } from './../utils/encryptionAndOtp.js';

export const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email.",
      });
    }

    if (!name || !password) {
      return res
        .status(400)
        .json({ success: false, error: "All fields are required" });
    }

    const existingUser = await adminModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "admin already exists, please login",
      });
    }

    if (
      !/^(?=.*[A-Z])(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?/~\\-])(?=.{8,}).*$/.test(
        password
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters long and must have a special character and one capital letter",
      });
    }

    const newAdmin = await new adminModel({
      name,
      email,
      password,
      role,
    }).save();

    await newAdmin.save();

    res.status(201).json({
      success: true,
      message: "User signed up successfully",
      user: {
        _id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
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

    const admin = await adminModel.findOne({ email });
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const match = await admin.matchPassword(password);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Email or Password is not correct",
      });
    }

    const accessToken = await admin.generateToken();
    let refreshToken = await admin.generateRefreshToken();
    console.log(refreshToken);

    admin.refreshToken = refreshToken;
    await admin.save();

    refreshToken = encryptRefreshToken(refreshToken);

    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
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

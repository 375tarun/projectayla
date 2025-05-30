// controllers/hashtagController.js
import Hashtag from "../models/hashtagsModel.js";
import { Post } from "../models/postModel.js";
import mongoose from "mongoose";
import pkg from 'cloudinary';
const { v2: cloudinary } = pkg;


export const createHashtag = async (req, res) => {
  try {
    const { name, description, status, hashtagImage } = req.body;

    const formattedName = name.toLowerCase().trim();

    const existingHashtag = await Hashtag.findOne({ name: formattedName });
    if (existingHashtag) {
      return res.status(400).json({
        success: false,
        message: "Hashtag already exists",
      });
    }

    let uploadedImageUrl = "";
    if (hashtagImage) {
      const uploadResult = await cloudinary.uploader.upload(hashtagImage);
      uploadedImageUrl = uploadResult.secure_url;
    }

    const hashtag = await Hashtag.create({
      name: formattedName,
      description,
      status: status || "active",
      createdBy: req.user._id,
      hashtagImage: uploadedImageUrl,
    });

    return res.status(201).json({
      success: true,
      message: "Hashtag created successfully",
      data: hashtag,
    });
  } catch (error) {
    console.error("Error creating hashtag:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create hashtag",
      error: error.message,
    });
  }
};

// Get all hashtags with pagination
export const getAllHashtags = async (req, res) => {
  try {
    const hashtags = await Hashtag.find().sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      success: true,
      count: hashtags.length,
      data: hashtags,
    });
  } catch (error) {
    console.error("Error fetching hashtags:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch hashtags",
      error: error.message,
    });
  }
};

// Get hashtag by ID
export const getHashtagById = async (req, res) => {
  try {
    const hashtag = await Hashtag.findById(req.params.id).populate(
      "createdBy",
      "name email"
    );

    if (!hashtag) {
      return res.status(404).json({
        success: false,
        message: "Hashtag not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: hashtag,
    });
  } catch (error) {
    console.error("Error fetching hashtag:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch hashtag",
      error: error.message,
    });
  }
};



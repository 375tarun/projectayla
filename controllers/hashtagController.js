import Hashtag from "../models/hashtagsModel.js";
import Post from "../models/postModel.js"; // This import doesn't seem to be used in the provided functions, consider removing if not needed elsewhere
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
      // createdBy: req.user._id,
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalHashtags = await Hashtag.countDocuments();
    const hashtags = await Hashtag.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      count: hashtags.length,
      page,
      limit,
      totalPages: Math.ceil(totalHashtags / limit),
      totalHashtags,
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

// Delete hashtag by ID
export const deleteHashtag = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid hashtag ID",
      });
    }

    // Find the hashtag to get image details before deletion
    const hashtag = await Hashtag.findById(id);
    
    if (!hashtag) {
      return res.status(404).json({
        success: false,
        message: "Hashtag not found",
      });
    }

    // If hashtag has an image, delete it from Cloudinary
    if (hashtag.hashtagImage) {
      try {
        // Extract public_id from Cloudinary URL
        const publicId = hashtag.hashtagImage.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (cloudinaryError) {
        console.error("Error deleting image from Cloudinary:", cloudinaryError);
        // Continue with hashtag deletion even if image deletion fails
      }
    }

    // Delete the hashtag
    await Hashtag.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Hashtag deleted successfully",
      data: { id: hashtag._id, name: hashtag.name },
    });
  } catch (error) {
    console.error("Error deleting hashtag:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete hashtag",
      error: error.message,
    });
  }
};
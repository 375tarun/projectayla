// controllers/hashtagController.js
import Hashtag from "../models/hashtagsModel.js";
import { Post } from "../models/postModel.js";
import mongoose from "mongoose";

// Create a new hashtag
export const createHashtag = async (req, res) => {
  try {
    const { name, description, status } = req.body;

    // Check if hashtag already exists (case insensitive)
    const existingHashtag = await Hashtag.findOne({
      name: name.toLowerCase().trim()
    });

    if (existingHashtag) {
      return res.status(400).json({
        success: false,
        message: "Hashtag already exists"
      });
    }

    // Create new hashtag
    const hashtag = await Hashtag.create({
      name: name.toLowerCase().trim(),
      description,
      status: status || "active",
      createdBy: req.user._id // Assuming req.user is set by authentication middleware
    });

    return res.status(201).json({
      success: true,
      message: "Hashtag created successfully",
      data: hashtag
    });
  } catch (error) {
    console.error("Error creating hashtag:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create hashtag",
      error: error.message
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
    const hashtag = await Hashtag.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!hashtag) {
      return res.status(404).json({
        success: false,
        message: "Hashtag not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: hashtag
    });
  } catch (error) {
    console.error("Error fetching hashtag:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch hashtag",
      error: error.message
    });
  }
};

// Update hashtag
export const updateHashtag = async (req, res) => {
  try {
    const { name, description, status } = req.body;
    const hashtagId = req.params.id;

    // Check if hashtag exists
    const hashtag = await Hashtag.findById(hashtagId);

    if (!hashtag) {
      return res.status(404).json({
        success: false,
        message: "Hashtag not found"
      });
    }

    // If name is being updated, check if it already exists
    if (name && name.toLowerCase().trim() !== hashtag.name) {
      const existingHashtag = await Hashtag.findOne({
        name: name.toLowerCase().trim(),
        _id: { $ne: hashtagId }
      });

      if (existingHashtag) {
        return res.status(400).json({
          success: false,
          message: "Hashtag name already exists"
        });
      }
    }

    // Update hashtag
    const updatedHashtag = await Hashtag.findByIdAndUpdate(
      hashtagId,
      {
        name: name ? name.toLowerCase().trim() : hashtag.name,
        description: description !== undefined ? description : hashtag.description,
        status: status || hashtag.status
      },
      { new: true }
    ).populate('createdBy', 'name email');

    return res.status(200).json({
      success: true,
      message: "Hashtag updated successfully",
      data: updatedHashtag
    });
  } catch (error) {
    console.error("Error updating hashtag:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update hashtag",
      error: error.message
    });
  }
};

// Delete hashtag
export const deleteHashtag = async (req, res) => {
  try {
    const hashtagId = req.params.id;

    // Check if hashtag exists
    const hashtag = await Hashtag.findById(hashtagId);

    if (!hashtag) {
      return res.status(404).json({
        success: false,
        message: "Hashtag not found"
      });
    }

    // Check if hashtag is used in any posts
    const postsUsingHashtag = await Post.countDocuments({ hashtags: hashtagId });

    if (postsUsingHashtag > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete hashtag as it is used in ${postsUsingHashtag} posts`
      });
    }

    // Delete hashtag
    await Hashtag.findByIdAndDelete(hashtagId);

    return res.status(200).json({
      success: true,
      message: "Hashtag deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting hashtag:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete hashtag",
      error: error.message
    });
  }
};

// Get posts by hashtag ID
export const getPostsByHashtag = async (req, res) => {
  try {
    const hashtagId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Verify hashtag exists
    const hashtag = await Hashtag.findById(hashtagId);

    if (!hashtag) {
      return res.status(404).json({
        success: false,
        message: "Hashtag not found"
      });
    }

    // Get posts using this hashtag
    const total = await Post.countDocuments({ hashtags: hashtagId });
    const posts = await Post.find({ hashtags: hashtagId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('hashtags', 'name'); // Populate hashtag details

    return res.status(200).json({
      success: true,
      data: {
        hashtag,
        posts,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error("Error fetching posts by hashtag:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch posts",
      error: error.message
    });
  }
};

// Get hashtag usage stats
export const getHashtagStats = async (req, res) => {
  try {
    // Aggregate to count posts per hashtag
    const hashtagStats = await Post.aggregate([
      { $unwind: "$hashtags" },
      {
        $group: {
          _id: "$hashtags",
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "hashtags",
          localField: "_id",
          foreignField: "_id",
          as: "hashtagDetails"
        }
      },
      { $unwind: "$hashtagDetails" },
      {
        $project: {
          _id: 1,
          count: 1,
          name: "$hashtagDetails.name",
          status: "$hashtagDetails.status"
        }
      },
      { $sort: { count: -1 } }
    ]);

    return res.status(200).json({
      success: true,
      data: hashtagStats
    });
  } catch (error) {
    console.error("Error getting hashtag stats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get hashtag statistics",
      error: error.message
    });
  }
};
import userModel from "../models/userModel.js";
import mongoose from "mongoose";

// GET all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.find().select("-password -refreshToken -__v");
    res.status(200).json({ success: true, users });
  } catch (error) {
    console.error("Error getting all users:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// GET user details by ID
export const getUserDetailsById = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ success: false, error: "Invalid user ID" });
    }

    const user = await userModel.findById(userId).select("-password -refreshToken -__v");
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// GET user's followers
export const getUserFollowersAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ success: false, error: "Invalid user ID" });
    }

    const result = await userModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "users",
          localField: "followers",
          foreignField: "_id",
          as: "followerDetails",
        },
      },
      {
        $project: {
          "followerDetails._id": 1,
          "followerDetails.username": 1,
          "followerDetails.profileImg": 1,
        },
      },
    ]);

    if (!result.length) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.status(200).json({ success: true, followers: result[0].followerDetails });
  } catch (error) {
    console.error("Error fetching followers:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// GET user's following
export const getUserFollowingAdmin = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ success: false, error: "Invalid user ID" });
    }

    const result = await userModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: "users",
          localField: "following",
          foreignField: "_id",
          as: "followingDetails",
        },
      },
      {
        $project: {
          "followingDetails._id": 1,
          "followingDetails.username": 1,
          "followingDetails.profileImg": 1,
        },
      },
    ]);

    if (!result.length) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.status(200).json({ success: true, following: result[0].followingDetails });
  } catch (error) {
    console.error("Error fetching following:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

export const updateUser = async (req, res) => {
  try {

    const { userId } = req.params

    const {
      username,
      email,
      gender,
      country,
      bio,
      profileImg,
      access
    } = req.body;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ success: false, error: "Invalid user ID" });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    let updatedProfileImg = user.profileImg;
    if (profileImg) {
      if (user.profileImg) {
        const imgId = user.profileImg.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(imgId);
      }
      const uploadedResponse = await cloudinary.uploader.upload(profileImg);
      updatedProfileImg = uploadedResponse.secure_url;
    }

    user.username = username || user.username;
    user.email = email || user.email;
    user.bio = bio || user.bio;
    user.gender = gender || user.gender;
    user.country = country || user.country;
    user.profileImg = updatedProfileImg;
    user.access = access || user.access;

    await user.save();

    const { password, ...updatedUser } = user.toObject();

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });

  } catch (error) {
    console.error("Error in updateUser:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await userModel.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete User Error:', error.message);
    return res.status(500).json({ message: 'Server error while deleting user' });
  }
};

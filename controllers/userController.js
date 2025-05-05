import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import userModel from "../models/userModel.js";
import mongoose from "mongoose";

export const getUserProfile = async (req, res) => {
  try {
    const { _id: userId } = req.user;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ success: false, error: "Invalid user ID" });
    }

    const user = await userModel.findById(userId).select("-password -refreshToken -__v");

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    return res.status(200).json({
      success: true,
      message: "User profile retrieved successfully",
      user,
    });
  } catch (error) {
    console.error("Error in getUserProfile controller:", error);
    return res.status(500).json({
      success: false,
      error: "Something went wrong, please try again later.",
    });
  }
};

export const followUnfollowUser = async (req, res) => {
  try {
    const { _id: userId } = req.user; 
    const { targetId } = req.params; 

    if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(targetId)) {
      return res.status(400).json({ error: "Invalid user ID or target ID" });
    }

    if (userId === targetId) {
      return res.status(400).json({ error: "You can't follow/unfollow yourself" });
    }

    const [targetUser, currentUser] = await Promise.all([
      userModel.findById(targetId),
      userModel.findById(userId),
    ]);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const isFollowing = targetUser.followers.includes(userId);
    const updateAction = isFollowing ? "$pull" : "$push";

    await Promise.all([
      userModel.findByIdAndUpdate(targetId, { [updateAction]: { followers: userId } }),
      userModel.findByIdAndUpdate(userId, { [updateAction]: { following: targetId } }),
    ]);

    res.status(200).json({ 
      success: true, 
      message: isFollowing ? "User unfollowed successfully" : "User followed successfully" 
    });

  } catch (error) {
    console.error("Error in followUnfollowUser controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { _id: userId } = req.user;
    const {
      username,
      email,
      gender,
      country,
      currentPassword,
      newPassword,
      bio,
      profileImg
    } = req.body;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ success: false, error: "Invalid user ID" });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    if (currentPassword || newPassword) {
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: "Please provide both current password and new password",
        });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, error: "Incorrect current password" });
      }

      const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

      if (!strongPasswordRegex.test(newPassword)) {
        return res.status(400).json({
          success: false,
          error: "Password must be at least 6 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.",
        });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
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



export const getUserFollowers = async (req, res) => {
  try {
    const { _id: userId } = req.user;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ success: false, error: "Invalid user ID" });
    }

    const userFollowers = await userModel.aggregate([
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
          _id: 0, 
          "followerDetails._id": 1,
          "followerDetails.username": 1,
          "followerDetails.profileImg": 1, 
        },
      },
    ]);

    if (!userFollowers.length) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    return res.status(200).json({
      success: true,
      message: "User followers retrieved successfully",
      followers: userFollowers[0].followerDetails,
    });

  } catch (error) {
    console.error("Error in getUserFollowers:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};


export const getUserFollowing = async (req, res) => {
  try {
    const { _id: userId } = req.user;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ success: false, error: "Invalid user ID" });
    }

    const userFollowing = await userModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(userId) } }, 
      {
        $lookup: {
          from: "users", 
          localField: "following", // Change from "followers" to "following"
          foreignField: "_id", 
          as: "followingDetails", 
        },
      },
      {
        $project: {
          _id: 0, 
          "followingDetails._id": 1,
          "followingDetails.username": 1,
          "followingDetails.profileImg": 1, 
        },
      },
    ]);

    if (!userFollowing.length) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    return res.status(200).json({
      success: true,
      message: "User following retrieved successfully",
      following: userFollowing[0].followingDetails,
    });

  } catch (error) {
    console.error("Error in getUserFollowing:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

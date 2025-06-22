import userModel from "../models/userModel.js";
import mongoose from "mongoose";


export const blockUser = async (req, res) => { 
  try {
    const { userId } = req.params;
    const { _id: currentUserId } = req.user;

    if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(currentUserId)) {
      return res.status(400).json({ success: false, error: "Invalid user ID" });
    }

    if (userId === currentUserId.toString()) {
      return res.status(400).json({ success: false, error: "You cannot block yourself" });
    }

    const userToBlock = await userModel.findById(userId);
    if (!userToBlock) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const currentUser = await userModel.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ success: false, error: "Current user not found" });
    }   
    // Check if the user is already blocked
    if (currentUser.blockedUsers.includes(userId)) {
      return res.status(400).json({ success: false, error: "User is already blocked" });
    }

    currentUser.blockedUsers.push(userId);
    await currentUser.save();

    res.status(200).json({ success: true, message: "User blocked successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

export  const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { _id: currentUserId } = req.user;

    if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(currentUserId)) {
      return res.status(400).json({ success: false, error: "Invalid user ID" });
    }

    if (userId === currentUserId.toString()) {
      return res.status(400).json({ success: false, error: "You cannot unblock yourself" });
    }

    const userToUnblock = await userModel.findById(userId);
    if (!userToUnblock) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const currentUser = await userModel.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ success: false, error: "Current user not found" });
    }

    // Check if the user is already blocked
    if (!currentUser.blockedUsers.includes(userId)) {
      return res.status(400).json({ success: false, error: "User is not blocked" });
    }

    currentUser.blockedUsers.pull(userId);
    await currentUser.save();

    res.status(200).json({ success: true, message: "User unblocked successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};


export const getBlockedUsers = async (req, res) => {
  try {
    const { _id: userId } = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ success: false, error: "Invalid user ID" });
    }

    const user = await userModel
      .findById(userId)
      .populate("blockedUsers", "username profileImg gender id");

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const total = user.blockedUsers.length;
    const startIndex = (page - 1) * limit;
    const paginated = user.blockedUsers.slice(startIndex, startIndex + limit);

      const blockedUsers = paginated.map(({ _id, username, profileImg, gender }) => ({
      id: _id,
      username,
      profileImg,
      gender,
    }));

    res.status(200).json({
      success: true,
      message: "Blocked users retrieved successfully",
      blockedUsers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Something went wrong" });
  }
};

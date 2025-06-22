import userModel from "../models/userModel.js";
import Notice from "../models/noticeModel.js";

// Send notice to all users
export const sendNoticeToAll = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message)
      return res
        .status(400)
        .json({ success: false, message: "Message is required." });
    const users = await userModel.find({}, "_id");
    const recipientIds = users.map((u) => u._id);
    const notice = await Notice.create({
      content: message,
      type: "all",
      recipients: recipientIds,
    });
    res
      .status(200)
      .json({ success: true, message: `Notice sent to all users.`, notice });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to send notice to all users.",
      error: error.message,
    });
  }
};

// Send notice to a specific user
export const sendNoticeToUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { message } = req.body;
    if (!message)
      return res
        .status(400)
        .json({ success: false, message: "Message is required." });
    const user = await userModel.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    const notice = await Notice.create({
      content: message,
      type: "specific",
      recipients: [userId],
    });
    res.status(200).json({
      success: true,
      message: `Notice sent to user ${userId}.`,
      notice,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to send notice to user.",
      error: error.message,
    });
  }
};

// Send notice to a group of users
export const sendNoticeToGroup = async (req, res) => {
  try {
    const { userIds, message } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "userIds array is required." });
    }
    if (!message)
      return res
        .status(400)
        .json({ success: false, message: "Message is required." });
    const users = await userModel.find({ _id: { $in: userIds } });
    if (users.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "No users found in group." });
    const notice = await Notice.create({
      content: message,
      type: "group",
      recipients: userIds,
    });
    res
      .status(200)
      .json({ success: true, message: `Notice sent to group.`, notice });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to send notice to group.",
      error: error.message,
    });
  }
};

// Get all notices
export const getAllNotices = async (req, res) => {
  try {
    const notices = await Notice.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, notices });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch notices.",
      error: error.message,
    });
  }
};

// Get notices for a specific user
export const getUserNotices = async (req, res) => {
  try {
    const { userId } = req.params;
    const notices = await Notice.find({ recipients: userId }).sort({
      createdAt: -1,
    });
    res.status(200).json({ success: true, notices });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user notices.",
      error: error.message,
    });
  }
};

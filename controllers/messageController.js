import messageModel from "../models/messageModel.js";

export const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const { _id: currentUserId } = req.user;

    const messages = await messageModel
      .find({
        $or: [
          { sender: currentUserId, receiver: userId },
          { sender: userId, receiver: currentUserId },
        ],
      })
      .sort("timestamp");
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to load messages" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { to, content } = req.body;
    const { _id: from } = req.user;
    console.log(from);
    if (!from) {
      return res
        .status(400)
        .json({ success: false, error: "User ID is required" });
    }
    if (!to) {
      return res
        .status(400)
        .json({ success: false, error: "User ID is required" });
    }
    const message = await messageModel.create({
      sender: from,
      receiver: to,
      content,
    });
    res.status(201).json(message);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Message sending failed" });
  }
};

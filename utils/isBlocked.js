import userModel from "../models/userModel.js";
import mongoose from "mongoose";

export const isBlocked = async (senderId, receiverId) => {
  if (!mongoose.isValidObjectId(senderId) || !mongoose.isValidObjectId(receiverId)) {
    throw new Error("Invalid user ID(s)");
  }

  const [sender, receiver] = await Promise.all([
    userModel.findById(senderId, "blockedUsers"),
    userModel.findById(receiverId, "blockedUsers")
  ]);

  if (!receiver) throw new Error("Receiver not found");

  const isSenderBlocked = sender.blockedUsers.includes(receiver._id);
  const isReceiverBlocked = receiver.blockedUsers.includes(sender._id);

  if (isSenderBlocked || isReceiverBlocked) throw new Error("User is blocked");
};

export default isBlocked;
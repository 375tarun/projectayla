import messageModel from '../models/messageModel.js';
import mongoose from 'mongoose';

// GET /api/messages
export const getMessages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const filter = req.query.filter || 'all';

    const query = {};

    if (search) {
      query.$or = [
        { content: { $regex: search, $options: 'i' } },
        { 'sender.username': { $regex: search, $options: 'i' } },
        { 'receiver.username': { $regex: search, $options: 'i' } }
      ];
    }

    if (filter === 'unread') query.isRead = false;
    if (filter === 'deleted') query.isDeleted = true;
    if (filter === 'media') query.messageType = { $in: ['image', 'voice', 'file', 'asset'] };
    if (!['all', 'unread', 'deleted', 'media'].includes(filter)) {
      query.messageType = filter;
    }

    const totalMessages = await messageModel.countDocuments(query);
    const totalPages = Math.ceil(totalMessages / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const messages = await messageModel.find(query)
      .populate('sender', 'username profileImg')
      .populate('receiver', 'username profileImg')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      messages,
      currentPage: page,
      totalPages,
      totalMessages,
      limit,
      hasNextPage,
      hasPrevPage
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE /api/messages/:id
export const deleteMessage = async (req, res) => {
  try {
    const messageId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ success: false, error: 'Invalid message ID' });
    }

    const message = await messageModel.findById(messageId);

    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully',
      messageId: message._id
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

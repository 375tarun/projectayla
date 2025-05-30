// messageController.js
import jwt from 'jsonwebtoken';
import messageModel from '../models/messageModel.js';
import pkg from 'cloudinary';

import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const { v2: cloudinary } = pkg;
// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer with Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'chat-media',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp3', 'wav', 'ogg', 'webm', 'mp4'],
    resource_type: 'auto', // Automatically detect file type
  },
});

export const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5000 * 1024 , // 500KB limit
  }
});

// Middleware to verify JWT token
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET_ACCESS_TOKEN, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Send text message
export const sendTextMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user._id;

    if (!receiverId || !content) {
      return res.status(400).json({ error: 'Receiver ID and content are required' });
    }

    const message = await messageModel.create({
      sender: senderId,
      receiver: receiverId,
      content,
      messageType: 'text'
    });

    // Emit to socket if available
    if (req.io) {
      const roomId = generateRoomId(senderId, receiverId);
      req.io.to(roomId).emit('receive_message', message);
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Error sending text message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Send image message
export const sendImageMessage = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user._id;

    if (!receiverId) {
      return res.status(400).json({ error: 'Receiver ID is required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const message = await messageModel.create({
      sender: senderId,
      receiver: receiverId,
      content: req.file.path, // Cloudinary URL
      messageType: 'image',
      mediaUrl: req.file.path,
      mediaPublicId: req.file.filename
    });

    // Emit to socket if available
    if (req.io) {
      const roomId = generateRoomId(senderId, receiverId);
      req.io.to(roomId).emit('receive_message', message);
    }

    res.status(201).json({
      success: true,
      message: 'Image sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Error sending image:', error);
    res.status(500).json({ error: 'Failed to send image' });
  }
};

// Send voice message
export const sendVoiceMessage = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user._id;

    if (!receiverId) {
      return res.status(400).json({ error: 'Receiver ID is required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Voice file is required' });
    }

    const message = await messageModel.create({
      sender: senderId,
      receiver: receiverId,
      content: 'Voice message', // Default content for voice messages
      messageType: 'voice',
      mediaUrl: req.file.path,
      mediaPublicId: req.file.filename
    });

    // Emit to socket if available
    if (req.io) {
      const roomId = generateRoomId(senderId, receiverId);
      req.io.to(roomId).emit('receive_message', message);
    }

    res.status(201).json({
      success: true,
      message: 'Voice message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Error sending voice message:', error);
    res.status(500).json({ error: 'Failed to send voice message' });
  }
};

// Get chat messages between two users
export const getChatMessages = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const messages = await messageModel
      .find({
        $or: [
          { sender: userId, receiver: otherUserId },
          { sender: otherUserId, receiver: userId }
        ]
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name email avatar')
      .populate('receiver', 'name email avatar');

    res.status(200).json({
      success: true,
      data: messages.reverse(),
      pagination: {
        page,
        limit,
        hasMore: messages.length === limit
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

// Delete message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await messageModel.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.sender.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }

    // Delete media from Cloudinary if exists
    if (message.mediaPublicId) {
      await cloudinary.uploader.destroy(message.mediaPublicId);
    }

    await messageModel.findByIdAndDelete(messageId);

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
};

// Utility function to generate room ID
function generateRoomId(userA, userB) {
  return [userA, userB].sort().join('_');
}

// Enhanced Socket Handler
export const socketHandler = (io) => {
  // JWT Authentication middleware for socket
  io.use((socket, next) => {
    const authHeader = socket.handshake.headers['authorization'];
    if (!authHeader) return next(new Error('No token provided'));
    
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET_ACCESS_TOKEN, (err, user) => {
      if (err) return next(new Error('Invalid token'));
      socket.user = user;
      next();
    });
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id;
    console.log(`User ${userId} connected`);

    // Join chat room
    socket.on('join_chat', ({ otherUserId }) => {
      const roomId = generateRoomId(userId, otherUserId);
      socket.join(roomId);
      console.log(`User ${userId} joined room ${roomId}`);
    });

    // Handle text message via socket
    socket.on('send_message', async ({ to, content, messageType = 'text' }) => {
      try {
        const message = await messageModel.create({
          sender: userId,
          receiver: to,
          content,
          messageType
        });

        const populatedMessage = await messageModel
          .findById(message._id)
          .populate('sender', 'name email avatar')
          .populate('receiver', 'name email avatar');

        const roomId = generateRoomId(userId, to);
        io.to(roomId).emit('receive_message', populatedMessage);
      } catch (error) {
        socket.emit('message_error', { error: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', ({ otherUserId }) => {
      const roomId = generateRoomId(userId, otherUserId);
      socket.to(roomId).emit('user_typing', { userId, typing: true });
    });

    socket.on('typing_stop', ({ otherUserId }) => {
      const roomId = generateRoomId(userId, otherUserId);
      socket.to(roomId).emit('user_typing', { userId, typing: false });
    });

    // Handle message read status
    socket.on('mark_as_read', async ({ messageId }) => {
      try {
        await messageModel.findByIdAndUpdate(messageId, { 
          isRead: true, 
          readAt: new Date() 
        });
        socket.emit('message_read', { messageId });
      } catch (error) {
        socket.emit('read_error', { error: 'Failed to mark as read' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`User ${userId} disconnected`);
    });
  });
};
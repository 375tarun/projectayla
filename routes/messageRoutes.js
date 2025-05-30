// routes/messageRoutes.js
import express from 'express';
import {
  sendTextMessage,
  sendImageMessage,
  sendVoiceMessage,
  getChatMessages,
  deleteMessage,
  verifyToken,
  upload
} from '../controllers/messageController.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Text message route
router.post('/send/text', sendTextMessage);

// Image message route
router.post('/send/image', upload.single('image'), sendImageMessage);

// Voice message route
router.post('/send/voice', upload.single('voice'), sendVoiceMessage);

// Get chat messages between two users
router.get('/chat/:otherUserId', getChatMessages);

// Delete message
router.delete('/:messageId', deleteMessage);

export default router;

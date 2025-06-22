// routes/messageRoutes.js
import express from 'express';
import {
  sendTextMessage,
  sendImageMessage,
  sendVoiceMessage,
  getChatMessages,
  deleteMessage,sendAssetMessage,
  verifyToken,
  upload,
  getConversationRecipients,
getMutualFollowers
} from '../controllers/messageController.js';
import { authCheck } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Text message route
router.post('/send/text', authCheck,sendTextMessage);

// Image message route
router.post('/send/image', authCheck, upload.single('image'), sendImageMessage);

// Voice message route
router.post('/send/voice', authCheck, upload.single('voice'), sendVoiceMessage);

// Get chat messages between two users
router.get('/chat/:otherUserId', authCheck, getChatMessages);

// Delete message
router.delete('/:messageId', authCheck, deleteMessage);

router.post('/send-asset', authCheck, sendAssetMessage);

router.get('/user/conversations', authCheck, getConversationRecipients);
router.get('/user/mutual-followers', authCheck, getMutualFollowers);



export default router;

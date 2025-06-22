import express from 'express';
// You will need to implement these controllers in controllers/noticeController.js
import {
  sendNoticeToAll,
  sendNoticeToUser,
  sendNoticeToGroup,
  getAllNotices,
  getUserNotices
} from '../controllers/noticeController.js';

const router = express.Router();

// Send notice to all users
router.post('/all', sendNoticeToAll);

// Send notice to a specific user (expects userId in params)
router.post('/user/:userId', sendNoticeToUser);

// Send notice to a group of users (expects userIds array in body)
router.post('/group', sendNoticeToGroup);

// Get all notices
router.get('/all', getAllNotices);

// Get notices for a specific user
router.get('/user/:userId', getUserNotices);

export default router;

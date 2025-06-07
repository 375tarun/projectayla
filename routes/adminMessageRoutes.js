import express from 'express';
import { getMessages, deleteMessage } from '../controllers/adminMessageController.js';

const router = express.Router();

router.get('/messages', getMessages);
router.delete('/messages/:id', deleteMessage);

export default router;

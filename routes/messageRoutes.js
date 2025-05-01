import express from 'express';
import { getMessages, sendMessage } from '../controllers/messageController.js';
import { authCheck } from "../middlewares/auth.Middleware.js"; // use access token-based check

const router = express.Router();

router.post("/", authCheck, sendMessage);
router.get("/:userId", authCheck, getMessages);
export default router;

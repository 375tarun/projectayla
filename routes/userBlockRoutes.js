 import express from 'express';
import { blockUser, unblockUser, getBlockedUsers } from '../controllers/userBlockController.js';
import { authCheck } from '../middlewares/auth.middleware.js';  

const router = express.Router();

router.post('/:userId',authCheck, blockUser);
router.post('/unblock/:userId',authCheck, unblockUser);
router.get('/blocked',authCheck, getBlockedUsers);

export default router;

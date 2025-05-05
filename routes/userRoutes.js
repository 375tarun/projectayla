import express from "express";
import { getUserProfile,followUnfollowUser, updateUser, getUserFollowers, getUserFollowing } from "../controllers/userController.js";
import { authCheck } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get("/profile",authCheck,getUserProfile)
router.post("/followUnfollow",authCheck,followUnfollowUser)
router.put("/update",authCheck,updateUser)
router.get("/followers",authCheck,getUserFollowers)
router.get("/following",authCheck,getUserFollowing)

export default router;
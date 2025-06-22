import express from "express";
import { getUserProfile,followUnfollowUser, updateUser, getUserFollowers, getUserFollowing,searchUser } from "../controllers/userController.js";
import { authCheck } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get("/profile",authCheck,getUserProfile)
router.post("/followUnfollow/:targetId",authCheck,followUnfollowUser)
router.put("/update",authCheck,updateUser)
router.get("/followers",authCheck,getUserFollowers)
router.get("/following",authCheck,getUserFollowing)
router.get("/search/:username", authCheck, searchUser)

export default router;
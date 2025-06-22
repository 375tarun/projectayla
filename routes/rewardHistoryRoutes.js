// routes/rewardRoutes.js
import express from "express";
import { getRewardHistory,getRewardFAQ } from "../controllers/rewardHistoryController.js";
const router = express.Router();

router.get("/:aylaId/history", getRewardHistory);
router.get("/faq", getRewardFAQ);

export default router;

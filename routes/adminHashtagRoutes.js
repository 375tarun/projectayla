// routes/hashtagRoutes.js
import express from "express";
import {
    createHashtag,
    getAllHashtags,
    getHashtagById,
    updateHashtag,
    deleteHashtag,
    getPostsByHashtag,
    getHashtagStats
} from "../controllers/hashtagController.js";
import { authCheck } from "../middlewares/adminAuth.middleware.js";

const router = express.Router();

router.post("/", authCheck, createHashtag);
router.get("/", authCheck, getAllHashtags);
router.get("/stats", authCheck, getHashtagStats);
router.get("/:id", authCheck, getHashtagById);
router.put("/:id", authCheck, updateHashtag);
router.delete("/:id", authCheck, deleteHashtag);
router.get("/:id/posts", authCheck, getPostsByHashtag);

export default router;
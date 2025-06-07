// routes/hashtagRoutes.js
import express from "express";
import { 
  createHashtag, 
  getAllHashtags, 
  getHashtagById,
  deleteHashtag
} from "../controllers/hashtagController.js";
import { authCheck } from '../middlewares/auth.middleware.js';
const router = express.Router();

router.post("/", createHashtag);
router.get("/", getAllHashtags);
// router.get("/stats", getHashtagStats);
router.get("/:id", getHashtagById);
// router.put("/:id", updateHashtag);
router.delete("/:id", deleteHashtag);
// router.get("/:id/posts",, getPostsByHashtag);

export default router;
import express from "express";
import {
  commentOnPost,
  createPost,
  getUserPost,
  deletePost,
  likeUnlikePost,
  getAllPost,
  editPost,
  getCommentsByPost,
  getHashtagWithPosts,
  getPopularHashtags,
} from "../controllers/postController.js";
import { authCheck } from "../middlewares/auth.middleware.js";
import { checkAccess } from "./../middlewares/auth.middleware.js";


const router = express.Router();

router.get("/", authCheck, checkAccess, getAllPost);
router.get("/userpost", authCheck, checkAccess, getUserPost);
router.post("/create", authCheck, checkAccess, createPost);
router.post("/like/:id", authCheck, checkAccess, likeUnlikePost);
router.post("/comment/:id", authCheck, checkAccess, commentOnPost);
router.get("/post-comments/:id", authCheck, checkAccess, getCommentsByPost);

router.delete("/delete/:id", authCheck, checkAccess, deletePost);
router.post("/edit/:id", authCheck, checkAccess, editPost);

router.get(
  "/getHashtag/:hashtagId",
  authCheck,
  checkAccess,
  getHashtagWithPosts
);
router.get("/getPopularHashtags", authCheck, checkAccess, getPopularHashtags);

export default router;

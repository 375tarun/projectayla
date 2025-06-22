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
  getPopularHashtags,getAllHashtags
} from "../controllers/postController.js";
import { authCheck } from "../middlewares/auth.middleware.js";
// import  } from "./../middlewares/auth.middleware.js";


const router = express.Router();

router.get("/", authCheck, getAllPost);
router.get("/userpost", authCheck, getUserPost);
router.post("/create", authCheck, createPost);
router.post("/like/:id", authCheck, likeUnlikePost);
router.post("/comment/:id", authCheck, commentOnPost);
router.get("/post-comments/:id", authCheck, getCommentsByPost);

router.delete("/delete/:id", authCheck, deletePost);
router.post("/edit/:id", authCheck, editPost);

router.get("/getHashtag/:hashtagId",authCheck,getHashtagWithPosts);
router.get("/getPopularHashtags", authCheck, getPopularHashtags);
router.get("/getAllHashtags", authCheck, getAllHashtags);

export default router;

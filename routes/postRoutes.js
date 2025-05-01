import express from 'express';
import { commentOnPost, createPost, deletePost, likeUnlikePost, getAllPost, editPost, getCommentsByPost } from '../controllers/postController.js'
import { authCheck } from '../middlewares/auth.middleware.js';

const router = express.Router();


router.get("/", authCheck,getAllPost);
router.post("/create", authCheck, createPost);
router.get("/like/:id",authCheck, likeUnlikePost);
router.post("/comment/:id", authCheck, commentOnPost);
router.get("/post-comments/:id", authCheck, getCommentsByPost);

router.delete("/delete/:id",authCheck, deletePost);
router.post("/edit/:id", authCheck,editPost);


export default router

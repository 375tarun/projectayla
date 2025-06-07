import express from 'express';
import {
  getAllPosts,
  getPostById,
  createPost,
  updatePostById,
  deletePostById,
  getAllHashtags
} from '../controllers/adminPostController.js';

const router = express.Router();

// CRUD Routes
router.get('/posts', getAllPosts);
router.get('/posts/:id', getPostById);
router.post('/posts', createPost);
router.put('/posts/:id', updatePostById);
router.delete('/posts/:id', deletePostById);

// Hashtag Route
router.get('/hashtags', getAllHashtags);

export default router;

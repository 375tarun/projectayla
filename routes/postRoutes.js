import  express  from 'express';
import {commentOnPost,createPost,deletePost,likeUnlikePost,getAllPost, editPost} from '../controllers/postController.js'

const router = express.Router();


router.post("/create",createPost);
router.delete("/delete/:id",deletePost);
router.post("/edit/:id",editPost);
router.post("/like/:id",likeUnlikePost);
router.post("/comment/:id",commentOnPost);
router.get("/",getAllPost);



export default router

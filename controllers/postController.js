import userModel from "../models/userModel.js";
import { Post } from "../models/postModel.js";
import { v2 as cloudinary } from "cloudinary";

export const createPost = async (req, res) => {
  try {
    const { text, userId } = req.body;
    let { img } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const user = await userModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!text && !img) {
      return res.status(400).json({ error: "Post must have text or an image" });
    }

    if (img) {
      const uploadedResponse = await cloudinary.uploader.upload(img);
      img = uploadedResponse.secure_url;
    }

    const newPost = new Post({
      user: userId,
      text,
      img,
    });

    await newPost.save();
    res.status(201).json(newPost);
  } catch (error) {
    console.error("Error in createPost controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


export const deletePost = async (req, res) => {
  try {
    const { userId } = req.body; 

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }


    if (post.user.toString() !== userId) {
      return res
        .status(401)
        .json({ error: "You are not authorized to delete this post" });
    }


    if (post.img) {
      const imgId = post.img.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(imgId);
    }

    await Post.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error in deletePost controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const editPost = async (req, res) => {
  try {
    const { userId, text, img } = req.body; 
    const { id: postId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }


    if (post.user.toString() !== userId) {
      return res.status(401).json({ error: "You are not authorized to edit this post" });
    }

   
    if (text) {
      post.text = text;
    }

    if (img) {
      if (post.img) {
        const imgId = post.img.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(imgId);
      }
      const uploadedResponse = await cloudinary.uploader.upload(img);
      post.img = uploadedResponse.secure_url;
    }

    await post.save();

    res.status(200).json({ message: "Post updated successfully", post });
  } catch (error) {
    console.error("Error in editPost controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


export const likeUnlikePost = async(req,res)=>{

}

export const commentOnPost = async (req, res) => {
  try {
    const { text, userId } = req.body; // Get userId from request body
    const postId = req.params.id;

    if (!text) {
      return res.status(400).json({ error: "Text field is required" });
    }

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const comment = { user: userId, text };
    post.comments.push(comment);
    await post.save();

    res.status(200).json(post);
  } catch (error) {
    console.error("Error in commentOnPost controller:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllPost =async (req,res)=>{
    try {
      const posts = await Post.find()
      .sort({createdAt:-1})
      .populate(
        {path:"user",
          select:"-password",
      })
      .populate({
        path:"comments.user",
        select:"-password",
      });
      if(posts.length == 0){
        return res.status(200).json([]);
      }
      res.status(200).json(posts)
    } catch (error) {
      console.log("error in allPost controller:", error);
      res.status(500).json({ error: "internal server error" });
    }
  }
  

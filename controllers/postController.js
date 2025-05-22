import userModel from "../models/userModel.js";
import hashtagsModel from "../models/hashtagsModel.js";
import { Post } from "../models/postModel.js";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import { Comment } from "../models/commentModel.js";

export const getAllPost = async (req, res) => {
  try {
    const { _id: userId } = req.user;
    const { type, page = 1, limit = 10 } = req.body;

    const typeSet = new Set(["follow", "popular", "latest"]);

    if (!typeSet.has(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Post Type.",
      });
    }

    const currentUser = await userModel
      .findById(userId)
      .select("_id following");

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User does not exists.",
      });
    }

    let pipeline = [];

    if (type === "follow") {
      pipeline.push({
        $match: {
          user: { $in: currentUser.following },
        },
      });
    }

    pipeline.push(
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "users",
          pipeline: [
            {
              $project: {
                _id: 1,
                username: 1,
                profileImg: 1,
                gender: 1,
              },
            },
          ],
        },
      },
      { $unwind: "$users" },
      {
        $lookup:{
          from: "hashtags",
          localField: "hashtags",
          foreignField: "_id",
          as: "hashtags",
          pipeline: [
            {
              $project: {
                _id: 0,
                hashTagId: "$_id",
                name:1
              }
            }
          ]
        }
      },
      {
        $addFields: {
          noOfLikes: { $size: "$likes" },
          isLiked: { $in: [userId, "$likes"] },
          isMyPost: { $eq: ["$user", new mongoose.Types.ObjectId(userId)] },
        },
      },
      {
        $project: {
          _id: 1,
          isMyPost: 1,
          noOfLikes: 1,
          img: 1,
          username: "$users.username",
          profileImg: "$users.profileImg",
          gender: "$users.gender",
          isLiked: 1,
          text: 1,
          createdAt: 1,
          hashtags: 1
        },
      }
    );

    if (type === "popular") {
      pipeline.push({ $sort: { createdAt: -1, noOfLikes: -1 } });
    } else if (type === "latest") {
      pipeline.push({ $sort: { createdAt: -1 } });
    } else if (type === "follow") {
      pipeline.push({ $sort: { createdAt: -1, noOfLikes: -1 } });
    }

    const skip = (page - 1) * limit;
    pipeline.push({ $skip: skip }, { $limit: limit });

    const feedPosts = await Post.aggregate(pipeline);

    return res.status(200).json({
      success: true,
      message: "posts fetched successfully",
      data: feedPosts,
      totalPages: Math.ceil(feedPosts / limit),
      currentPage: page,
    });
  } catch (error) {
    console.log("error in allPost controller:", error);
    res.status(500).json({ error: "internal server error" });
  }
};

export const createPost = async (req, res) => {
  try {
    const { _id: userId } = req.user;
    const { text, hashtags = [], img = [] } = req.body; // img as array

    if (!userId) {
      return res.status(400).json({ success: false, error: "User ID is required" });
    }
    const existingHashtags = await hashtagsModel.find({ name: { $in: hashtags } }).select("_id");
    if (existingHashtags.length !== hashtags.length) {
      return res.status(400).json({ error: "One or more hashtags are invalid." });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Check for at least one content type
    if (!text && (!img || img.length === 0)) {
      return res.status(400).json({ success: false, error: "Post must have text or at least one image" });
    }

    let uploadedImages = [];

    // Upload images if provided
    if (img.length > 0) {
      if (!Array.isArray(img)) {
        return res.status(400).json({ success: false, error: "Images must be an array" });
      }

      for (let i = 0; i < img.length; i++) {
        const uploadedResponse = await cloudinary.uploader.upload(img[i]);
        uploadedImages.push(uploadedResponse.secure_url);
      }
    }

    const newPost = new Post({
      user: userId,
      text,
      img: uploadedImages, // array of URLs
      hashtags: existingHashtags,
    });

    await newPost.save();

    res.status(201).json({ success: true, message: "Post Created Successfully" });
  } catch (error) {
    console.error("Error in createPost controller:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};


export const likeUnlikePost = async (req, res) => {
  try {
    const { _id: userId } = req.user;
    const { id: postId } = req.params;

    const [user, post] = await Promise.all([
      userModel.findById(userId).select("_id"),
      Post.findById(postId).select("_id likes"),
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    const userLikedPost = post.likes.includes(userId);
    let message, updatedLikes;

    if (userLikedPost) {
      const updateResult = await Post.updateOne(
        { _id: postId },
        { $pull: { likes: userId } }
      );

      if (updateResult.modifiedCount > 0) {
        const updatedPost = await Post.findById(postId).select("likes");
        updatedLikes = updatedPost.likes.length;
        message = "Post unliked";
      } else {
        return res.status(500).json({
          success: false,
          message: "Failed to unlike post.",
        });
      }
    } else {
      post.likes.push(userId);
      await post.save();
      updatedLikes = post.likes.length;
      message = "Post liked";
    }

    return res.status(200).json({
      success: true,
      message: message,
      updatedLikes: updatedLikes,
    });
  } catch (error) {
    console.error("Error in likeUnlikePost controller:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const commentOnPost = async (req, res) => {
  try {
    const { text } = req.body;
    const postId = req.params.id;
    const { _id: userId } = req.user;

    if (!text) {
      return res
        .status(400)
        .json({ success: false, message: "Text field is required" });
    }

    const [user, post] = await Promise.all([
      userModel.findById(userId).select("_id"),
      Post.findById(postId).select("_id"),
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    await new Comment({
      userId: user._id,
      text,
      postId: post._id,
    }).save();

    res.status(201).json({ success: true, message: "Commented successfully." });
  } catch (error) {
    console.error("Error in commentOnPost controller:", error);
    return res.status(500).json({
      success: false,
      message: "Something Went Wrong. Please try again sometime later.",
    });
  }
};

export const getCommentsByPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { _id: userId } = req.user;
    const { page = 1, limit = 10 } = req.body;

    const [user, post] = await Promise.all([
      userModel.findById(userId).select("_id"),
      Post.findById(postId).select("_id"),
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    const skip = (page - 1) * limit;

    const comments = await Comment.aggregate([
      {
        $match: {
          postId: post._id,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "users",
          pipeline: [
            {
              $project: {
                _id: 1,
                username: 1,
                profileImg: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: "$users",
      },
      {
        $addFields: {
          currentUser: {
            $eq: ["$userId", user._id],
          },
        },
      },
      {
        $project: {
          _id: 1,
          username: "$users.username",
          profileImg: "$users.profileImg",
          text: 1,
          createdAt: 1,
          currentUser: 1,
        },
      },
      {
        $sort: {
          createdAt: -1,
          currentUser: -1,
        },
      },
      { $skip: skip },
      { $limit: limit },
    ]);

    res.status(200).json({
      success: true,
      message: "Comments fetched successfully",
      data: comments,
      totalComment: comments.length,
      totalPages: Math.ceil(comments.length / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error in commentOnPost controller:", error);
    return res.status(500).json({
      success: false,
      message: "Something Went Wrong. Please try again sometime later.",
    });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { _id: userId } = req.user;
    const { id: postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }
    if (post.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized: You can only delete your own posts.",
      });
    }

    try {
      if (post.img) {
        const imgId = post.img.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(imgId);
      }
    } catch (cloudError) {
      console.error("Error deleting image from Cloudinary:", cloudError);
    }

    await Post.findByIdAndDelete(postId);

    return res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Error in deletePost controller:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
};

export const editPost = async (req, res) => {
  try {
    const { _id: userId } = req.user; 
    const { text, img } = req.body;
    const { id: postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, error: "Post not found" });
    }

    if (post.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: "Unauthorized: You can only edit your own posts.",
      });
    }

    if (text) {
      post.text = text;
    }

    if (img) {
      try {
        if (post.img) {
          const imgId = post.img.split("/").pop().split(".")[0];
          await cloudinary.uploader.destroy(imgId);
        }
        const uploadedResponse = await cloudinary.uploader.upload(img);
        post.img = uploadedResponse.secure_url;
      } catch (cloudError) {
        console.error("Error uploading image to Cloudinary:", cloudError);
        return res
          .status(500)
          .json({ success: false, error: "Image upload failed" });
      }
    }

    await post.save();

    return res.status(200).json({
      success: true,
      message: "Post updated successfully",
      post,
    });
  } catch (error) {
    console.error("Error in editPost controller:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
};

export const getUserPost = async (req,res)=>{
  try {
    const {_id:userid}=req.user;
     
    const existuser = await userModel.findById(userid);
    if(!existuser){
      return res.status(404).json({
        status:"error",
        message:"user not exist"
      })
    };
    const userpost = await Post.find({user:userid});
     return res.status(200).json({
      status:"success",
      message:'user posts fetched success',
      userpost

     })
    
  } catch (error) {
    console.log("error in user Post controller:", error);
    res.status(500).json({ error: "internal server error" });
  }
}
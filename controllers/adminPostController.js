import Post from '../models/postModel.js'; // Mongoose model for post
import hashtagsModel from '../models/hashtagsModel.js'; // Optional model if hashtags stored separately

// GET /api/adminPosts/posts
export const getAllPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, filter = 'all', search = '' } = req.query;

    const query = search
      ? { title: { $regex: search, $options: 'i' } }
      : {};

    if (filter !== 'all') {
      query.status = filter; // adjust this depending on your schema
    }

    const totalPosts = await Post.countDocuments(query);
    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .populate({ path: 'user', select: 'username profilePicture' }) 
      .populate({ path: 'hashtags', model: 'Hashtag', select: 'name' }) 
      .limit(parseInt(limit));

    res.json({
      posts,
      totalPosts,
      totalPages: Math.ceil(totalPosts / limit),
      currentPage: parseInt(page)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/adminPosts/posts/:id
export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/adminPosts/posts
export const createPost = async (req, res) => {
  try {
    const newPost = new Post(req.body);
    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/adminPosts/posts/:id
export const updatePostById = async (req, res) => {
  try {
    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedPost) return res.status(404).json({ message: 'Post not found' });
    res.json(updatedPost);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/adminPosts/posts/:id
export const deletePostById = async (req, res) => {
  try {
    const deletedPost = await Post.findByIdAndDelete(req.params.id);
    if (!deletedPost) return res.status(404).json({ message: 'Post not found' });
    res.json({ message: 'Post deleted', id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/adminPosts/hashtags
export const getAllHashtags = async (req, res) => {
  try {
    const hashtags = await hashtagsModel.find().sort({ name: 1 });
    res.json(hashtags);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

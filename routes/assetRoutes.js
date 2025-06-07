// routes/assetRoutes.js
import express from 'express';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
// import { v2 as cloudinary } from 'cloudinary';
import Asset from '../models/assetModel.js';
import pkg from 'cloudinary';
const { v2: cloudinary } = pkg;

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer with Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const { assetType } = req.body;
    
    // Validate asset type
    const validTypes = ['emoji', 'sticker', 'profilebackground'];
    if (!validTypes.includes(assetType)) {
      throw new Error('Invalid asset type');
    }

    return {
      folder: `assets/${assetType}`, // Creates folder structure: assets/emoji, assets/sticker, etc.
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
      resource_type: 'auto',
      public_id: `${assetType}_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
    };
  },
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'), false);
    }
  }
});

// POST /api/assets/upload - Upload asset to Cloudinary
router.post('/upload', upload.single('asset'), async (req, res) => {
  try {
    const { name, assetType, tags, isPublic } = req.body;
    
    // Validate required fields
    if (!name || !assetType) {
      return res.status(400).json({
        success: false,
        message: 'Name and asset type are required'
      });
    }

    // Validate asset type
    const validTypes = ['emoji', 'sticker', 'profilebackground'];
    if (!validTypes.includes(assetType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid asset type. Must be one of: emoji, sticker, profilebackground'
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Parse tags if provided
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (error) {
        parsedTags = typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()) : [];
      }
    }

    // Create asset document
    const asset = new Asset({
      name: name.trim(),
      assetType,
      assetUrl: req.file.path,
      tags: parsedTags,
      sizeInBytes: req.file.size,
      dimensions: {
        width: req.file.width || 0,
        height: req.file.height || 0
      },
      format: req.file.format || req.file.mimetype,
      uploadedBy: req.user?.id || null, // Assuming you have auth middleware
      isPublic: isPublic !== undefined ? Boolean(isPublic) : true,
    });

    await asset.save();

    res.status(201).json({
      success: true,
      message: 'Asset uploaded successfully',
      data: {
        asset: {
          id: asset._id,
          name: asset.name,
          assetType: asset.assetType,
          assetUrl: asset.assetUrl,
          tags: asset.tags,
          sizeInBytes: asset.sizeInBytes,
          dimensions: asset.dimensions,
          format: asset.format,
          isPublic: asset.isPublic,
          createdAt: asset.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Asset upload error:', error);
    
    // If there was an error after file upload, try to delete from Cloudinary
    if (req.file && req.file.public_id) {
      try {
        await cloudinary.uploader.destroy(req.file.public_id);
      } catch (deleteError) {
        console.error('Error deleting file from Cloudinary:', deleteError);
      }
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload asset',
    });
  }
});

// GET /api/assets/:assetType - Get all assets of specific type
router.get('/:assetType', async (req, res) => {
  try {
    const { assetType } = req.params;
    const { 
      page = 1, 
      limit = 20, 
      tags, 
      search,
      isPublic,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Validate asset type
    const validTypes = ['emoji', 'sticker', 'profilebackground'];
    if (!validTypes.includes(assetType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid asset type. Must be one of: emoji, sticker, profilebackground'
      });
    }

    // Build query
    const query = { assetType };

    // Add public filter if specified
    if (isPublic !== undefined) {
      query.isPublic = Boolean(isPublic);
    }

    // Add tags filter
    if (tags) {
      const tagArray = typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()) : tags;
      query.tags = { $in: tagArray };
    }

    // Add text search
    if (search) {
      query.$text = { $search: search };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const [assets, totalCount] = await Promise.all([
      Asset.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('uploadedBy', 'username email')
        .select('-__v'),
      Asset.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      success: true,
      message: `${assetType} assets retrieved successfully`,
      data: {
        assets,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit: limitNum
        }
      }
    });

  } catch (error) {
    console.error('Get assets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve assets',
    });
  }
});

// GET /api/assets/search - Search assets across all types
router.get('/search/all', async (req, res) => {
  try {
    const { 
      query: searchQuery,
      assetType,
      tags,
      page = 1,
      limit = 20,
      isPublic = true
    } = req.query;

    if (!searchQuery) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Build search filter
    const filter = {
      $text: { $search: searchQuery },
      isPublic: Boolean(isPublic)
    };

    // Add asset type filter if specified
    if (assetType) {
      const validTypes = ['emoji', 'sticker', 'profilebackground'];
      if (validTypes.includes(assetType)) {
        filter.assetType = assetType;
      }
    }

    // Add tags filter
    if (tags) {
      const tagArray = typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()) : tags;
      filter.tags = { $in: tagArray };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    const [assets, totalCount] = await Promise.all([
      Asset.find(filter)
        .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('uploadedBy', 'username email')
        .select('-__v'),
      Asset.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(200).json({
      success: true,
      message: 'Search completed successfully',
      data: {
        assets,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          limit: limitNum
        }
      }
    });

  } catch (error) {
    console.error('Search assets error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
    });
  }
});

// GET /api/assets/details/:id - Get single asset details
router.get('/details/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const asset = await Asset.findById(id)
      .populate('uploadedBy', 'username email')
      .populate('usedInBundles', 'name')
      .select('-__v');

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Asset retrieved successfully',
      data: { asset }
    });

  } catch (error) {
    console.error('Get asset details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve asset details',
    });
  }
});

export default router;
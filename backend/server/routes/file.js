import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// File Schema with increased size limit for base64
const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  data: {
    type: String, // Base64 encoded file data
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const File = mongoose.model('File', fileSchema);

// GET all files (metadata only, without full data)
router.get('/', async (req, res) => {
  try {
    const files = await File.find({}, '-data').sort({ uploadedAt: -1 });
    res.status(200).json({
      success: true,
      files
    });
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch files'
    });
  }
});

// GET single file (with full data for download)
router.get('/:id', async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    
    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }
    
    res.status(200).json({
      success: true,
      file
    });
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch file'
    });
  }
});

// POST upload new file
router.post('/', async (req, res) => {
  try {
    const { filename, mimetype, size, data } = req.body;
    
    if (!filename || !mimetype || !size || !data) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    const file = await File.create({
      filename,
      mimetype,
      size,
      data
    });
    
    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        _id: file._id,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        uploadedAt: file.uploadedAt
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload file'
    });
  }
});

// DELETE file
router.delete('/:id', async (req, res) => {
  try {
    const file = await File.findByIdAndDelete(req.params.id);
    
    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete file'
    });
  }
});

export default router;
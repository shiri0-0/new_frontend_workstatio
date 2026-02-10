import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// Text Schema
const textSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: 'main'
  },
  text: {
    type: String,
    default: ''
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Text = mongoose.model('Text', textSchema);

// GET - Retrieve text
router.get('/', async (req, res) => {
  try {
    let textDoc = await Text.findOne({ id: 'main' });
    
    if (!textDoc) {
      // Create default document if doesn't exist
      textDoc = await Text.create({ id: 'main', text: '' });
    }
    
    res.status(200).json({ 
      success: true,
      text: textDoc.text 
    });
  } catch (error) {
    console.error('Error fetching text:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch text' 
    });
  }
});

// POST - Save text
router.post('/', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (text === undefined) {
      return res.status(400).json({ 
        success: false,
        error: 'Text field is required' 
      });
    }
    
    const textDoc = await Text.findOneAndUpdate(
      { id: 'main' },
      { 
        text, 
        updatedAt: new Date() 
      },
      { 
        upsert: true, 
        new: true 
      }
    );
    
    res.status(200).json({ 
      success: true,
      message: 'Text saved successfully',
      text: textDoc.text
    });
  } catch (error) {
    console.error('Error saving text:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to save text' 
    });
  }
});

export default router;
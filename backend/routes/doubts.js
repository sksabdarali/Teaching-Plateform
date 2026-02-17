const express = require('express');
const { generateExplanation } = require('../utils/aiService');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST api/doubts/ask
// @desc    Ask a question and get AI explanation
// @access  Private
router.post('/ask', auth, async (req, res) => {
  try {
    const { subject, topic, question } = req.body;

    if (!subject || !topic || !question) {
      return res.status(400).json({ message: 'Subject, topic, and question are required' });
    }

    const explanation = await generateExplanation(subject, topic, question);

    res.json(explanation);
  } catch (error) {
    console.error('Error in doubt solving:', error);
    
    // Handle specific AI service errors
    if (error.message.includes('API quota exceeded') || error.message.includes('quota')) {
      return res.status(503).json({ 
        message: 'API quota exceeded. Please check your Google AI Studio usage limits and try again later.',
        error: error.message 
      });
    } else if (error.message.includes('Service temporarily unavailable') || error.message.includes('overloaded')) {
      return res.status(503).json({ 
        message: 'Service temporarily unavailable. The AI model may be overloaded. Please try again later.',
        error: error.message 
      });
    } else {
      return res.status(500).json({ 
        message: 'Error processing your question', 
        error: error.message 
      });
    }
  }
});

// @route   POST api/doubts/ask-contextual
// @desc    Ask a question with context from user's progress
// @access  Private
router.post('/ask-contextual', auth, async (req, res) => {
  try {
    const { question } = req.body;
    
    // Get user's profile to provide context
    const user = await User.findById(req.user.id);
    
    if (!question) {
      return res.status(400).json({ message: 'Question is required' });
    }
    
    // Use user's subjects and weak areas to provide more contextual help
    const explanation = await generateExplanation(
      user.weakSubjects && user.weakSubjects.length > 0 ? user.weakSubjects[0] : user.subjects[0], 
      'General', 
      question
    );
    
    res.json(explanation);
  } catch (error) {
    console.error('Error in contextual doubt solving:', error);
    
    // Handle specific AI service errors
    if (error.message.includes('API quota exceeded') || error.message.includes('quota')) {
      return res.status(503).json({ 
        message: 'API quota exceeded. Please check your Google AI Studio usage limits and try again later.',
        error: error.message 
      });
    } else if (error.message.includes('Service temporarily unavailable') || error.message.includes('overloaded')) {
      return res.status(503).json({ 
        message: 'Service temporarily unavailable. The AI model may be overloaded. Please try again later.',
        error: error.message 
      });
    } else {
      return res.status(500).json({ 
        message: 'Error processing your question', 
        error: error.message 
      });
    }
  }
});

module.exports = router;
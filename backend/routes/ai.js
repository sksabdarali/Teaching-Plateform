const express = require('express');
const { generateQuiz, generateLearningContent, generateStudyMaterials } = require('../controllers/aiController');
const auth = require('../middleware/auth');

const router = express.Router();

// Validate request body for AI endpoints - PROBLEM 8 FIX
const validateAIRequest = (req, res, next) => {
  const { subject, topic, numQuestions } = req.body;
  
  // Validate subject and topic lengths to prevent prompt injection
  if (subject && typeof subject === 'string' && subject.length > 100) {
    return res.status(400).json({ message: 'Subject name too long (max 100 characters)' });
  }
  
  if (topic && typeof topic === 'string' && topic.length > 100) {
    return res.status(400).json({ message: 'Topic name too long (max 100 characters)' });
  }
  
  // Validate question count for free tier - PROBLEM 6 FIX
  if (numQuestions && typeof numQuestions === 'number' && numQuestions > 5) {
    return res.status(400).json({ message: 'Maximum 5 questions allowed per request (free tier)' });
  }
  
  next();
};

// @route   POST api/ai/generate-quiz
// @desc    Generate a quiz using AI
// @access  Private
router.post('/generate-quiz', auth, validateAIRequest, generateQuiz);

// @route   POST api/ai/generate-content
// @desc    Generate learning content using AI
// @access  Private
router.post('/generate-content', auth, validateAIRequest, generateLearningContent);

// @route   POST api/ai/generate-study-materials
// @desc    Generate study materials based on syllabus
// @access  Private
router.post('/generate-study-materials', auth, validateAIRequest, (req, res, next) => {
  // Log the response headers being sent
  console.log('Request headers:', req.headers);
  res.on('finish', () => {
    console.log('Response headers sent:', res.getHeaders());
  });
  next();
}, generateStudyMaterials);

// @route   POST api/ai/process-syllabus
// @desc    Process a specific syllabus with AI for a given topic
// @access  Private
router.post('/process-syllabus', auth, validateAIRequest, generateStudyMaterials);

module.exports = router;
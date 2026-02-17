const express = require('express');
const { getUserProgress, getSubjectProgress, getUserAchievements, updateProgressAfterQuiz, trackSyllabusTopicProgress, getSyllabusProgress, getPersonalizedRecommendations, updateUserPoints } = require('../controllers/progressController');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET api/progress
// @desc    Get user's overall progress
// @access  Private
router.get('/', auth, getUserProgress);

// @route   GET api/progress/subject/:subject
// @desc    Get progress for a specific subject
// @access  Private
router.get('/subject/:subject', auth, getSubjectProgress);

// @route   GET api/progress/achievements
// @desc    Get user's achievements
// @access  Private
router.get('/achievements', auth, getUserAchievements);

// @route   POST api/progress/update-after-quiz
// @desc    Update progress after quiz completion
// @access  Private
router.post('/update-after-quiz', auth, updateProgressAfterQuiz);

// @route   POST api/progress/syllabus-topic
// @desc    Track progress for a specific syllabus topic
// @access  Private
router.post('/syllabus-topic', auth, trackSyllabusTopicProgress);

// @route   GET api/progress/syllabus/:syllabusId
// @desc    Get progress for a specific syllabus
// @access  Private
router.get('/syllabus/:syllabusId', auth, getSyllabusProgress);

// @route   GET api/progress/recommendations
// @desc    Get personalized recommendations based on user progress
// @access  Private
router.get('/recommendations', auth, getPersonalizedRecommendations);

// @route   POST api/progress/update-points
// @desc    Update user points
// @access  Private
router.post('/update-points', auth, updateUserPoints);

module.exports = router;
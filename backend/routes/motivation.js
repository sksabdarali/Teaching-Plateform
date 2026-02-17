const express = require('express');
const { getDailyMotivation, getMotivationHistory, markMotivationRead, getUserAchievements, sendMotivationalNotification } = require('../controllers/motivationController');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET api/motivation/daily
// @desc    Get daily motivation for user
// @access  Private
router.get('/daily', auth, getDailyMotivation);

// @route   GET api/motivation/history
// @desc    Get user's motivation history
// @access  Private
router.get('/history', auth, getMotivationHistory);

// @route   POST api/motivation/mark-read/:id
// @desc    Mark motivation as read
// @access  Private
router.post('/mark-read/:id', auth, markMotivationRead);

// @route   GET api/motivation/achievements
// @desc    Get user's achievements
// @access  Private
router.get('/achievements', auth, getUserAchievements);

// @route   POST api/motivation/send-notification
// @desc    Send motivational notification
// @access  Private
router.post('/send-notification', auth, sendMotivationalNotification);

module.exports = router;
const express = require('express');
const { getTopics, getTopic, markTopicComplete, getTopicExplanation } = require('../controllers/topicController');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET api/topics/:syllabusId
// @desc    Get all topics for a syllabus
// @access  Private
router.get('/:syllabusId', auth, getTopics);

// @route   GET api/topics/:syllabusId/:topicIndex
// @desc    Get a specific topic
// @access  Private
router.get('/:syllabusId/:topicIndex', auth, getTopic);

// @route   POST api/topics/mark-complete
// @desc    Mark a topic as completed
// @access  Private
router.post('/mark-complete', auth, markTopicComplete);

// @route   POST api/topics/explanation
// @desc    Get AI explanation for a topic
// @access  Private
router.post('/explanation', auth, getTopicExplanation);

module.exports = router;
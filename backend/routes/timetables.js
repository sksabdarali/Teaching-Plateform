const express = require('express');
const Timetable = require('../models/Timetable');
const User = require('../models/User');
const Syllabus = require('../models/Syllabus');
const { generatePersonalizedTimetable } = require('../utils/aiService');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST api/timetables
// @desc    Create a new timetable
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, schedule, startDate, endDate } = req.body;

    const timetable = new Timetable({
      title,
      description,
      user: req.user.id,
      schedule,
      startDate,
      endDate
    });

    await timetable.save();
    res.status(201).json(timetable);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/timetables
// @desc    Get user's timetables
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const timetables = await Timetable.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(timetables);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/timetables/:id
// @desc    Get a specific timetable
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id);

    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }

    // Check if user owns this timetable
    if (timetable.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    res.json(timetable);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/timetables/:id
// @desc    Update a timetable
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, schedule, status } = req.body;

    const timetable = await Timetable.findById(req.params.id);

    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }

    // Check if user owns this timetable
    if (timetable.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    const updatedTimetable = await Timetable.findByIdAndUpdate(
      req.params.id,
      { title, description, schedule, status },
      { new: true }
    );

    res.json(updatedTimetable);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/timetables/:id
// @desc    Delete a timetable
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id);

    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }

    // Check if user owns this timetable
    if (timetable.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await Timetable.findByIdAndRemove(req.params.id);
    res.json({ message: 'Timetable removed' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/timetables/generate-ai
// @desc    Generate AI-based timetable
// @access  Private
router.post('/generate-ai', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { subjects: customSubjects } = req.body;

    // Gather subjects: prefer custom input > syllabi subjects > user.subjects > defaults
    let subjects = [];

    if (customSubjects && Array.isArray(customSubjects) && customSubjects.length > 0) {
      subjects = customSubjects;
    } else {
      // Try to fetch subjects from user's uploaded syllabi
      const syllabi = await Syllabus.find({ createdBy: req.user.id }).select('subject');
      if (syllabi && syllabi.length > 0) {
        subjects = [...new Set(syllabi.map(s => s.subject).filter(Boolean))];
      }
    }

    // Fall back to user.subjects if still empty
    if (subjects.length === 0 && user.subjects && user.subjects.length > 0) {
      subjects = user.subjects;
    }

    const studyHours = user.studyPreferences?.dailyStudyHours || 4;

    // Generate personalized timetable using AI
    const timetableData = await generatePersonalizedTimetable(subjects, studyHours);

    const timetable = new Timetable({
      title: timetableData.title,
      description: timetableData.description,
      user: req.user.id,
      schedule: timetableData.schedule,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      generationMethod: 'ai_generated'
    });

    await timetable.save();
    res.status(201).json(timetable);
  } catch (error) {
    console.error('Error generating AI timetable:', error);

    // Handle specific AI service errors
    if (error.message && (error.message.includes('API quota exceeded') || error.message.includes('quota'))) {
      return res.status(503).json({
        message: 'API quota exceeded. Please check your Google AI Studio usage limits and try again later.',
        error: error.message
      });
    } else if (error.message && (error.message.includes('Service temporarily unavailable') || error.message.includes('overloaded'))) {
      return res.status(503).json({
        message: 'Service temporarily unavailable. The AI model may be overloaded. Please try again later.',
        error: error.message
      });
    } else {
      return res.status(500).json({
        message: 'Error generating AI timetable',
        error: error.message
      });
    }
  }
});

module.exports = router;
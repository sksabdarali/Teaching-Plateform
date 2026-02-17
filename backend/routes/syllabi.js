const express = require('express');
const Syllabus = require('../models/Syllabus');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST api/syllabi
// @desc    Create a new syllabus
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, grade, board, subject, topics } = req.body;

    const syllabus = new Syllabus({
      title,
      description,
      grade,
      board,
      subject,
      topics,
      createdBy: req.user.id
    });

    await syllabus.save();
    res.status(201).json(syllabus);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/syllabi
// @desc    Get all syllabi for user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const syllabi = await Syllabus.find({ createdBy: req.user.id });
    // Ensure topics array exists for all syllabi
    const syllabiWithTopics = syllabi.map(syllabus => ({
      ...syllabus.toObject(),
      topics: syllabus.topics || []
    }));
    res.json(syllabiWithTopics);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/syllabi/:id
// @desc    Get a specific syllabus
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const syllabus = await Syllabus.findById(req.params.id);
    
    if (!syllabus) {
      return res.status(404).json({ message: 'Syllabus not found' });
    }

    // Check if user owns this syllabus
    if (syllabus.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    // Ensure topics array exists
    const syllabusWithTopics = {
      ...syllabus.toObject(),
      topics: syllabus.topics || []
    };
    res.json(syllabusWithTopics);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/syllabi/:id
// @desc    Update a syllabus
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, topics, status } = req.body;

    const syllabus = await Syllabus.findById(req.params.id);
    
    if (!syllabus) {
      return res.status(404).json({ message: 'Syllabus not found' });
    }

    // Check if user owns this syllabus
    if (syllabus.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    // Update syllabus
    const updatedSyllabus = await Syllabus.findByIdAndUpdate(
      req.params.id,
      { title, description, topics, status },
      { new: true }
    );

    res.json(updatedSyllabus);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/syllabi/:id
// @desc    Delete a syllabus
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const syllabus = await Syllabus.findById(req.params.id);
    
    if (!syllabus) {
      return res.status(404).json({ message: 'Syllabus not found' });
    }

    // Check if user owns this syllabus
    if (syllabus.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await Syllabus.findByIdAndDelete(req.params.id);
    res.json({ message: 'Syllabus removed' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
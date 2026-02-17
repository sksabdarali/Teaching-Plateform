const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const router = express.Router();

// @route   GET api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { 
      name, 
      grade, 
      board, 
      subjects, 
      weakSubjects, 
      strongSubjects, 
      studyPreferences,
      examSchedule 
    } = req.body;

    const profileFields = {};
    if (name) profileFields.name = name;
    if (grade) profileFields.grade = grade;
    if (board) profileFields.board = board;
    if (subjects) profileFields.subjects = subjects;
    if (weakSubjects) profileFields.weakSubjects = weakSubjects;
    if (strongSubjects) profileFields.strongSubjects = strongSubjects;
    if (studyPreferences) profileFields.studyPreferences = studyPreferences;
    if (examSchedule) profileFields.examSchedule = examSchedule;

    // Mark profile as complete if required fields are filled
    const requiredFields = [name, grade, board, subjects];
    if (requiredFields.every(field => field)) {
      profileFields.profileComplete = true;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: profileFields },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/', [auth, admin], async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
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
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   PATCH api/users/:id/status
// @desc    Toggle user active status (admin only)
// @access  Private/Admin
router.patch('/:id/status', [auth, admin], async (req, res) => {
  try {
    const { isActive } = req.body;

    // Prevent admin from deactivating themselves
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot deactivate your own account' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive } },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`👤 Admin ${req.user.email} ${isActive ? 'activated' : 'deactivated'} user ${user.email}`);
    res.json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/users/:id
// @desc    Delete a user (admin only)
// @access  Private/Admin
router.delete('/:id', [auth, admin], async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndDelete(req.params.id);

    console.log(`🗑️ Admin ${req.user.email} deleted user ${user.email}`);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
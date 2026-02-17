const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { OAuth2Client } = require('google-auth-library');
const auth = require('../middleware/auth');
const { sendWelcomeEmail, sendOTPEmail } = require('../utils/emailService');

const router = express.Router();

// Google OAuth client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// In-memory OTP store for pending registrations (email -> { otp, expiry, name, password, grade, board, subjects })
const pendingOTPs = new Map();

// Clean up expired OTPs every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [email, data] of pendingOTPs.entries()) {
    if (data.expiry < now) {
      pendingOTPs.delete(email);
    }
  }
}, 5 * 60 * 1000);

// @route   POST api/auth/send-otp
// @desc    Send OTP to email for verification
// @access  Public
router.post('/send-otp', async (req, res) => {
  try {
    const { email, name, password, grade, board, subjects } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP and registration data in memory
    pendingOTPs.set(email, {
      otp,
      expiry,
      name,
      password,
      grade,
      board,
      subjects: subjects || []
    });

    // Send OTP email
    await sendOTPEmail(email, otp);

    console.log(`📧 OTP generated for ${email}: ${otp}`);

    res.json({ message: 'Verification code sent to your email' });
  } catch (error) {
    console.error('Error sending OTP:', error.message);
    res.status(500).json({ message: error.message || 'Failed to send verification code' });
  }
});

// @route   POST api/auth/verify-otp
// @desc    Verify OTP and create user account
// @access  Public
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const pendingData = pendingOTPs.get(email);

    if (!pendingData) {
      return res.status(400).json({ message: 'No verification pending for this email. Please request a new code.' });
    }

    // Check expiry
    if (Date.now() > pendingData.expiry) {
      pendingOTPs.delete(email);
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }

    // Check OTP
    if (pendingData.otp !== otp.trim()) {
      return res.status(400).json({ message: 'Invalid verification code. Please try again.' });
    }

    // OTP verified — create the user account
    const { name, password, grade, board, subjects } = pendingData;

    // Double-check user doesn't already exist
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      pendingOTPs.delete(email);
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({
      name,
      email,
      password,
      grade,
      board,
      subjects,
      isEmailVerified: true
    });

    await user.save();

    // Clean up OTP data
    pendingOTPs.delete(email);

    // Send welcome email (non-blocking)
    sendWelcomeEmail(name, email).catch(() => { });

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        grade: user.grade,
        board: user.board,
        subjects: user.subjects,
        isEmailVerified: true,
        profileComplete: user.profileComplete
      }
    });
  } catch (error) {
    console.error('Error verifying OTP:', error.message);
    res.status(500).json({ message: 'Server error during verification' });
  }
});

// @route   POST api/auth/register
// @desc    Register user (legacy — kept for backward compatibility but now recommends OTP flow)
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, grade, board, subjects } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Validate required fields for email registration
    if (!grade || !board) {
      return res.status(400).json({ message: 'Grade and board are required for email registration' });
    }

    // Create new user
    user = new User({
      name,
      email,
      password,
      grade,
      board,
      subjects
    });

    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        grade: user.grade,
        board: user.board,
        subjects: user.subjects,
        profileComplete: user.profileComplete
      }
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        grade: user.grade,
        board: user.board,
        subjects: user.subjects,
        profileComplete: user.profileComplete
      }
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/google
// @desc    Google OAuth login
// @access  Public
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { name, email, picture } = ticket.getPayload();

    let user = await User.findOne({ email });

    if (user) {
      // User already exists, just return token
      const authToken = generateToken(user._id);

      return res.json({
        token: authToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          grade: user.grade,
          board: user.board,
          subjects: user.subjects,
          profileComplete: user.profileComplete
        }
      });
    } else {
      try {
        // Create new user with default values for required fields
        user = new User({
          name,
          email,
          profilePic: picture,
          authMethod: 'google',
          isEmailVerified: true, // Google accounts are pre-verified
          // Provide default values for required fields that Google doesn't provide
          grade: 'Not Specified',
          board: 'Not Specified',
          subjects: []
        });

        // Ensure required fields are present for Google users
        if (!user.grade) user.grade = 'Not Specified';
        if (!user.board) user.board = 'Not Specified';

        await user.save();

        // Send welcome email (non-blocking)
        sendWelcomeEmail(name, email).catch(() => { });
      } catch (saveError) {
        console.error('Error saving user:', saveError);
        return res.status(500).json({ message: 'Error creating user account', error: saveError.message });
      }

      const authToken = generateToken(user._id);

      res.status(201).json({
        token: authToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          grade: user.grade,
          board: user.board,
          subjects: user.subjects,
          profileComplete: user.profileComplete
        }
      });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/auth/profile
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

module.exports = router;
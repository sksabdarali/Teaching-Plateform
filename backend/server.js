const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: [
    'https://teaching-plateform.onrender.com',
    'http://localhost:3000',
    'http://localhost:5000'
  ],
  credentials: true
}));
app.use(express.json());

// Multer error handling middleware - must be added before routes
app.use((error, req, res, next) => {
  if (error instanceof require('multer').MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        message: 'Too many files or unexpected field name. Expected "syllabusFile".'
      });
    }
    if (error.code === 'LIMIT_PART_COUNT') {
      return res.status(400).json({
        message: 'Too many parts in the form.'
      });
    }
    if (error.code === 'LIMIT_FIELD_KEY') {
      return res.status(400).json({
        message: 'Field key too long.'
      });
    }
    if (error.code === 'LIMIT_FIELD_VALUE') {
      return res.status(400).json({
        message: 'Field value too long.'
      });
    }
    if (error.code === 'LIMIT_FIELD_COUNT') {
      return res.status(400).json({
        message: 'Too many fields in the form.'
      });
    }
    return res.status(400).json({
      message: `File upload error: ${error.message}`
    });
  }
  next(error);
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/teaching-platform');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const { initCronJobs } = require('./utils/cronJobs');

connectDB().then(() => {
  // Initialize cron jobs after DB is connected
  initCronJobs();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/syllabi', require('./routes/syllabi'));
app.use('/api/syllabi-upload', require('./routes/syllabusUpload'));
app.use('/api/topics', require('./routes/topics'));
app.use('/api/quizzes', require('./routes/quizzes'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/timetables', require('./routes/timetables'));
app.use('/api/motivation', require('./routes/motivation'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/doubts', require('./routes/doubts'));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Teaching Platform API is running' });
});

// Test endpoint: trigger daily quote emails manually (remove in production)
const { sendDailyQuotesToAllUsers } = require('./utils/cronJobs');
app.get('/api/test/send-daily-quotes', async (req, res) => {
  try {
    await sendDailyQuotesToAllUsers();
    res.json({ status: 'ok', message: 'Daily quote emails triggered successfully' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

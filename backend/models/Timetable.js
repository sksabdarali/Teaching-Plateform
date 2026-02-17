const mongoose = require('mongoose');

const scheduleItemSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true
  },
  topic: String,
  startTime: {
    type: String, // Format: "HH:MM"
    required: true
  },
  endTime: {
    type: String, // Format: "HH:MM"
    required: true
  },
  date: {
    type: String, // Format: "YYYY-MM-DD"
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  priority: {
    type: Number, // 1-5 scale
    default: 3
  },
  isCompleted: {
    type: Boolean,
    default: false
  }
});

const timetableSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  schedule: [scheduleItemSchema],
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active'
  },
  generationMethod: {
    type: String,
    enum: ['ai_generated', 'manual', 'hybrid'],
    default: 'ai_generated'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Timetable', timetableSchema);
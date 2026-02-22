const mongoose = require('mongoose');

const motivationHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['quote', 'achievement', 'streak', 'reminder', 'encouragement', 'daily_motivation', 'notification', 'custom'],
    required: true
  },
  content: {
    quote: String,
    message: String,
    achievement: String,
    advice: String,
    encouragement: String
  },
  date: {
    type: Date,
    default: Date.now
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MotivationHistory', motivationHistorySchema);
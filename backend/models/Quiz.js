const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  options: [{
    type: String,
    required: true
  }],
  correctAnswer: {
    type: Number, // Index of the correct option
    required: true
  },
  explanation: {
    type: String // Explanation for the correct answer
  }
});

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  subject: {
    type: String,
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  grade: {
    type: String,
    required: true
  },
  board: {
    type: String,
    required: true
  },
  questions: [questionSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  syllabusId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Syllabus' // Link to the syllabus this quiz was generated from
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Quiz', quizSchema);
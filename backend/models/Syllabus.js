const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  content: String,
  subtopics: [{
    title: String,
    content: String
  }],
  resources: [{
    type: {
      type: String, // 'video', 'pdf', 'link', 'text'
    },
    url: String,
    title: String
  }]
});

const syllabusSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  grade: {
    type: String,
    required: true
  },
  board: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  topics: [topicSchema],
  rawData: {
    filename: String,
    mimetype: String,
    size: Number,
    buffer: Buffer, // Store the raw file buffer
    content: String, // For text content
    encoding: String, // 'base64' or other encoding
    uploadedAt: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Syllabus', syllabusSchema);
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String
  },
  profilePic: {
    type: String,
    default: ''
  },
  authMethod: {
    type: String,
    enum: ['email', 'google'],
    default: 'email'
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  grade: {
    type: String
  },
  board: {
    type: String
  },
  subjects: [{
    type: String
  }],
  syllabus: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Syllabus'
  },
  weakSubjects: [{
    type: String
  }],
  strongSubjects: [{
    type: String
  }],
  studyPreferences: {
    dailyStudyHours: {
      type: Number,
      default: 2
    },
    preferredStudyTime: {
      startTime: String,
      endTime: String
    },
    difficultyPreference: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate'
    }
  },
  examSchedule: [{
    subject: String,
    date: Date,
    type: String // mid-term, final, etc.
  }],
  profileComplete: {
    type: Boolean,
    default: false
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailOtp: {
    type: String
  },
  emailOtpExpiry: {
    type: Date
  },
  quizScores: [{
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz'
    },
    score: Number,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  progress: {
    type: Map,
    of: {
      completedTopics: [String],
      masteryLevel: Number // 0-100 percentage
    },
    default: () => new Map()
  },
  streak: {
    current: {
      type: Number,
      default: 0
    },
    longest: {
      type: Number,
      default: 0
    }
  },
  points: {
    type: Number,
    default: 0
  },
  quizzesCompleted: {
    type: Number,
    default: 0
  },
  achievements: [{
    name: String,
    earnedDate: {
      type: Date,
      default: Date.now
    }
  }],
  lastCompletedTopicDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function () {
  // Only hash password if authMethod is 'email' and password exists and is modified
  if (this.authMethod === 'email' && this.password && this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  // No next() needed with async functions
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
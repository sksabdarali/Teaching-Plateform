const User = require('../models/User');
const QuizResult = require('../models/QuizResult');
const Syllabus = require('../models/Syllabus');
const { generatePersonalizedTimetable } = require('../utils/aiService');

// Get user's overall progress
const getUserProgress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    // Get user's quiz results
    const quizResults = await QuizResult.find({ user: req.user.id })
      .populate('quiz', 'title subject topic')
      .sort({ createdAt: -1 });
    
    // Calculate overall statistics
    const totalQuizzes = quizResults.length;
    const avgScore = totalQuizzes > 0 
      ? quizResults.reduce((sum, result) => sum + result.percentage, 0) / totalQuizzes 
      : 0;
    
    // Get recent results (last 10)
    const recentResults = quizResults.slice(0, 10);
    
    res.json({
      userProgress: user.progress,
      totalQuizzes,
      avgScore: Math.round(avgScore),
      recentResults,
      streak: user.streak,
      points: user.points,
      achievements: user.achievements
    });
  } catch (error) {
    console.error('Error fetching user progress:', error);
    res.status(500).json({ message: 'Error fetching progress', error: error.message });
  }
};

// Get progress for a specific subject
const getSubjectProgress = async (req, res) => {
  try {
    const { subject } = req.params;
    const user = await User.findById(req.user.id).select('-password');
    
    // Get quiz results for this subject
    const quizResults = await QuizResult.find({ 
      user: req.user.id 
    })
    .populate('quiz', 'title subject topic')
    .sort({ createdAt: -1 });

    const subjectResults = quizResults.filter(result => 
      result.quiz && result.quiz.subject.toLowerCase() === subject.toLowerCase()
    );

    const totalQuizzes = subjectResults.length;
    const avgScore = totalQuizzes > 0 
      ? subjectResults.reduce((sum, result) => sum + result.percentage, 0) / totalQuizzes 
      : 0;

    res.json({
      subject,
      totalQuizzes,
      avgScore: Math.round(avgScore),
      recentResults: subjectResults.slice(0, 10),
      subjectProgress: user.progress.get(subject) || { completedTopics: [], masteryLevel: 0 }
    });
  } catch (error) {
    console.error('Error fetching subject progress:', error);
    res.status(500).json({ message: 'Error fetching subject progress', error: error.message });
  }
};

// Get user's achievements
const getUserAchievements = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('achievements');
    res.json({ achievements: user.achievements || [] });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ message: 'Error fetching achievements', error: error.message });
  }
};

// Award achievements based on user activity
const awardAchievements = async (user) => {
  const achievements = user.achievements || [];
  const currentPoints = user.points || 0;
  const streak = user.streak?.current || 0;
  const totalQuizzes = await QuizResult.countDocuments({ user: user._id });

  // First Quiz Achievement
  if (totalQuizzes >= 1 && !achievements.some(a => a.type === 'first_quiz')) {
    achievements.push({
      type: 'first_quiz',
      name: 'First Quiz Completed',
      description: 'Complete your first quiz',
      earnedAt: new Date()
    });
  }

  // Points-based achievements
  if (currentPoints >= 100 && !achievements.some(a => a.type === 'points_100')) {
    achievements.push({
      type: 'points_100',
      name: 'Century Club',
      description: 'Earn 100 points',
      earnedAt: new Date()
    });
  }

  if (currentPoints >= 500 && !achievements.some(a => a.type === 'points_500')) {
    achievements.push({
      type: 'points_500',
      name: 'Half Thousand',
      description: 'Earn 500 points',
      earnedAt: new Date()
    });
  }

  // Streak achievements
  if (streak >= 7 && !achievements.some(a => a.type === 'streak_7')) {
    achievements.push({
      type: 'streak_7',
      name: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      earnedAt: new Date()
    });
  }

  if (streak >= 30 && !achievements.some(a => a.type === 'streak_30')) {
    achievements.push({
      type: 'streak_30',
      name: 'Monthly Master',
      description: 'Maintain a 30-day streak',
      earnedAt: new Date()
    });
  }

  user.achievements = achievements;
  await user.save();
};

// Update progress after quiz completion
const updateProgressAfterQuiz = async (req, res) => {
  try {
    const { quizId, score, maxScore } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate percentage
    const percentage = Math.round((score / maxScore) * 100);

    // Create quiz result
    const quizResult = new QuizResult({
      user: req.user.id,
      quiz: quizId,
      score,
      maxScore,
      percentage
    });

    await quizResult.save();

    // Update user progress
    const quiz = await require('../models/Quiz').findById(quizId);
    if (quiz) {
      const subjectProgress = user.progress.get(quiz.subject) || { completedTopics: [], masteryLevel: 0 };
      const topicKey = `${quiz.subject}_${quiz.topic}`;
      
      if (!subjectProgress.completedTopics.includes(topicKey)) {
        subjectProgress.completedTopics.push(topicKey);
        // Update mastery level based on performance
        if (percentage >= 90) {
          subjectProgress.masteryLevel += 2;
        } else if (percentage >= 70) {
          subjectProgress.masteryLevel += 1;
        }
        user.progress.set(quiz.subject, subjectProgress);
      }
    }

    // Award points (10 points per correct answer)
    const pointsEarned = score * 10;
    user.points = (user.points || 0) + pointsEarned;
    
    // Increment quizzes completed count
    user.quizzesCompleted = (user.quizzesCompleted || 0) + 1;

    // Update streak
    const today = new Date().toDateString();
    if (!user.lastCompletedTopicDate || new Date(user.lastCompletedTopicDate).toDateString() !== today) {
      user.streak.current = (user.streak?.current || 0) + 1;
      if (user.streak.current > (user.streak?.longest || 0)) {
        user.streak.longest = user.streak.current;
      }
      user.lastCompletedTopicDate = new Date();
    }

    await user.save();
    await awardAchievements(user);

    res.json({
      message: 'Progress updated successfully',
      pointsEarned,
      totalPoints: user.points,
      streak: user.streak
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ message: 'Error updating progress', error: error.message });
  }
};

// Track progress for a specific syllabus topic
const trackSyllabusTopicProgress = async (req, res) => {
  try {
    const { syllabusId, topicTitle, timeSpent, completed } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const syllabus = await Syllabus.findById(syllabusId);
    if (!syllabus) {
      return res.status(404).json({ message: 'Syllabus not found' });
    }

    // Update progress tracking
    const progressKey = `${syllabus.subject}_${topicTitle}`;
    const subjectProgress = user.progress.get(syllabus.subject) || { completedTopics: [], masteryLevel: 0 };
    
    if (completed && !subjectProgress.completedTopics.includes(progressKey)) {
      subjectProgress.completedTopics.push(progressKey);
      subjectProgress.masteryLevel += 1;
      user.progress.set(syllabus.subject, subjectProgress);
      
      // Award points for completion
      const pointsEarned = 20;
      user.points = (user.points || 0) + pointsEarned;
    }

    await user.save();
    await awardAchievements(user);

    res.json({
      message: 'Topic progress tracked successfully',
      points: user.points,
      progress: subjectProgress
    });
  } catch (error) {
    console.error('Error tracking topic progress:', error);
    res.status(500).json({ message: 'Error tracking progress', error: error.message });
  }
};

// Get progress for a specific syllabus
const getSyllabusProgress = async (req, res) => {
  try {
    const { syllabusId } = req.params;
    
    const user = await User.findById(req.user.id).select('progress');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const syllabus = await Syllabus.findById(syllabusId);
    if (!syllabus) {
      return res.status(404).json({ message: 'Syllabus not found' });
    }

    const subjectProgress = user.progress.get(syllabus.subject) || { completedTopics: [], masteryLevel: 0 };
    
    res.json({
      subject: syllabus.subject,
      progress: subjectProgress
    });
  } catch (error) {
    console.error('Error fetching syllabus progress:', error);
    res.status(500).json({ message: 'Error fetching progress', error: error.message });
  }
};

// Generate personalized timetable
const getPersonalizedRecommendations = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate recommendations based on user progress
    const recommendations = [];
    
    // Weak subjects recommendation
    user.progress.forEach((subjectProgress, subject) => {
      if (subjectProgress.masteryLevel < 5) {
        recommendations.push({
          type: 'study',
          subject,
          priority: 'high',
          message: `Focus more on ${subject} - your mastery level is ${subjectProgress.masteryLevel}/10`
        });
      }
    });

    // Streak maintenance recommendation
    if (user.streak?.current > 0) {
      recommendations.push({
        type: 'motivation',
        message: `Keep your ${user.streak.current}-day streak going!`,
        priority: 'medium'
      });
    }

    res.json({ recommendations });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ message: 'Error generating recommendations', error: error.message });
  }
};

// Update user points
const updateUserPoints = async (req, res) => {
  try {
    const { points } = req.body;
    
    if (typeof points !== 'number' || points <= 0) {
      return res.status(400).json({ message: 'Valid points value required' });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user points
    user.points = (user.points || 0) + points;
    
    // Update streak if points were earned
    if (points > 0) {
      const today = new Date().toDateString();
      if (!user.lastCompletedTopicDate || new Date(user.lastCompletedTopicDate).toDateString() !== today) {
        user.streak.current = (user.streak?.current || 0) + 1;
        if (user.streak.current > (user.streak?.longest || 0)) {
          user.streak.longest = user.streak.current;
        }
        user.lastCompletedTopicDate = new Date();
      }
    }
    
    await user.save();
    await awardAchievements(user);
    
    res.json({
      message: 'Points updated successfully',
      points: user.points,
      streak: user.streak
    });
  } catch (error) {
    console.error('Error updating user points:', error);
    res.status(500).json({ message: 'Error updating points', error: error.message });
  }
};

module.exports = {
  getUserProgress,
  getSubjectProgress,
  getUserAchievements,
  awardAchievements,
  updateProgressAfterQuiz,
  trackSyllabusTopicProgress,
  getSyllabusProgress,
  getPersonalizedRecommendations,
  updateUserPoints
};
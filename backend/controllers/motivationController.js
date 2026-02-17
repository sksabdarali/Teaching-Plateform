const User = require('../models/User');
const MotivationHistory = require('../models/MotivationHistory');
const { generateMotivationalContent } = require('../utils/aiService');

// Get daily motivation for user
const getDailyMotivation = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Check if user already received motivation today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingMotivation = await MotivationHistory.findOne({
      user: req.user.id,
      date: {
        $gte: today
      }
    });
    
    if (existingMotivation) {
      return res.json({
        type: 'existing',
        content: existingMotivation.content,
        date: existingMotivation.date
      });
    }
    
    // Generate new motivation using AI
    const motivationContent = await generateMotivationalContent(user);
    
    // Save to history
    const motivationEntry = new MotivationHistory({
      user: req.user.id,
      type: 'daily_motivation',
      content: {
        quote: motivationContent.quote,
        message: motivationContent.message,
        advice: motivationContent.advice,
        encouragement: motivationContent.encouragement
      }
    });
    
    await motivationEntry.save();
    
    res.json({
      type: 'daily_motivation',
      content: {
        quote: motivationContent.quote,
        message: motivationContent.message,
        advice: motivationContent.advice,
        encouragement: motivationContent.encouragement
      },
      date: new Date()
    });
  } catch (error) {
    console.error('Error getting daily motivation:', error);
    
    // Handle specific AI service errors
    if (error.message.includes('API quota exceeded') || error.message.includes('quota')) {
      return res.status(503).json({ 
        message: 'API quota exceeded. Please check your Google AI Studio usage limits and try again later.',
        error: error.message 
      });
    } else if (error.message.includes('Service temporarily unavailable') || error.message.includes('overloaded')) {
      return res.status(503).json({ 
        message: 'Service temporarily unavailable. The AI model may be overloaded. Please try again later.',
        error: error.message 
      });
    } else {
      return res.status(500).json({ 
        message: 'Error getting motivation', 
        error: error.message 
      });
    }
  }
};

// Get user's motivation history
const getMotivationHistory = async (req, res) => {
  try {
    const motivations = await MotivationHistory.find({ user: req.user.id })
      .sort({ date: -1 })
      .limit(10);
    
    res.json(motivations);
  } catch (error) {
    console.error('Error getting motivation history:', error);
    res.status(500).json({ message: 'Error getting motivation history', error: error.message });
  }
};

// Mark motivation as read
const markMotivationRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const motivation = await MotivationHistory.findOneAndUpdate(
      { _id: id, user: req.user.id },
      { read: true },
      { new: true }
    );
    
    if (!motivation) {
      return res.status(404).json({ message: 'Motivation entry not found' });
    }
    
    res.json(motivation);
  } catch (error) {
    console.error('Error marking motivation as read:', error);
    res.status(500).json({ message: 'Error updating motivation status', error: error.message });
  }
};

// Get user's achievements
const getUserAchievements = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('achievements points streak');
    
    res.json({
      achievements: user.achievements,
      points: user.points,
      streak: user.streak
    });
  } catch (error) {
    console.error('Error getting user achievements:', error);
    res.status(500).json({ message: 'Error getting achievements', error: error.message });
  }
};

// Send motivational notification
const sendMotivationalNotification = async (req, res) => {
  try {
    const { type, customMessage } = req.body;
    
    const user = await User.findById(req.user.id);
    
    let notificationContent;
    
    if (customMessage) {
      notificationContent = {
        message: customMessage,
        type: 'custom'
      };
    } else {
      // Generate AI-based motivational content
      const aiContent = await generateMotivationalContent(user);
      notificationContent = {
        message: aiContent.message,
        quote: aiContent.quote,
        advice: aiContent.advice,
        type: type || 'encouragement'
      };
    }
    
    // Save to history
    const motivationEntry = new MotivationHistory({
      user: req.user.id,
      type: type || 'notification',
      content: notificationContent
    });
    
    await motivationEntry.save();
    
    res.json({
      message: 'Notification sent successfully',
      notification: notificationContent
    });
  } catch (error) {
    console.error('Error sending motivational notification:', error);
    
    // Handle specific AI service errors
    if (error.message.includes('API quota exceeded') || error.message.includes('quota')) {
      return res.status(503).json({ 
        message: 'API quota exceeded. Please check your Google AI Studio usage limits and try again later.',
        error: error.message 
      });
    } else if (error.message.includes('Service temporarily unavailable') || error.message.includes('overloaded')) {
      return res.status(503).json({ 
        message: 'Service temporarily unavailable. The AI model may be overloaded. Please try again later.',
        error: error.message 
      });
    } else {
      return res.status(500).json({ 
        message: 'Error sending notification', 
        error: error.message 
      });
    }
  }
};

module.exports = {
  getDailyMotivation,
  getMotivationHistory,
  markMotivationRead,
  getUserAchievements,
  sendMotivationalNotification
};
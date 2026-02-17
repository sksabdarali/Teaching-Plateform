const Syllabus = require('../models/Syllabus');
const User = require('../models/User');
const { generateExplanation } = require('../utils/aiService');

// Get all topics for a syllabus
const getTopics = async (req, res) => {
  try {
    const { syllabusId } = req.params;
    
    const syllabus = await Syllabus.findById(syllabusId);
    if (!syllabus) {
      return res.status(404).json({ message: 'Syllabus not found' });
    }

    // Check if user has access to this syllabus
    if (syllabus.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    res.json(syllabus.topics);
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({ message: 'Error fetching topics', error: error.message });
  }
};

// Get a specific topic
const getTopic = async (req, res) => {
  try {
    const { syllabusId, topicIndex } = req.params;
    
    const syllabus = await Syllabus.findById(syllabusId);
    if (!syllabus) {
      return res.status(404).json({ message: 'Syllabus not found' });
    }

    // Check if user has access to this syllabus
    if (syllabus.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    const topicIndexNum = parseInt(topicIndex);
    if (topicIndexNum < 0 || topicIndexNum >= syllabus.topics.length) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    res.json(syllabus.topics[topicIndexNum]);
  } catch (error) {
    console.error('Error fetching topic:', error);
    res.status(500).json({ message: 'Error fetching topic', error: error.message });
  }
};

// Mark a topic as completed
const markTopicComplete = async (req, res) => {
  try {
    const { subject, topic } = req.body;
    
    if (!subject || !topic) {
      return res.status(400).json({ message: 'Subject and topic are required' });
    }

    // Update user progress
    const user = await User.findById(req.user.id);
    
    if (!user.progress) {
      user.progress = new Map();
    }
    
    let subjectProgress = user.progress.get(subject) || { 
      completedTopics: [], 
      masteryLevel: 0 
    };
    
    // Add topic if not already completed
    if (!subjectProgress.completedTopics.includes(topic)) {
      subjectProgress.completedTopics.push(topic);
      
      // Calculate mastery level based on completed topics
      // This is a simplified calculation - in a real system, you'd have the total number of topics
      subjectProgress.masteryLevel = Math.min(
        100, 
        Math.round((subjectProgress.completedTopics.length / 10) * 100) // Assuming 10 topics per subject for demo
      );
    }
    
    user.progress.set(subject, subjectProgress);
    
    // Add points for completing topic
    user.points = (user.points || 0) + 10;
    
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
    
    res.json({
      message: 'Topic marked as completed',
      points: user.points,
      streak: user.streak,
      subjectProgress: user.progress.get(subject)
    });
  } catch (error) {
    console.error('Error marking topic as complete:', error);
    res.status(500).json({ message: 'Error marking topic as complete', error: error.message });
  }
};

// Get AI explanation for a topic
const getTopicExplanation = async (req, res) => {
  try {
    const { subject, topic, concept } = req.body;
    
    if (!subject || !topic) {
      return res.status(400).json({ message: 'Subject and topic are required' });
    }

    const explanation = await generateExplanation(subject, topic, concept || topic);

    res.json(explanation);
  } catch (error) {
    console.error('Error getting topic explanation:', error);
    
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
        message: 'Error getting topic explanation', 
        error: error.message 
      });
    }
  }
};

module.exports = {
  getTopics,
  getTopic,
  markTopicComplete,
  getTopicExplanation
};
const express = require('express');
const Quiz = require('../models/Quiz');
const Syllabus = require('../models/Syllabus');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST api/quizzes/generate-from-syllabus/:syllabusId
// @desc    Generate a quiz from a specific syllabus
// @access  Private
router.post('/generate-from-syllabus/:syllabusId', auth, async (req, res) => {
  try {
    const syllabus = await Syllabus.findById(req.params.syllabusId);
    
    if (!syllabus) {
      return res.status(404).json({ message: 'Syllabus not found' });
    }

    // Check if user owns this syllabus
    if (syllabus.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    // Extract content from syllabus topics to generate quiz questions
    let quizContent = '';
    
    // Combine content from all topics in the syllabus
    syllabus.topics.forEach(topic => {
      quizContent += `${topic.title}: ${topic.description || ''} ${topic.content || ''}\n`;
      topic.subtopics.forEach(subtopic => {
        quizContent += `${subtopic.title}: ${subtopic.content || ''}\n`;
      });
    });

    // If no specific topics were found, use the raw data if available
    if (!quizContent.trim() && syllabus.rawData) {
      if (syllabus.rawData.content) {
        quizContent = syllabus.rawData.content;
      } else if (syllabus.rawData.filename) {
        quizContent = `Content from uploaded file: ${syllabus.rawData.filename}`;
      }
    }

    // Generate sample quiz questions based on the syllabus content
    // In a real implementation, this would call an AI service to generate questions
    const sampleQuestions = [
      {
        question: "What is the main concept covered in this unit?",
        options: ["Option 1", "Option 2", "Option 3", "Option 4"],
        correctAnswer: 0,
        explanation: "This is a sample question based on the syllabus content."
      },
      {
        question: "Which of the following is a key principle discussed?",
        options: ["Principle A", "Principle B", "Principle C", "Principle D"],
        correctAnswer: 1,
        explanation: "This tests understanding of key principles from the content."
      },
      {
        question: "What is the significance of the topic covered?",
        options: ["Significance 1", "Significance 2", "Significance 3", "Significance 4"],
        correctAnswer: 2,
        explanation: "This assesses comprehension of the topic's importance."
      }
    ];

    // Create a new quiz based on the syllabus
    const quiz = new Quiz({
      title: `${syllabus.title} - Generated Quiz`,
      description: `Quiz generated from syllabus: ${syllabus.title}`,
      subject: syllabus.subject,
      topic: syllabus.title,
      grade: syllabus.grade,
      board: syllabus.board,
      questions: sampleQuestions,
      createdBy: req.user.id,
      syllabusId: syllabus._id // Link to the source syllabus
    });

    await quiz.save();

    res.status(201).json(quiz);
  } catch (error) {
    console.error('Error generating quiz from syllabus:', error);
    res.status(500).json({ message: 'Server error while generating quiz', error: error.message });
  }
});

// @route   GET api/quizzes/by-syllabus/:syllabusId
// @desc    Get all quizzes associated with a specific syllabus
// @access  Private
router.get('/by-syllabus/:syllabusId', auth, async (req, res) => {
  try {
    const syllabus = await Syllabus.findById(req.params.syllabusId);
    
    if (!syllabus) {
      return res.status(404).json({ message: 'Syllabus not found' });
    }

    // Check if user owns this syllabus
    if (syllabus.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    // Find all quizzes associated with this syllabus
    const quizzes = await Quiz.find({ 
      syllabusId: req.params.syllabusId,
      createdBy: req.user.id 
    }).sort({ createdAt: -1 });

    res.json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes for syllabus:', error);
    res.status(500).json({ message: 'Server error while fetching quizzes', error: error.message });
  }
});

// @route   POST api/quizzes
// @desc    Create a new quiz
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, subject, topic, grade, board, questions } = req.body;

    const quiz = new Quiz({
      title,
      description,
      subject,
      topic,
      grade,
      board,
      questions,
      createdBy: req.user.id
    });

    await quiz.save();

    res.status(201).json(quiz);
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET api/quizzes
// @desc    Get all quizzes for the user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const quizzes = await Quiz.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    res.json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET api/quizzes/:id
// @desc    Get a specific quiz
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Check if user owns this quiz
    if (quiz.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    res.json(quiz);
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT api/quizzes/:id
// @desc    Update a quiz
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, description, subject, topic, grade, board, questions } = req.body;

    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Check if user owns this quiz
    if (quiz.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    // Update quiz
    const updatedQuiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      { title, description, subject, topic, grade, board, questions },
      { new: true }
    );

    res.json(updatedQuiz);
  } catch (error) {
    console.error('Error updating quiz:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE api/quizzes/:id
// @desc    Delete a quiz
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Check if user owns this quiz
    if (quiz.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await Quiz.findByIdAndDelete(req.params.id);

    res.json({ message: 'Quiz removed' });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
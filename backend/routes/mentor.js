const express = require('express');
const { generateContentWithFallback } = require('../utils/aiService');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST api/mentor/chat
// @desc    Chat with AI mentor to solve doubts
// @access  Private
router.post('/chat', auth, async (req, res) => {
    try {
        const { message, conversationHistory = [], subject } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ message: 'Message is required' });
        }

        // Get user profile for context
        const user = await User.findById(req.user.id).select('name grade board subjects');

        // Build conversation context from history (last 10 messages)
        const recentHistory = conversationHistory.slice(-10);
        let conversationContext = '';
        if (recentHistory.length > 0) {
            conversationContext = '\n\nPrevious conversation:\n' +
                recentHistory.map(msg =>
                    `${msg.role === 'user' ? 'Student' : 'Mentor'}: ${msg.content}`
                ).join('\n');
        }

        const subjectContext = subject ? `The student is currently studying: ${subject}.` : '';
        const userContext = user ? `Student info: ${user.name || 'Student'}, Grade: ${user.grade || 'N/A'}, Board: ${user.board || 'N/A'}, Subjects: ${user.subjects?.join(', ') || 'N/A'}.` : '';

        const prompt = `You are a friendly, encouraging, and highly knowledgeable AI mentor and teacher on a learning platform. Your role is to help students understand concepts, solve problems, and guide their learning.

${userContext}
${subjectContext}

Guidelines:
- Explain concepts clearly and step-by-step, as a great teacher would
- Use examples, analogies, and real-world connections to make concepts easier
- If the student is stuck on a problem, guide them through the solution process rather than just giving the answer
- Be encouraging and supportive — celebrate when they understand something
- Use markdown formatting: **bold** for key terms, bullet points for lists, and code blocks for formulas or code
- Keep responses focused and appropriately detailed (not too long, not too short)
- If clarifying questions would help, ask them
- If the question is about a specific subject, give a subject-appropriate response
${conversationContext}

Student's current message: ${message}

Respond as the mentor:`;

        const response = await generateContentWithFallback(prompt);

        res.json({
            reply: response,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in mentor chat:', error);

        // Handle specific AI service errors
        if (error.message && (error.message.includes('API quota exceeded') || error.message.includes('quota'))) {
            return res.status(503).json({
                message: 'API quota exceeded. Please try again later.',
                error: error.message
            });
        } else if (error.message && (error.message.includes('Service temporarily unavailable') || error.message.includes('overloaded'))) {
            return res.status(503).json({
                message: 'AI service is temporarily busy. Please try again in a moment.',
                error: error.message
            });
        } else {
            return res.status(500).json({
                message: 'Error getting mentor response. Please try again.',
                error: error.message
            });
        }
    }
});

// @route   POST api/mentor/suggest-topics
// @desc    Get suggested questions/topics based on user's subjects
// @access  Private
router.post('/suggest-topics', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('subjects grade board');
        const { subject } = req.body;

        const targetSubject = subject || (user.subjects && user.subjects.length > 0 ? user.subjects[0] : 'General');

        const prompt = `You are a study mentor. Generate 6 short, interesting study questions or topics a student might want to explore.

Student Grade: ${user.grade || 'High School'}
Subject: ${targetSubject}

Respond with ONLY valid JSON, no markdown:
{
  "suggestions": [
    "What is the Pythagorean theorem and how do I use it?",
    "Explain photosynthesis step by step",
    "How do I solve quadratic equations?",
    "What are Newton's laws of motion?",
    "Help me understand the periodic table",
    "Explain the French Revolution briefly"
  ]
}`;

        const response = await generateContentWithFallback(prompt);

        // Try to parse JSON
        let suggestions;
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : response);
            suggestions = parsed.suggestions || [];
        } catch {
            suggestions = [
                `Explain a key concept in ${targetSubject}`,
                `Help me solve a problem in ${targetSubject}`,
                `What are the most important topics in ${targetSubject}?`,
                `Give me study tips for ${targetSubject}`,
                `Explain the basics of ${targetSubject}`,
                `What should I focus on in ${targetSubject}?`
            ];
        }

        res.json({ suggestions, subject: targetSubject });
    } catch (error) {
        console.error('Error generating suggestions:', error);
        res.status(500).json({
            message: 'Could not generate suggestions',
            suggestions: [
                'Explain a difficult concept to me',
                'Help me solve a math problem',
                'What study techniques work best?',
                'Quiz me on a topic',
                'Explain something in simple terms',
                'Help me prepare for an exam'
            ]
        });
    }
});

module.exports = router;

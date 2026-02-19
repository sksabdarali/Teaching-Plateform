const Quiz = require('../models/Quiz');
const Syllabus = require('../models/Syllabus');
const User = require('../models/User');
const { generateContentWithFallback, extractJsonFromResponse } = require('../utils/aiService');
const { parseSyllabusFromText } = require('../utils/syllabusParser');

// Simple rate limiter for AI endpoints - PROBLEM 8 FIX
const aiRateLimiter = new Map(); // Store user requests by timestamp

// Check if user can make AI request (max 2 requests per 15 minutes) - PROBLEM 8 FIX
const canMakeAIRequest = (userId) => {
  const now = Date.now();
  const userRequests = aiRateLimiter.get(userId) || [];

  // Remove requests older than 15 minutes
  const fifteenMinutesAgo = now - 15 * 60 * 1000;
  const recentRequests = userRequests.filter(timestamp => timestamp > fifteenMinutesAgo);

  // Allow only 2 requests per 15 minutes
  if (recentRequests.length >= 2) {
    return false;
  }

  // Add current request
  recentRequests.push(now);
  aiRateLimiter.set(userId, recentRequests);
  return true;
};

// Parse raw syllabus data when needed
const parseSyllabusData = async (syllabus) => {
  if (syllabus.parsedData) {
    return syllabus.parsedData;
  }

  // Parse the raw content if not already parsed
  const parsed = await parseSyllabusFromText(syllabus.rawContent || syllabus.content);
  return parsed;
};

// Validate study materials data structure - PROBLEM 5 FIX
const validateStudyMaterials = (data) => {
  if (!data || typeof data !== 'object') {
    return null;
  }

  // Check if it has the required structure
  const requiredFields = ['title', 'content'];
  const hasRequired = requiredFields.every(field => field in data && data[field] !== undefined);

  if (!hasRequired) {
    return null;
  }

  // Sanitize the data to prevent XSS and ensure valid structure
  return {
    title: typeof data.title === 'string' ? data.title.substring(0, 200) : 'Untitled',
    content: typeof data.content === 'string' ? data.content.replace(/^```[a-z]*\s*\n?|```$/g, '').trim().substring(0, 20000) : '',
    examples: Array.isArray(data.examples) ? data.examples.slice(0, 5).map(ex =>
      typeof ex === 'object' && ex.problem && ex.solution ? {
        problem: ex.problem.substring(0, 1000),
        solution: ex.solution.substring(0, 2000)
      } : typeof ex === 'string' ? { problem: ex.substring(0, 1000), solution: 'Solution not provided' } : { problem: 'Problem not provided', solution: 'Solution not provided' }
    ) : [],
    practiceProblems: Array.isArray(data.practiceProblems) ? data.practiceProblems.slice(0, 3).map(problem =>
      typeof problem === 'object' && problem.problem && problem.solution ? {
        problem: problem.problem.substring(0, 1000),
        solution: problem.solution.substring(0, 2000)
      } : typeof problem === 'string' ? { problem: problem.substring(0, 1000), solution: 'Solution not provided' } : { problem: 'Problem not provided', solution: 'Solution not provided' }
    ) : [],
    keyPoints: Array.isArray(data.keyPoints) ? data.keyPoints.slice(0, 10).map(point =>
      typeof point === 'string' ? point.substring(0, 200) : ''
    ) : [],
    studyTips: Array.isArray(data.studyTips) ? data.studyTips.slice(0, 5).map(tip =>
      typeof tip === 'string' ? tip.substring(0, 200) : ''
    ) : [],
    relatedTopics: Array.isArray(data.relatedTopics) ? data.relatedTopics.slice(0, 10).map(topic =>
      typeof topic === 'string' ? topic.substring(0, 100) : ''
    ) : []
  };
};

// Generate quiz from syllabus using AI
const generateQuiz = async (req, res) => {
  try {
    const { subject, topic, difficulty, numQuestions = 5, useSyllabus, syllabusId } = req.body; // Default to 5 for free tier

    // Check rate limit - PROBLEM 8 FIX
    if (!canMakeAIRequest(req.user.id)) {
      return res.status(429).json({
        message: 'Rate limit exceeded. Please wait before making another AI request.'
      });
    }

    // Validate inputs (reduce for free tier) - PROBLEM 6 FIX
    if (numQuestions > 5) { // Free tier limit
      return res.status(400).json({ message: 'Maximum 5 questions allowed per request (free tier)' });
    }

    let syllabusTopics = [];

    // If user wants to use their syllabus, fetch and parse it
    if (useSyllabus || syllabusId) {
      const query = syllabusId ? { _id: syllabusId } : { createdBy: req.user.id };
      const userSyllabi = await Syllabus.find(query);

      for (const syllabus of userSyllabi) {
        // Parse the raw syllabus data when needed
        const topics = await parseSyllabusData(syllabus);

        topics.forEach(t => {
          syllabusTopics.push({
            title: t.title,
            description: t.description,
            content: t.content,
            subject: syllabus.subject,
            grade: syllabus.grade
          });

          // Add subtopics too
          t.subtopics.forEach(st => {
            syllabusTopics.push({
              title: st.title,
              content: st.content,
              subject: syllabus.subject,
              grade: syllabus.grade
            });
          });
        });
      }
    }

    let aiPrompt;
    if (syllabusTopics.length > 0) {
      // Use syllabus topics to generate quiz (aggressively truncated for free tier) - PROBLEM 6 FIX
      const syllabusContent = syllabusTopics
        .map(t => `${t.title}: ${(t.description || t.content).substring(0, 300)}`) // Truncate content
        .slice(0, 3) // Limit topics for free tier
        .join('\n');

      aiPrompt = `
        Create ${Math.min(numQuestions, 5)} multiple choice questions based on the following syllabus content (truncated for brevity):
        ${syllabusContent}
        
        Format the response as JSON with the following structure:
        {
          "title": "Quiz from Syllabus",
          "description": "Quiz based on your uploaded syllabus",
          "subject": "${subject || 'N/A'}",
          "topic": "Syllabus-based",
          "questions": [
            {
              "question": "The question text",
              "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
              "correctAnswer": 0,
              "explanation": "Explanation of why the answer is correct"
            }
          ]
        }
        
        Difficulty level: ${difficulty || 'beginner'}
        Make sure the questions are appropriate for the difficulty level.
        Ensure that the correctAnswer is the index (0-3) of the correct option in the options array.
      `;
    } else {
      // Generate general quiz based on subject and topic
      aiPrompt = `
        Create ${Math.min(numQuestions, 5)} multiple choice questions about ${topic || 'the topic'} in ${subject || 'the subject'}.
        
        Format the response as JSON with the following structure:
        {
          "title": "Quiz: ${topic || 'General Topic'}",
          "description": "Quiz about ${topic || 'general topic'} in ${subject || 'general subject'}",
          "subject": "${subject || 'General'}",
          "topic": "${topic || 'General'}",
          "questions": [
            {
              "question": "The question text",
              "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
              "correctAnswer": 0,
              "explanation": "Explanation of why the answer is correct"
            }
          ]
        }
        
        Difficulty level: ${difficulty || 'beginner'}
        Make sure the questions are appropriate for the difficulty level.
        Ensure that the correctAnswer is the index (0-3) of the correct option in the options array.
        
        Keep responses concise due to API limitations.
      `;
    }

    try {
      const response = await generateContentWithFallback(aiPrompt, req.user.id);

      let quizData = extractJsonFromResponse(response);

      // Validate and sanitize the data - PROBLEM 5 FIX
      if (!quizData || !quizData.questions || !Array.isArray(quizData.questions)) {
        // Return fallback data if validation fails - PROBLEM 7 FIX
        return res.status(200).json({
          title: `Quiz: ${topic || 'General Topic'}`,
          description: 'This is a placeholder quiz due to AI generation issues. The AI system may be temporarily unavailable.',
          subject: subject || 'General',
          topic: topic || 'General',
          questions: [
            {
              question: 'Sample Question - AI service temporarily unavailable',
              options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
              correctAnswer: 0,
              explanation: 'This is a sample question. The AI service may be temporarily unavailable.'
            }
          ]
        });
      }

      // Validate each question
      quizData.questions = quizData.questions
        .filter(q => q.question && Array.isArray(q.options) && q.options.length >= 2)
        .map(q => ({
          question: typeof q.question === 'string' ? q.question.substring(0, 500) : 'Untitled question',
          options: Array.isArray(q.options)
            ? q.options.slice(0, 4).map(opt => typeof opt === 'string' ? opt.substring(0, 200) : 'Option')
            : ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
          correctAnswer: typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer < 4
            ? q.correctAnswer
            : 0,
          explanation: typeof q.explanation === 'string' ? q.explanation.substring(0, 500) : 'No explanation provided'
        }));

      // If no valid questions remain, return fallback
      if (quizData.questions.length === 0) {
        return res.status(200).json({
          title: `Quiz: ${topic || 'General Topic'}`,
          description: 'This is a placeholder quiz due to AI generation issues.',
          subject: subject || 'General',
          topic: topic || 'General',
          questions: [
            {
              question: 'Sample Question - No valid questions generated',
              options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
              correctAnswer: 0,
              explanation: 'The AI service did not generate valid questions. Please try again later.'
            }
          ]
        });
      }

      // Create and save the quiz in the database
      const quiz = new Quiz({
        title: quizData.title,
        description: quizData.description,
        subject: quizData.subject,
        topic: quizData.topic,
        grade: 'N/A', // Could be derived from syllabus if available
        board: 'N/A', // Could be derived from syllabus if available
        questions: quizData.questions,
        createdBy: req.user.id
      });

      await quiz.save();

      res.json(quiz);
    } catch (error) {
      console.error('Error generating or parsing AI response:', error);

      // Check if it's a quota error - PROBLEM 3 FIX
      if (error.normalizedStatus === 429) {
        return res.status(200).json({
          title: `Quiz: ${topic || 'General Topic'}`,
          description: 'AI service temporarily unavailable due to quota limits. Please try again later.',
          subject: subject || 'General',
          topic: topic || 'General',
          questions: [
            {
              question: 'Sample Question - Quota exceeded',
              options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
              correctAnswer: 0,
              explanation: 'AI service quota exceeded. Please try again later.'
            }
          ]
        });
      } else if (error.normalizedStatus === 503) {
        return res.status(200).json({
          title: `Quiz: ${topic || 'General Topic'}`,
          description: 'Service temporarily unavailable. Please try again later.',
          subject: subject || 'General',
          topic: topic || 'General',
          questions: [
            {
              question: 'Sample Question - Service unavailable',
              options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
              correctAnswer: 0,
              explanation: 'AI service temporarily unavailable. Please try again later.'
            }
          ]
        });
      } else {
        // Return fallback data instead of error - PROBLEM 7 FIX
        return res.status(200).json({
          title: `Quiz: ${topic || 'General Topic'}`,
          description: 'This is placeholder quiz due to AI generation issues. The AI system may be temporarily unavailable.',
          subject: subject || 'General',
          topic: topic || 'General',
          questions: [
            {
              question: 'Sample Question - AI service issue',
              options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
              correctAnswer: 0,
              explanation: 'The AI service encountered an issue. Please try again later.'
            }
          ]
        });
      }
    }
  } catch (error) {
    console.error('Error generating quiz:', error);
    res.status(500).json({ message: 'Error generating quiz', error: error.message });
  }
};

// Generate learning content using AI
const generateLearningContent = async (req, res) => {
  try {
    const { subject, topic, contentType = 'explanation', syllabusId } = req.body;

    // Check rate limit - PROBLEM 8 FIX
    if (!canMakeAIRequest(req.user.id)) {
      return res.status(429).json({
        message: 'Rate limit exceeded. Please wait before making another AI request.'
      });
    }

    let syllabusContent = '';
    if (syllabusId) {
      const syllabus = await Syllabus.findById(syllabusId);
      if (syllabus && syllabus.content) {
        // Truncate content for free tier
        syllabusContent = syllabus.content.substring(0, 1000) + '...'; // Aggressively truncate
      }
    }

    const prompt = `
      Generate educational content about ${topic || 'the topic'} in ${subject || 'the subject'}.
      
      Content type: ${contentType}
      
      ${syllabusContent ? `Based on the following syllabus content (truncated for brevity):\n${syllabusContent}` : ''}
      
      Include:
      1. Clear explanation of concepts
      2. Practical examples (max 2)
      3. Key takeaways (max 3)
      4. Study tips (max 2)
      
      Format the response as JSON:
      {
        "title": "Learning Content: [topic]",
        "content": "Detailed explanation...",
        "examples": ["Example 1", "Example 2"],
        "keyTakeaways": ["Takeaway 1", "Takeaway 2"],
        "studyTips": ["Tip 1", "Tip 2"]
      }
      
      Keep responses concise due to API limitations.
    `;

    try {
      const response = await generateContentWithFallback(prompt, req.user.id);

      let contentData = extractJsonFromResponse(response);

      // Validate and sanitize the data - PROBLEM 5 FIX
      if (!contentData || !contentData.content) {
        // Return fallback data if validation fails - PROBLEM 7 FIX
        return res.status(200).json({
          title: `Learning Content: ${topic || 'General Topic'}`,
          content: 'This is placeholder content due to AI generation issues. The AI system may be temporarily unavailable.',
          examples: ['Example 1', 'Example 2'],
          keyTakeaways: ['Takeaway 1', 'Takeaway 2'],
          studyTips: ['Tip 1', 'Tip 2']
        });
      }

      res.json(contentData);
    } catch (error) {
      console.error('Error generating or parsing AI response:', error);

      // Check if it's a quota error - PROBLEM 3 FIX
      if (error.normalizedStatus === 429) {
        return res.status(200).json({
          title: `Learning Content: ${topic || 'General Topic'}`,
          content: 'AI service temporarily unavailable due to quota limits. Please try again later.',
          examples: ['Example 1', 'Example 2'],
          keyTakeaways: ['Takeaway 1', 'Takeaway 2'],
          studyTips: ['Tip 1', 'Tip 2']
        });
      } else if (error.normalizedStatus === 503) {
        return res.status(200).json({
          title: `Learning Content: ${topic || 'General Topic'}`,
          content: 'Service temporarily unavailable. Please try again later.',
          examples: ['Example 1', 'Example 2'],
          keyTakeaways: ['Takeaway 1', 'Takeaway 2'],
          studyTips: ['Tip 1', 'Tip 2']
        });
      } else {
        // Return fallback data instead of error - PROBLEM 7 FIX
        return res.status(200).json({
          title: `Learning Content: ${topic || 'General Topic'}`,
          content: 'This is placeholder content due to AI generation issues. The AI system may be temporarily unavailable.',
          examples: ['Example 1', 'Example 2'],
          keyTakeaways: ['Takeaway 1', 'Takeaway 2'],
          studyTips: ['Tip 1', 'Tip 2']
        });
      }
    }
  } catch (error) {
    console.error('Error generating learning content:', error);
    res.status(500).json({ message: 'Error generating learning content', error: error.message });
  }
};

// Generate study materials using AI
const generateStudyMaterials = async (req, res) => {
  try {
    const { subject, topic, syllabusId } = req.body;

    // Check rate limit - PROBLEM 8 FIX
    if (!canMakeAIRequest(req.user.id)) {
      return res.status(429).json({
        message: 'Rate limit exceeded. Please wait before making another AI request.'
      });
    }

    let syllabusContent = '';
    if (syllabusId) {
      const syllabus = await Syllabus.findById(syllabusId);
      if (syllabus && syllabus.content) {
        // Truncate content for free tier
        syllabusContent = syllabus.content.substring(0, 1000) + '...'; // Aggressively truncate
      }
    }

    const prompt = `
      Generate detailed study materials for ${topic || 'the topic'} in ${subject || 'the subject'} as a professional teacher would prepare.
      ${syllabusContent ? `\nBased on the following syllabus content (truncated for brevity):\n${syllabusContent}` : ''}
      
      Structure the study materials like a professional teacher would in a classroom:
      1. Start with an introduction explaining why this topic is important
      2. Provide a clear and comprehensive explanation of the concepts
      3. Include multiple detailed examples with step-by-step solutions
      4. Add practice problems with worked-out solutions
      5. Highlight key points to remember
      6. Provide study tips and strategies
      7. List related topics for further study
      
      Include in your response:
      - A comprehensive explanation of the concepts
      - At least 3-5 detailed examples with step-by-step solutions
      - 2-3 practice problems with complete solutions
      - 5-7 key points to remember
      - 3-5 study tips
      - 3-5 related topics
      
      FORMAT THE RESPONSE AS A SINGLE VALID JSON OBJECT:
      - Use ONLY standard JSON (no comments, no triple backticks).
      - CRITICAL: Escape all double quotes within strings using a backslash (\").
      - CRITICAL: Use literal "\\n" strings for newlines within the "content" or "solution" fields. DO NOT use raw newlines (Enter key) inside your JSON string values.
      
      Structure:
      {
        "title": "Detailed Study Materials: [topic]",
        "content": "Comprehensive explanation using markdown-style headings (# Title, ## Section, ### Subsection) and bold text (**bold**). Use \\n for newlines.",
        "examples": [
          {
            "problem": "Example problem statement",
            "solution": "Step-by-step solution with explanation. Use \\n for newlines."
          }
        ],
        "practiceProblems": [
          {
            "problem": "Practice problem statement",
            "solution": "Complete solution with explanation. Use \\n for newlines."
          }
        ],
        "keyPoints": ["Key point 1", "Key point 2"],
        "studyTips": ["Tip 1", "Tip 2"],
        "relatedTopics": ["Topic 1", "Topic 2"]
      }
      
      Make the content educational, comprehensive, and suitable for students.
      RETURN ONLY THE JSON OBJECT.
    `;

    try {
      const response = await generateContentWithFallback(prompt, req.user.id);

      let materialsData;
      try {
        materialsData = extractJsonFromResponse(response);
      } catch (jsonError) {
        console.error('JSON parsing failed, using raw response:', jsonError.message);
        // If JSON parsing fails completely, create a basic structure from the raw response
        materialsData = {
          title: `Study Materials: ${topic || 'General Topic'}`,
          content: response.replace(/^```[a-z]*\s*\n?|```$/g, '').substring(0, 15000).trim(), // Remove markdown code blocks and increase limit
          examples: [],
          practiceProblems: [],
          keyPoints: [],
          studyTips: [],
          relatedTopics: []
        };
      }

      // Validate and sanitize the data - PROBLEM 5 FIX
      const validatedMaterialsData = validateStudyMaterials(materialsData);

      if (!validatedMaterialsData) {
        // Return fallback data if validation fails - PROBLEM 7 FIX
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        return res.status(200).json({
          title: `Study Materials: ${topic || 'General Topic'}`,
          content: 'This is placeholder study material due to AI generation issues. The AI system may be temporarily unavailable.',
          examples: [],
          practiceProblems: [],
          keyPoints: ['Key point 1', 'Key point 2'],
          studyTips: ['Tip 1', 'Tip 2'],
          relatedTopics: ['Topic 1', 'Topic 2']
        });
      }

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.json(validatedMaterialsData);
    } catch (error) {
      console.error('Error generating or parsing AI response:', error);

      // Check if it's a quota error - PROBLEM 3 FIX
      if (error.normalizedStatus === 429) {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        return res.status(200).json({
          title: `Study Materials: ${topic || 'General Topic'}`,
          content: 'AI service temporarily unavailable due to quota limits. Please try again later.',
          examples: ['Example 1', 'Example 2'],
          keyPoints: ['Key point 1', 'Key point 2'],
          studyTips: ['Tip 1', 'Tip 2'],
          relatedTopics: ['Topic 1', 'Topic 2']
        });
      } else if (error.normalizedStatus === 503) {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        return res.status(200).json({
          title: `Study Materials: ${topic || 'General Topic'}`,
          content: 'Service temporarily unavailable. Please try again later.',
          examples: ['Example 1', 'Example 2'],
          keyPoints: ['Key point 1', 'Key point 2'],
          studyTips: ['Tip 1', 'Tip 2'],
          relatedTopics: ['Topic 1', 'Topic 2']
        });
      } else {
        // Return fallback data instead of error - PROBLEM 7 FIX
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        return res.status(200).json({
          title: `Study Materials: ${topic || 'General Topic'}`,
          content: 'This is placeholder study material due to AI generation issues. The AI system may be temporarily unavailable.',
          examples: [],
          practiceProblems: [],
          keyPoints: ['Key point 1', 'Key point 2'],
          studyTips: ['Tip 1', 'Tip 2'],
          relatedTopics: ['Topic 1', 'Topic 2']
        });
      }
    }
  } catch (error) {
    console.error('Error generating study materials:', error);
    res.status(500).json({ message: 'Error generating study materials', error: error.message });
  }
};

module.exports = {
  generateQuiz,
  generateLearningContent,
  generateStudyMaterials
};
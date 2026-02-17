const express = require('express');
const multer = require('multer');
const path = require('path');
const Syllabus = require('../models/Syllabus');
const { extractUnits } = require('../utils/fileParser');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure multer with more flexible file filter and error handling
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // More flexible mimetype checking
    const allowedMimeTypes = [
      'application/pdf',      // Standard PDF
      'application/x-pdf',    // Alternative PDF
      'application/octet-stream', // Generic binary stream (sometimes PDFs)
      'text/plain'           // Text files
    ];

    const fileExtension = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.pdf', '.txt'];

    // Check if it's an allowed mimetype or has an allowed extension
    const isAllowedType = allowedMimeTypes.includes(file.mimetype) ||
      allowedExtensions.includes(fileExtension);

    if (isAllowedType) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and TXT files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Error handling middleware for multer
const multerErrorHandler = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File too large. Maximum size is 5MB.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        message: 'Unexpected field name. Expected "syllabusFile".'
      });
    }
    return res.status(400).json({
      message: `File upload error: ${error.message}`
    });
  }

  if (error.message.includes('Only PDF and TXT files are allowed')) {
    return res.status(400).json({
      message: error.message
    });
  }

  // For other errors
  return res.status(500).json({
    message: 'File upload error',
    error: error.message
  });
};

// @route   POST api/syllabi-upload/upload
// @desc    Upload syllabus file (store raw data, parse later when needed)
// @access  Private
router.post('/upload', auth, (req, res, next) => {
  // Apply multer middleware with error handling
  upload.single('syllabusFile')(req, res, (err) => {
    if (err) {
      multerErrorHandler(err, req, res, next);
    } else {
      next();
    }
  });
}, async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        message: 'No file uploaded. Please ensure the file is sent as "syllabusFile" field in form data.'
      });
    }

    // Log for debugging
    console.log('File uploaded:', {
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      bufferLength: req.file.buffer.length
    });

    // Extract subject, grade, and board from file name or content if not provided in request
    let subject = req.body.subject;
    let grade = req.body.grade;
    let board = req.body.board;

    // Try to extract from filename if not provided
    if (!subject) {
      const fileName = req.file.originalname;
      const fileNameMatch = fileName.match(/([A-Z]{2,4}\d{3,4})/); // Look for patterns like IT222, CS222, etc.
      if (fileNameMatch) {
        subject = fileNameMatch[1];
      } else {
        subject = fileName.split('_')[0] || 'General';
      }
    }

    // Try to extract grade from file content or default
    if (!grade) {
      grade = 'Not specified';
      // Look for academic year patterns in the filename
      const fileNameLower = req.file.originalname.toLowerCase();
      if (fileNameLower.includes('first') || fileNameLower.includes('1st') || fileNameLower.includes('1st_year')) {
        grade = 'First Year';
      } else if (fileNameLower.includes('second') || fileNameLower.includes('2nd') || fileNameLower.includes('2nd_year')) {
        grade = 'Second Year';
      } else if (fileNameLower.includes('third') || fileNameLower.includes('3rd') || fileNameLower.includes('3rd_year')) {
        grade = 'Third Year';
      } else if (fileNameLower.includes('fourth') || fileNameLower.includes('4th') || fileNameLower.includes('4th_year')) {
        grade = 'Fourth Year';
      }
    }

    // Default board if not provided
    if (!board) {
      board = 'Academic';
    }

    // Create a new syllabus document with raw file data
    const syllabusData = {
      title: req.body.title || `${req.file.originalname.split('.')[0]} Syllabus`,
      description: req.body.description || `Raw file stored from ${req.file.originalname}`,
      grade: grade,
      board: board,
      subject: subject,
      // Store raw file data instead of parsed topics
      rawData: {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        buffer: req.file.buffer, // Store the raw buffer
        encoding: 'base64', // Specify encoding for storage
        uploadedAt: new Date()
      },
      topics: [], // Leave empty initially; populate when accessed
      createdBy: req.user.id
    };

    console.log('Creating syllabus with raw data:', syllabusData.title);
    const syllabus = new Syllabus(syllabusData);

    console.log('Attempting to save syllabus to database');
    await syllabus.save();
    console.log('Syllabus saved successfully with raw file data');

    res.status(201).json({
      message: 'Syllabus file uploaded successfully. Content will be parsed when accessed.',
      syllabus: {
        _id: syllabus._id,
        title: syllabus.title,
        description: syllabus.description,
        grade: syllabus.grade,
        board: syllabus.board,
        subject: syllabus.subject,
        topics: [],
        filename: syllabus.rawData.filename,
        size: syllabus.rawData.size,
        uploadedAt: syllabus.createdAt
      }
    });
  } catch (error) {
    console.error('Error uploading syllabus:', error);

    return res.status(500).json({
      message: 'Error uploading syllabus',
      error: error.message
    });
  }
});

// @route   POST api/syllabi-upload/create-from-text
// @desc    Create syllabus from text content
// @access  Private
router.post('/create-from-text', auth, async (req, res) => {
  try {
    const { title, description, grade, board, subject, content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    // Store text content directly without parsing
    const syllabus = new Syllabus({
      title: title || 'Syllabus from Text',
      description: description || 'Syllabus created from text content',
      grade: grade || 'Not specified',
      board: board || 'Not specified',
      subject: subject || 'Not specified',
      rawData: {
        filename: 'text_input.txt',
        mimetype: 'text/plain',
        size: content.length,
        content: content, // Store the raw content
        uploadedAt: new Date()
      },
      topics: [], // Leave empty initially; populate when accessed
      createdBy: req.user.id
    });

    await syllabus.save();

    res.status(201).json({
      message: 'Syllabus created from text successfully',
      syllabus: {
        id: syllabus._id,
        title: syllabus.title,
        description: syllabus.description,
        grade: syllabus.grade,
        board: syllabus.board,
        subject: syllabus.subject,
        uploadedAt: syllabus.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating syllabus from text:', error);
    res.status(500).json({ message: 'Error creating syllabus', error: error.message });
  }
});

// extractUnits is imported from ../utils/fileParser

// @route   GET api/syllabi-upload/:id/parse
// @desc    Parse and return syllabus content (parse only when requested)
// @access  Private
router.get('/:id/parse', auth, async (req, res) => {
  try {
    const syllabus = await Syllabus.findById(req.params.id);

    if (!syllabus) {
      return res.status(404).json({ message: 'Syllabus not found' });
    }

    // Check if user owns this syllabus
    if (syllabus.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    // If we already have parsed topics, return them
    if (syllabus.topics && syllabus.topics.length > 0) {
      return res.json({
        message: 'Syllabus content retrieved successfully',
        topics: syllabus.topics
      });
    }

    // Extract content from raw data
    let rawContent = '';
    let mimetype = '';
    if (syllabus.rawData && syllabus.rawData.buffer) {
      // For uploaded files
      const buffer = Buffer.from(syllabus.rawData.buffer);
      mimetype = syllabus.rawData.mimetype || '';

      // Convert buffer to string based on file type
      if (mimetype.includes('pdf')) {
        // For PDF files, use pdf-parse to extract text
        const pdfParse = require('pdf-parse');
        try {
          const pdfData = await pdfParse(buffer);
          rawContent = pdfData.text;

          // Validate that we got content from the PDF
          if (!rawContent || !rawContent.trim()) {
            console.warn('Warning: PDF appears to have no readable text content');
            rawContent = 'PDF content could not be extracted. The file may be scanned or encrypted.';
          }
        } catch (error) {
          console.error('Error parsing PDF:', error);
          rawContent = 'Error extracting content from PDF file.';
        }
      } else {
        // For text files
        rawContent = buffer.toString('utf8');
      }
    } else if (syllabus.rawData && syllabus.rawData.content) {
      // For text input
      rawContent = syllabus.rawData.content;
    }

    console.log('Raw content length:', rawContent.length);
    console.log('Raw content preview:', rawContent.substring(0, 300));

    // Use the robust extractUnits from fileParser
    const units = extractUnits(rawContent);
    console.log(`Extracted ${units.length} units`);

    // Create separate topics for each unit
    let topics = units.map((unit, index) => ({
      title: unit.title,
      description: `Content for ${unit.title}`,
      content: unit.content,
      subtopics: [],
      resources: []
    }));

    // Ensure we have at least 1 unit
    if (topics.length === 0) {
      topics = [{
        title: 'Course Content',
        description: 'General course content',
        content: rawContent.substring(0, 2000) + (rawContent.length > 2000 ? '...' : ''),
        subtopics: [],
        resources: []
      }];
    }

    // Save parsed topics back to the syllabus so we don't re-parse next time
    try {
      syllabus.topics = topics;
      await syllabus.save();
      console.log('Saved parsed topics to syllabus document');
    } catch (saveErr) {
      console.error('Error saving parsed topics (non-fatal):', saveErr.message);
    }

    res.json({
      message: 'Syllabus content retrieved successfully',
      topics: syllabus.topics
    });
  } catch (error) {
    console.error('Error parsing syllabus:', error);
    res.status(500).json({ message: 'Error parsing syllabus', error: error.message });
  }
});

module.exports = router;
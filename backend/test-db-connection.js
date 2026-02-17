const mongoose = require('mongoose');
require('dotenv').config();

const testConnection = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/teaching-platform';
    console.log('Using URI:', uri.replace(/\/\/(.*)@/, '//***@')); // Hide credentials in log
    
    await mongoose.connect(uri);
    
    console.log('✅ MongoDB connection successful!');
    
    // Test basic operations
    console.log('Testing basic operations...');
    
    // Get list of collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections found:', collections.map(c => c.name));
    
    // Test user model
    const User = require('./models/User');
    const userCount = await User.countDocuments();
    console.log('Total users in database:', userCount);
    
    // Test syllabus model
    const Syllabus = require('./models/Syllabus');
    const syllabusCount = await Syllabus.countDocuments();
    console.log('Total syllabi in database:', syllabusCount);
    
    // Test quiz model
    const Quiz = require('./models/Quiz');
    const quizCount = await Quiz.countDocuments();
    console.log('Total quizzes in database:', quizCount);
    
    console.log('✅ All database operations successful!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

testConnection();
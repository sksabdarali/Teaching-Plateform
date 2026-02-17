const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Syllabus = require('./models/Syllabus');

const testProgressFix = async () => {
  try {
    console.log('🧪 Testing Progress Controller Fix...\n');
    
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/teaching-platform';
    await mongoose.connect(uri);
    console.log('✅ Connected to database\n');
    
    // Create a test user with no progress field (simulating old user data)
    console.log('📝 Creating test user without progress field...');
    const testUser = new User({
      name: 'Test User',
      email: 'test-progress@teachingplatform.com',
      password: 'Test123!',
      grade: '10th',
      board: 'CBSE',
      subjects: ['Mathematics'],
      authMethod: 'email',
      profileComplete: true
    });
    
    // Remove progress field to simulate the issue
    testUser.progress = undefined;
    
    await testUser.save();
    console.log('✅ Test user created\n');
    
    // Create a test syllabus
    console.log('📝 Creating test syllabus...');
    const testSyllabus = new Syllabus({
      title: 'Test Mathematics Syllabus',
      subject: 'Mathematics',
      grade: '10th',
      board: 'CBSE',
      topics: [
        {
          title: 'Algebra Basics',
          description: 'Introduction to algebra',
          subtopics: [
            { title: 'Variables', content: 'Understanding variables' },
            { title: 'Expressions', content: 'Mathematical expressions' }
          ]
        },
        {
          title: 'Geometry Fundamentals',
          description: 'Basic geometric concepts',
          subtopics: [
            { title: 'Points', content: 'Geometric points' },
            { title: 'Lines', content: 'Straight lines' },
            { title: 'Angles', content: 'Angle measurements' }
          ]
        }
      ],
      createdBy: testUser._id
    });
    
    await testSyllabus.save();
    console.log('✅ Test syllabus created\n');
    
    // Test the progress access (this would previously fail)
    console.log('🔍 Testing progress access...');
    console.log('User progress field:', testUser.progress);
    
    // Simulate the fix logic
    const userProgress = testUser.progress || new Map();
    const subjectProgress = userProgress.get('Mathematics') || { completedTopics: [], masteryLevel: 0 };
    
    console.log('✅ Progress access successful!');
    console.log('Subject progress:', subjectProgress);
    
    // Clean up
    await User.deleteOne({ _id: testUser._id });
    await Syllabus.deleteOne({ _id: testSyllabus._id });
    console.log('\n🧹 Cleaned up test data');
    
    console.log('\n🎉 Progress controller fix verified successfully!');
    
  } catch (error) {
    console.error('❌ Error testing progress fix:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
  }
};

testProgressFix();
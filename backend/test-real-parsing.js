const mongoose = require('mongoose');
const Syllabus = require('./models/Syllabus');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Test the parsing endpoint with a real user
const testParsingWithRealUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/teaching-platform');
    
    // Find the admin user we created earlier
    const adminUser = await User.findOne({ email: 'admin@teachingplatform.com' });
    if (!adminUser) {
      console.log('❌ Admin user not found. Please create admin user first.');
      return;
    }
    
    console.log('✅ Found admin user:', adminUser.email);
    
    // Find a syllabus to test with
    const syllabus = await Syllabus.findOne({ createdBy: adminUser._id });
    if (!syllabus) {
      console.log('❌ No syllabus found for admin user.');
      return;
    }
    
    console.log('✅ Found syllabus:', syllabus.title);
    console.log('✅ Syllabus ID:', syllabus._id);
    console.log('✅ Has raw data:', !!syllabus.rawData);
    
    if (syllabus.rawData) {
      console.log('✅ Raw data size:', syllabus.rawData.size, 'bytes');
    }
    
    await mongoose.connection.close();
    
    console.log('\n🎉 Ready to test parsing!');
    console.log('Use this endpoint in your frontend:');
    console.log(`GET http://localhost:5000/api/syllabi-upload/${syllabus._id}/parse`);
    console.log('With Authorization header containing your JWT token');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
  }
};

testParsingWithRealUser();
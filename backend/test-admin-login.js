const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import the User model
const User = require('./models/User');

const testAdminLogin = async () => {
  try {
    console.log('🧪 Testing Admin Login...\n');
    
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/teaching-platform';
    await mongoose.connect(uri);
    console.log('✅ Connected to database\n');
    
    // Find the admin user
    const adminUser = await User.findOne({ email: 'admin@teachingplatform.com' });
    
    if (!adminUser) {
      console.log('❌ Admin user not found!');
      return;
    }
    
    console.log('📋 Admin User Details:');
    console.log('📧 Email:', adminUser.email);
    console.log('👤 Name:', adminUser.name);
    console.log('🔒 Role:', adminUser.role);
    console.log('📊 User ID:', adminUser._id);
    console.log('📅 Created:', adminUser.createdAt);
    console.log();
    
    // Test password verification
    console.log('🔍 Testing password verification...');
    const isPasswordCorrect = await adminUser.comparePassword('Admin123!');
    console.log('✅ Password verification:', isPasswordCorrect ? 'SUCCESS' : 'FAILED');
    
    // Test wrong password
    const isWrongPassword = await adminUser.comparePassword('WrongPassword123');
    console.log('✅ Wrong password test:', isWrongPassword ? 'FAILED - should be false' : 'SUCCESS - correctly rejected');
    
    console.log('\n🎉 Admin account is ready for testing!');
    console.log('\n📋 Login Credentials:');
    console.log('📧 Email: admin@teachingplatform.com');
    console.log('🔑 Password: Admin123!');
    
  } catch (error) {
    console.error('❌ Error testing admin login:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
  }
};

testAdminLogin();
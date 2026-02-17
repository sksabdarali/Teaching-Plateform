const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import the User model
const User = require('./models/User');

const createAdminAccount = async () => {
  try {
    console.log('🔐 Creating Admin Account...\n');
    
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/teaching-platform';
    console.log('🔌 Connecting to:', uri.replace(/\/\/(.*)@/, '//***@'));
    
    await mongoose.connect(uri);
    console.log('✅ Connected to database successfully!\n');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@teachingplatform.com' });
    if (existingAdmin) {
      console.log('⚠️  Admin account already exists!');
      console.log('📧 Email:', existingAdmin.email);
      console.log('👤 Name:', existingAdmin.name);
      console.log('🔒 Role:', existingAdmin.role);
      console.log('\nUse these credentials to login:');
      console.log('Email: admin@teachingplatform.com');
      console.log('Password: Admin123!');
      return;
    }
    
    // Create admin user
    console.log('📝 Creating new admin account...');
    
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@teachingplatform.com',
      password: 'Admin123!', // This will be hashed by the model pre-save hook
      grade: 'Not Applicable',
      board: 'Not Applicable',
      subjects: ['All Subjects'],
      role: 'admin',
      profileComplete: true,
      authMethod: 'email'
    });
    
    // Save the user
    await adminUser.save();
    
    console.log('✅ Admin account created successfully!\n');
    console.log('📋 Admin Credentials:');
    console.log('📧 Email:', adminUser.email);
    console.log('🔑 Password: Admin123!');
    console.log('👤 Name:', adminUser.name);
    console.log('🔒 Role:', adminUser.role);
    console.log('📊 User ID:', adminUser._id);
    
    // Verify the account
    console.log('\n🔍 Verifying account...');
    const verifiedUser = await User.findById(adminUser._id);
    console.log('✅ Account verified! Hashed password:', verifiedUser.password.substring(0, 20) + '...');
    
  } catch (error) {
    console.error('❌ Error creating admin account:', error.message);
    if (error.code === 11000) {
      console.log('💡 The email might already be taken. Try a different email.');
    }
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
  }
};

createAdminAccount();
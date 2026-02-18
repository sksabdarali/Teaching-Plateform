const mongoose = require('mongoose');
const OTP = require('./models/OTP');
const User = require('./models/User');
require('dotenv').config();

const testOTPFlow = async () => {
    try {
        console.log('🧪 Testing Persistent OTP Flow...\n');

        // Connect to MongoDB
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/teaching-platform';
        await mongoose.connect(uri);
        console.log('✅ Connected to database\n');

        const testEmail = 'test-otp-' + Date.now() + '@example.com';
        const testOtp = '123456';
        const regData = {
            name: 'Test Persistent User',
            password: 'Password123!',
            grade: '10th',
            board: 'CBSE',
            subjects: ['Math', 'Science']
        };

        // 1. Test Saving OTP
        console.log('📦 Saving OTP to MongoDB...');
        await OTP.findOneAndUpdate(
            { email: testEmail.toLowerCase() },
            {
                otp: testOtp,
                registrationData: regData,
                createdAt: new Date()
            },
            { upsert: true, new: true }
        );
        console.log('✅ OTP saved successfully\n');

        // 2. Test Retrieving OTP
        console.log('🔍 Retrieving OTP from MongoDB...');
        const otpDoc = await OTP.findOne({ email: testEmail.toLowerCase() });
        if (!otpDoc) throw new Error('OTP document not found!');

        console.log('✅ OTP retrieved:', otpDoc.otp);
        console.log('✅ Registration data preserved:', otpDoc.registrationData.name === regData.name ? 'YES' : 'NO');
        console.log();

        // 3. Test Deleting OTP
        console.log('🗑️ Deleting OTP from MongoDB...');
        await OTP.deleteOne({ email: testEmail.toLowerCase() });
        const deletedDoc = await OTP.findOne({ email: testEmail.toLowerCase() });
        if (deletedDoc) throw new Error('OTP document was not deleted!');
        console.log('✅ OTP deleted successfully\n');

        console.log('🎉 Persistent OTP flow verification PASSED!');

    } catch (error) {
        console.error('❌ Error during verification:', error.message);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed.');
    }
};

testOTPFlow();

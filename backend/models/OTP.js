const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    otp: {
        type: String,
        required: true
    },
    registrationData: {
        name: String,
        password: { type: String }, // Plain text temporarily, will be hashed on user creation
        grade: String,
        board: String,
        subjects: [String]
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600 // Automatically delete after 10 minutes (600 seconds)
    }
});

module.exports = mongoose.model('OTP', otpSchema);

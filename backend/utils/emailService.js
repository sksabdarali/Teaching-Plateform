const nodemailer = require('nodemailer');
require('dotenv').config();

// Create reusable transporter using Gmail SMTP
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️  EMAIL_USER or EMAIL_PASS not set — email sending disabled');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Send welcome email to new user
const sendWelcomeEmail = async (name, email) => {
  const transporter = createTransporter();
  if (!transporter) return; // silently skip if not configured

  const mailOptions = {
    from: `"TeachingPlateform" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🎉 Welcome to Teaching Platform!',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Welcome to Teaching Platform!</h1>
          <p style="color: rgba(255,255,255,0.9); margin-top: 8px; font-size: 16px;">Your learning journey starts now 🚀</p>
        </div>

        <!-- Body -->
        <div style="padding: 30px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Hi <strong>${name}</strong>,
          </p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Thank you for joining us! We're thrilled to have you on board. Here's what you can do:
          </p>

          <div style="margin: 20px 0;">
            <div style="display: flex; align-items: flex-start; margin-bottom: 14px;">
              <span style="color: #3b82f6; font-size: 20px; margin-right: 10px;">📚</span>
              <span style="color: #374151; font-size: 15px;"><strong>Upload your syllabus</strong> and get unit-wise study materials</span>
            </div>
            <div style="display: flex; align-items: flex-start; margin-bottom: 14px;">
              <span style="color: #3b82f6; font-size: 20px; margin-right: 10px;">🤖</span>
              <span style="color: #374151; font-size: 15px;"><strong>AI-powered study materials</strong> tailored to your curriculum</span>
            </div>
            <div style="display: flex; align-items: flex-start; margin-bottom: 14px;">
              <span style="color: #3b82f6; font-size: 20px; margin-right: 10px;">📝</span>
              <span style="color: #374151; font-size: 15px;"><strong>Take quizzes</strong> to test your knowledge</span>
            </div>
            <div style="display: flex; align-items: flex-start; margin-bottom: 14px;">
              <span style="color: #3b82f6; font-size: 20px; margin-right: 10px;">📊</span>
              <span style="color: #374151; font-size: 15px;"><strong>Track your progress</strong> and stay on top of your goals</span>
            </div>
          </div>

          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            We're here to make your learning experience better every day. If you have any questions, feel free to reach out!
          </p>

          <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
            Happy Learning! 🎓<br/>
            <strong>— The Teaching Platform Team</strong>
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            This email was sent because you signed up for Teaching Platform.
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send welcome email to ${email}:`, error.message);
    // Don't throw — email failure should not block signup
  }
};

// Send OTP verification email
const sendOTPEmail = async (email, otp) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.warn(`⚠️  Email not configured — OTP for ${email}: ${otp}`);
    return; // Log OTP to console for testing when email is not configured
  }

  const mailOptions = {
    from: `"TeachingPlateform" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔐 Your Verification Code - Teaching Platform',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 40px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Email Verification</h1>
          <p style="color: rgba(255,255,255,0.9); margin-top: 8px; font-size: 16px;">Verify your email to get started 🔐</p>
        </div>

        <!-- Body -->
        <div style="padding: 30px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            Use the following code to verify your email address:
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; background: linear-gradient(135deg, #eff6ff, #e0e7ff); border: 2px solid #3b82f6; border-radius: 12px; padding: 20px 40px;">
              <span style="font-size: 36px; font-weight: 700; color: #1e40af; letter-spacing: 8px; font-family: monospace;">${otp}</span>
            </div>
          </div>

          <p style="color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
            This code expires in <strong>10 minutes</strong>.<br/>
            If you did not request this code, please ignore this email.
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            Teaching Platform — Email Verification
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${email}`);
  } catch (error) {
    console.error(`❌ Failed to send OTP email to ${email}:`, error.message);
    throw new Error('Failed to send verification email. Please try again.');
  }
};

module.exports = { sendWelcomeEmail, sendOTPEmail };

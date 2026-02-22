const nodemailer = require('nodemailer');
const dns = require('dns');

// Force IPv4 globally — Render does not support IPv6 outbound connections
dns.setDefaultResultOrder('ipv4first');

// Initialize Nodemailer transporter with Gmail SMTP
let transporter;

const initTransporter = () => {
  if (transporter) return transporter;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("⚠️ EMAIL_USER or EMAIL_PASS not defined. Email sending will be disabled.");
    return null;
  }

  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // Custom DNS lookup to force IPv4
    dnsLookup: (hostname, options, callback) => {
      dns.lookup(hostname, { family: 4 }, callback);
    },
    connectionTimeout: 10000, // 10s connection timeout
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  console.log('✅ SMTP transporter configured (Gmail, IPv4 forced)');
  return transporter;
};

// Helper to get sender info
const getSender = () => process.env.EMAIL_USER || 'noreply@teachingplatform.com';

/**
 * Send welcome email to new user
 * @param {string} name - User's name
 * @param {string} email - User's email address
 */
const sendWelcomeEmail = async (name, email) => {
  const mail = initTransporter();
  if (!mail) {
    console.error("❌ Cannot send welcome email: email credentials are missing.");
    return;
  }

  try {
    const info = await mail.sendMail({
      from: `"Teaching Platform" <${getSender()}>`,
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
    });

    console.log(`✅ Welcome email sent to ${email}: ${info.messageId}`);
  } catch (err) {
    console.error(`❌ Failed to send welcome email to ${email}:`, err.message);
  }
};

/**
 * Send OTP verification email
 * @param {string} email - User's email address
 * @param {string} otp - 6-digit verification code
 */
const sendOTPEmail = async (email, otp) => {
  const mail = initTransporter();
  if (!mail) {
    throw new Error('Email service not configured (missing credentials).');
  }

  try {
    const info = await mail.sendMail({
      from: `"Teaching Platform" <${getSender()}>`,
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
    });

    console.log(`✅ OTP email sent to ${email}: ${info.messageId}`);
  } catch (err) {
    console.error(`❌ Failed to send OTP email to ${email}:`, err.message);
    throw err;
  }
};

/**
 * Send daily motivational quote email
 * @param {string} name - User's name
 * @param {string} email - User's email address
 * @param {object} quoteData - { quote, message, advice }
 */
const sendDailyQuoteEmail = async (name, email, quoteData) => {
  const mail = initTransporter();
  if (!mail) {
    console.error("❌ Cannot send daily quote email: email credentials are missing.");
    return;
  }

  const { quote, message, advice } = quoteData;

  try {
    const info = await mail.sendMail({
      from: `"Teaching Platform" <${getSender()}>`,
      to: email,
      subject: '✨ Your Daily Motivation - Teaching Platform',
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #f59e0b, #ef4444, #8b5cf6); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Daily Motivation ✨</h1>
            <p style="color: rgba(255,255,255,0.9); margin-top: 8px; font-size: 16px;">A little inspiration to fuel your day</p>
          </div>

          <!-- Body -->
          <div style="padding: 30px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Good morning, <strong>${name}</strong>! 🌅
            </p>

            <!-- Quote Block -->
            <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); border-left: 4px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <p style="color: #92400e; font-size: 18px; font-style: italic; line-height: 1.6; margin: 0;">
                "${quote || 'Every expert was once a beginner. Keep going!'}"
              </p>
            </div>

            <!-- Message -->
            ${message ? `
            <p style="color: #374151; font-size: 15px; line-height: 1.6;">
              ${message}
            </p>
            ` : ''}

            <!-- Advice -->
            ${advice ? `
            <div style="background: #eff6ff; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p style="color: #1e40af; font-size: 14px; line-height: 1.6; margin: 0;">
                💡 <strong>Today's Tip:</strong> ${advice}
              </p>
            </div>
            ` : ''}

            <div style="text-align: center; margin-top: 24px;">
              <p style="color: #6b7280; font-size: 14px;">
                Keep learning, keep growing! 📚<br/>
                <strong>— The Teaching Platform Team</strong>
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              You're receiving this because you're a Teaching Platform member.<br/>
              Stay motivated, stay focused! 🎯
            </p>
          </div>
        </div>
      `,
    });

    console.log(`✅ Daily quote email sent to ${email}: ${info.messageId}`);
  } catch (err) {
    console.error(`❌ Failed to send daily quote email to ${email}:`, err.message);
  }
};

module.exports = { sendWelcomeEmail, sendOTPEmail, sendDailyQuoteEmail };

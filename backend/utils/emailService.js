const nodemailer = require('nodemailer');

// Email enabled flag — set EMAIL_ENABLED=true in .env to activate
const EMAIL_ENABLED = process.env.EMAIL_ENABLED === 'true';

// Initialize Nodemailer transporter (Gmail SMTP)
let transporter;
if (EMAIL_ENABLED) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  console.log('✅ Nodemailer email service initialized (SMTP)');
} else {
  console.warn('⚠️ Email sending is DISABLED (EMAIL_ENABLED=false). Set EMAIL_ENABLED=true in .env to activate.');
}

// Helper to get the sender email
const getSenderEmail = () => process.env.SMTP_USER || 'noreply@teachingplatform.com';

/**
 * Send welcome email to new user
 * @param {string} name - User's name
 * @param {string} email - User's email address
 */
const sendWelcomeEmail = async (name, email) => {
  if (!EMAIL_ENABLED || !transporter) {
    console.log(`📧 [HALTED] Welcome email to ${email} skipped — email sending is disabled.`);
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: `"Teaching Platform" <${getSenderEmail()}>`,
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
 * Send daily motivational quote email
 * @param {string} name - User's name
 * @param {string} email - User's email address
 * @param {object} quoteData - { quote, message, advice }
 */
const sendDailyQuoteEmail = async (name, email, quoteData) => {
  if (!EMAIL_ENABLED || !transporter) {
    console.log(`📧 [HALTED] Daily quote email to ${email} skipped — email sending is disabled.`);
    return;
  }

  const { quote, message, advice } = quoteData;

  try {
    const info = await transporter.sendMail({
      from: `"Teaching Platform" <${getSenderEmail()}>`,
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

module.exports = { sendWelcomeEmail, sendDailyQuoteEmail };

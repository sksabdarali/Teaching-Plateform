const { Resend } = require('resend');

// Initialize Resend with API Key from environment variables
// Render handles environment variables directly, so no need for dotenv here.
let resend;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
} else {
  console.warn("⚠️ RESEND_API_KEY is not defined. Email sending will be disabled.");
}

// Helper to get the sender email
const getSenderEmail = () => process.env.EMAIL_FROM || 'Teaching Platform <onboarding@resend.dev>';

/**
 * Send welcome email to new user
 * @param {string} name - User's name
 * @param {string} email - User's email address
 */
const sendWelcomeEmail = async (name, email) => {
  if (!resend) {
    console.error("❌ Cannot send welcome email: RESEND_API_KEY is missing.");
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: getSenderEmail(), // Replace with your verified domain in production if set in env
      to: [email],
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

    if (error) {
      // Log specific validation errors for clarity (e.g., trying to send to unverified email)
      if (error.statusCode === 403 && error.name === 'validation_error') {
        console.error(`⚠️ Resend Validation Error: ${error.message}`);
        console.warn(`👉 Tip: In Resend 'Testing' mode, you can ONLY send emails to your own verified address. Verify a domain to send to others.`);
      } else {
        console.error(`❌ Resend Error: Failed to send welcome email to ${email}:`, error);
      }
      return;
    }

    console.log(`✅ Welcome email sent to ${email} via Resend:`, data.id);
  } catch (err) {
    console.error(`❌ Unexpected Error: Failed to send welcome email to ${email}:`, err.message);
  }
};

/**
 * Send OTP verification email
 * @param {string} email - User's email address
 * @param {string} otp - 6-digit verification code
 */
const sendOTPEmail = async (email, otp) => {
  if (!resend) {
    console.error("❌ Cannot send OTP email: RESEND_API_KEY is missing.");
    // We should probably throw here so the user knows registration failed due to server config,
    // but to match previous behavior/expectations we'll throw a specific error.
    throw new Error('Email service not configured (missing API key).');
  }

  try {
    const { data, error } = await resend.emails.send({
      from: getSenderEmail(), // Replace with your verified domain in production if set in env
      to: [email],
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

    if (error) {
      if (error.statusCode === 403 && error.name === 'validation_error') {
        console.error(`⚠️ Resend Validation Error: ${error.message}`);
        console.warn(`👉 Tip: In Resend 'Testing' mode, you can ONLY send emails to your own verified address. Verify a domain to send to others.`);
        throw new Error('Email service restriction: Can only send to verified email in test mode.');
      }
      console.error(`❌ Resend Error: Failed to send OTP email to ${email}:`, error);
      throw new Error('Failed to send verification email via Resend.');
    }

    console.log(`✅ OTP email sent to ${email} via Resend: ${data.id}`);
  } catch (err) {
    // Only log if it's not the specific validation error we just logged (to avoid double logging)
    if (!err.message.includes('Email service restriction')) {
      console.error(`❌ Failed to send OTP email to ${email}:`, err.message);
    }
    // Re-throw so the auth logic can handle the failure
    throw err;
  }
};

module.exports = { sendWelcomeEmail, sendOTPEmail };

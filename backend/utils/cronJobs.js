const cron = require('node-cron');
const User = require('../models/User');
const { generateMotivationalContent } = require('./aiService');
const { sendDailyQuoteEmail } = require('./emailService');

/**
 * Send daily motivational quote email to all users.
 * Can be called directly for testing or by the cron scheduler.
 */
const sendDailyQuotesToAllUsers = async () => {
    if (process.env.EMAIL_ENABLED !== 'true') {
        console.log('📧 [HALTED] Daily quote emails skipped — EMAIL_ENABLED is false.');
        return;
    }
    console.log('📧 Starting daily motivational quote emails...');

    try {
        // Get all users with valid email addresses
        const users = await User.find({}, 'name email subjects streak points');

        if (!users || users.length === 0) {
            console.log('ℹ️ No users found to send daily quotes to.');
            return;
        }

        console.log(`📬 Sending daily quotes to ${users.length} user(s)...`);

        // Generate one motivational quote to send to all users (saves API calls)
        let quoteData;
        try {
            // Use the first user as context seed, but the quote is generic enough for everyone
            quoteData = await generateMotivationalContent(users[0]);
        } catch (err) {
            console.error('❌ Failed to generate motivational content via AI, using fallback:', err.message);
            quoteData = {
                quote: "The beautiful thing about learning is that no one can take it away from you. – B.B. King",
                message: "Every day is a new opportunity to learn something amazing. Make today count!",
                advice: "Start your study session by reviewing what you learned yesterday — it strengthens memory retention.",
                encouragement: "You're building your future one lesson at a time. Keep going! 🚀"
            };
        }

        // Send email to each user (with small delay to avoid rate limits)
        let successCount = 0;
        let failCount = 0;

        for (const user of users) {
            try {
                await sendDailyQuoteEmail(user.name, user.email, quoteData);
                successCount++;
            } catch (err) {
                failCount++;
                console.error(`❌ Failed to send quote to ${user.email}:`, err.message);
            }

            // Small delay between emails to avoid Gmail rate limits
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log(`✅ Daily quotes sent: ${successCount} success, ${failCount} failed out of ${users.length} users.`);
    } catch (err) {
        console.error('❌ Error in daily quote job:', err.message);
    }
};

/**
 * Initialize all cron jobs
 */
const initCronJobs = () => {
    // Daily motivational quote email — runs at 8:00 AM IST (2:30 AM UTC)
    // Cron format: minute hour day month weekday
    cron.schedule('30 2 * * *', () => {
        console.log('⏰ Cron triggered: Daily motivational quote emails');
        sendDailyQuotesToAllUsers();
    }, {
        timezone: 'Asia/Kolkata'
    });

    console.log('✅ Cron jobs initialized — daily quote email scheduled at 8:00 AM IST');
};

module.exports = { initCronJobs, sendDailyQuotesToAllUsers };

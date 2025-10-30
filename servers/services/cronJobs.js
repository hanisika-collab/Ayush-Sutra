// servers/services/cronJobs.js - AUTOMATIC DAILY TIPS SCHEDULER
const cron = require('node-cron');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendEmail } = require('./emailService');

// Daily wellness tips collection
const dailyTips = [
  {
    title: "Start Your Day with Warm Water",
    content: "Drinking a glass of warm water first thing in the morning helps flush toxins, aids digestion, and kickstarts your metabolism. Add a squeeze of lemon for extra benefits!"
  },
  {
    title: "Practice Abhyanga (Self-Massage)",
    content: "A daily self-massage with warm sesame oil before bathing improves circulation, nourishes skin, and calms the nervous system. Spend just 10 minutes for lasting benefits."
  },
  {
    title: "Eat According to Your Dosha",
    content: "Understanding your Ayurvedic constitution (Vata, Pitta, or Kapha) helps you choose foods that balance your body. Consult with our practitioners for personalized dietary guidance."
  },
  {
    title: "Mind Your Meal Times",
    content: "Eat your largest meal at lunch when digestive fire (Agni) is strongest. Keep dinner light and eat at least 2-3 hours before bedtime for optimal digestion."
  },
  {
    title: "Practice Pranayama Daily",
    content: "Just 10 minutes of conscious breathing exercises can reduce stress, improve lung capacity, and enhance mental clarity. Try Nadi Shodhana (alternate nostril breathing) today."
  },
  {
    title: "Get Quality Sleep",
    content: "Aim for 7-8 hours of sleep, ideally between 10 PM and 6 AM. This aligns with natural circadian rhythms and promotes deep healing and rejuvenation."
  },
  {
    title: "Stay Hydrated Mindfully",
    content: "Sip warm water throughout the day rather than gulping cold water with meals. This supports digestion and maintains proper bodily functions."
  },
  {
    title: "Practice Mindful Eating",
    content: "Eat in a calm environment without distractions. Chew your food thoroughly and be present with each bite. This improves digestion and nutrient absorption."
  },
  {
    title: "Use Natural Herbs",
    content: "Incorporate Ayurvedic herbs like Ashwagandha for stress, Turmeric for inflammation, and Triphala for digestion. Always consult a practitioner before starting new herbs."
  },
  {
    title: "Connect with Nature",
    content: "Spend at least 20 minutes outdoors daily. Walking barefoot on grass (earthing) helps balance your energy and reduces inflammation."
  }
];

// Function to send daily tips to all patients
async function sendDailyTipsToAllPatients() {
  try {
    console.log('\n💡 ========== DAILY TIPS CRON JOB STARTED ==========');
    console.log(`🕐 Time: ${new Date().toLocaleString()}`);
    
    // Get all active patients with email
    const patients = await User.find({ 
      role: 'patient', 
      email: { $exists: true, $ne: '' },
      active: true 
    });
    
    if (patients.length === 0) {
      console.log('⚠️ No patients found to send tips to');
      return;
    }
    
    console.log(`👥 Found ${patients.length} patients`);
    
    // Get random tip for today
    const randomIndex = Math.floor(Math.random() * dailyTips.length);
    const todayTip = dailyTips[randomIndex];
    
    console.log(`📝 Today's tip: "${todayTip.title}"`);
    
    let successCount = 0;
    let failCount = 0;
    
    // Send to each patient
    for (const patient of patients) {
      try {
        // Create notification
        const notification = new Notification({
          userId: patient._id,
          type: 'daily-tip',
          title: `Daily Wellness Tip: ${todayTip.title}`,
          message: todayTip.content,
          channel: 'email',
          scheduledFor: new Date(),
          status: 'pending'
        });
        
        await notification.save();
        
        // Send email
        const emailResult = await sendEmail(
          patient.email,
          'daily-tip',
          {
            tipTitle: todayTip.title,
            tipContent: todayTip.content
          }
        );
        
        // Update notification status
        notification.status = emailResult.success ? 'sent' : 'failed';
        notification.sentAt = new Date();
        notification.metadata = {
          emailSent: emailResult.success,
          emailError: emailResult.error
        };
        await notification.save();
        
        if (emailResult.success) {
          successCount++;
          console.log(`✅ Sent to ${patient.email}`);
        } else {
          failCount++;
          console.log(`❌ Failed to send to ${patient.email}: ${emailResult.error}`);
        }
        
        // Small delay to avoid overwhelming email server
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (err) {
        failCount++;
        console.error(`❌ Error sending to ${patient.email}:`, err.message);
      }
    }
    
    console.log('\n📊 ========== DAILY TIPS SUMMARY ==========');
    console.log(`✅ Successfully sent: ${successCount}/${patients.length}`);
    console.log(`❌ Failed: ${failCount}/${patients.length}`);
    console.log(`📝 Tip: "${todayTip.title}"`);
    console.log('===========================================\n');
    
  } catch (err) {
    console.error('❌ Daily tips cron job error:', err);
  }
}

// Function to send pending scheduled notifications
async function sendScheduledNotifications() {
  try {
    const now = new Date();
    
    // Find notifications that are pending and scheduled for now or past
    const notifications = await Notification.find({
      status: 'pending',
      scheduledFor: { $lte: now }
    })
      .populate('userId', 'name email')
      .limit(50);
    
    if (notifications.length === 0) {
      return;
    }
    
    console.log(`📅 Processing ${notifications.length} scheduled notifications...`);
    
    for (const notification of notifications) {
      try {
        if (!notification.userId || !notification.userId.email) {
          console.log(`⚠️ Skipping notification ${notification._id}: no user email`);
          continue;
        }
        
        const emailData = {
          patientName: notification.userId.name,
          ...notification.metadata
        };
        
        const emailResult = await sendEmail(
          notification.userId.email,
          notification.type,
          emailData
        );
        
        notification.status = emailResult.success ? 'sent' : 'failed';
        notification.sentAt = new Date();
        notification.metadata.emailSent = emailResult.success;
        notification.metadata.emailError = emailResult.error;
        await notification.save();
        
        console.log(`${emailResult.success ? '✅' : '❌'} Notification ${notification._id} processed`);
        
      } catch (err) {
        console.error(`❌ Error processing notification ${notification._id}:`, err.message);
      }
    }
    
  } catch (err) {
    console.error('❌ Scheduled notifications cron error:', err);
  }
}

// Initialize cron jobs
function initializeCronJobs() {
  console.log('⏰ Initializing cron jobs...');
  
  // ✅ DAILY TIPS - Send every day at 8:00 AM
  // Pattern: minute hour day month dayOfWeek
  // '0 8 * * *' means "At 08:00 every day"
  cron.schedule('0 8 * * *', () => {
    console.log('🔔 Daily tips cron triggered');
    sendDailyTipsToAllPatients();
  }, {
    timezone: "Asia/Kolkata" // Change to your timezone
  });
  
  console.log('✅ Daily tips scheduled for 8:00 AM every day');
  
  // ✅ SCHEDULED NOTIFICATIONS - Check every 15 minutes
  // Pattern: '*/15 * * * *' means "Every 15 minutes"
  cron.schedule('*/15 * * * *', () => {
    sendScheduledNotifications();
  });
  
  console.log('✅ Scheduled notifications check every 15 minutes');
  
  // ✅ FOR TESTING: Uncomment to send daily tips every minute
  // cron.schedule('* * * * *', () => {
  //   console.log('🧪 TEST: Sending daily tips (every minute)');
  //   sendDailyTipsToAllPatients();
  // });
  
  console.log('⏰ All cron jobs initialized successfully!\n');
}

// Manual trigger function (for testing or admin trigger)
async function manualSendDailyTips() {
  console.log('🔧 Manual daily tips trigger activated');
  await sendDailyTipsToAllPatients();
}

module.exports = {
  initializeCronJobs,
  sendDailyTipsToAllPatients,
  sendScheduledNotifications,
  manualSendDailyTips
};
// servers/services/cronJobs.js - COMPLETE AUTO-NOTIFICATION SYSTEM
const cron = require('node-cron');
const User = require('../models/User');
const Notification = require('../models/Notification');
const TherapySession = require('../models/TherapySession');
const ProcedureSession = require('../models/ProcedureSession');
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

// =====================
// DAILY TIPS - Send to all patients
// =====================
async function sendDailyTipsToAllPatients() {
  try {
    console.log('\n💡 ========== DAILY TIPS CRON JOB STARTED ==========');
    console.log(`🕐 Time: ${new Date().toLocaleString()}`);
    
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
    
    const randomIndex = Math.floor(Math.random() * dailyTips.length);
    const todayTip = dailyTips[randomIndex];
    
    console.log(`📝 Today's tip: "${todayTip.title}"`);
    
    let successCount = 0;
    let failCount = 0;
    
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
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (err) {
        failCount++;
        console.error(`❌ Error sending to ${patient.email}:`, err.message);
      }
    }
    
    console.log('\n📊 ========== DAILY TIPS SUMMARY ==========');
    console.log(`✅ Successfully sent: ${successCount}/${patients.length}`);
    console.log(`❌ Failed: ${failCount}/${patients.length}`);
    console.log('===========================================\n');
    
  } catch (err) {
    console.error('❌ Daily tips cron job error:', err);
  }
}

// =====================
// PRE-THERAPY NOTIFICATIONS - Send 24h before sessions
// =====================
async function sendPreTherapyNotifications() {
  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setHours(tomorrow.getHours() + 24);
    
    // Find sessions scheduled for tomorrow
    const upcomingSessions = await TherapySession.find({
      startTime: {
        $gte: now,
        $lte: tomorrow
      },
      status: { $in: ['scheduled', 'in-progress'] }
    })
      .populate('patientId', 'name email')
      .populate('therapistId', 'name')
      .populate('roomId', 'name');
    
    if (upcomingSessions.length === 0) {
      return;
    }
    
    console.log(`\n🧘 Processing ${upcomingSessions.length} pre-therapy notifications...`);
    
    for (const session of upcomingSessions) {
      try {
        if (!session.patientId || !session.patientId.email) {
          continue;
        }
        
        // Check if notification already sent
        const existingNotif = await Notification.findOne({
          userId: session.patientId._id,
          type: 'pre-therapy',
          relatedSession: session._id,
          status: { $in: ['sent', 'read'] }
        });
        
        if (existingNotif) {
          continue; // Already sent
        }
        
        // Create notification
        const notification = new Notification({
          userId: session.patientId._id,
          type: 'pre-therapy',
          title: `Upcoming: ${session.therapyType} Session`,
          message: `Your ${session.therapyType} session is scheduled for ${new Date(session.startTime).toLocaleString()}`,
          channel: 'email',
          scheduledFor: new Date(),
          relatedSession: session._id,
          status: 'pending',
          metadata: {
            therapyType: session.therapyType,
            therapistName: session.therapistId?.name || 'TBA',
            sessionTime: new Date(session.startTime).toLocaleString(),
            roomName: session.roomId?.name || 'TBA'
          }
        });
        
        await notification.save();
        
        // Send email
        const emailResult = await sendEmail(
          session.patientId.email,
          'pre-therapy',
          {
            patientName: session.patientId.name,
            therapyType: session.therapyType,
            sessionTime: new Date(session.startTime).toLocaleString(),
            therapistName: session.therapistId?.name || 'TBA',
            roomName: session.roomId?.name || 'TBA'
          }
        );
        
        notification.status = emailResult.success ? 'sent' : 'failed';
        notification.sentAt = new Date();
        notification.metadata.emailSent = emailResult.success;
        notification.metadata.emailError = emailResult.error;
        await notification.save();
        
        console.log(`${emailResult.success ? '✅' : '❌'} Pre-therapy notification for ${session.patientId.email}`);
        
      } catch (err) {
        console.error(`❌ Error processing session ${session._id}:`, err.message);
      }
    }
    
  } catch (err) {
    console.error('❌ Pre-therapy notifications error:', err);
  }
}

// =====================
// POST-THERAPY NOTIFICATIONS - Send after completed procedures
// =====================
async function sendPostTherapyNotifications() {
  try {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    // Find recently completed procedures without post-therapy notification
    const completedProcedures = await ProcedureSession.find({
      status: 'completed',
      completedAt: { $gte: oneHourAgo }
    })
      .populate({
        path: 'sessionId',
        populate: [
          { path: 'patientId', select: 'name email' },
          { path: 'therapistId', select: 'name' }
        ]
      });
    
    if (completedProcedures.length === 0) {
      return;
    }
    
    console.log(`\n✨ Processing ${completedProcedures.length} post-therapy notifications...`);
    
    for (const procedure of completedProcedures) {
      try {
        const session = procedure.sessionId;
        
        if (!session || !session.patientId || !session.patientId.email) {
          continue;
        }
        
        // Check if notification already sent
        const existingNotif = await Notification.findOne({
          userId: session.patientId._id,
          type: 'post-therapy',
          relatedSession: session._id,
          status: { $in: ['sent', 'read'] }
        });
        
        if (existingNotif) {
          continue; // Already sent
        }
        
        // Create notification
        const notification = new Notification({
          userId: session.patientId._id,
          type: 'post-therapy',
          title: `Post-Therapy Care: ${session.therapyType}`,
          message: `Thank you for completing your ${session.therapyType} session. Please follow the post-therapy guidelines for best results.`,
          channel: 'email',
          scheduledFor: new Date(),
          relatedSession: session._id,
          status: 'pending',
          metadata: {
            therapyType: session.therapyType,
            therapistName: session.therapistId?.name || 'Our Team',
            nextSession: 'To be scheduled'
          }
        });
        
        await notification.save();
        
        // Send email
        const emailResult = await sendEmail(
          session.patientId.email,
          'post-therapy',
          {
            patientName: session.patientId.name,
            therapyType: session.therapyType,
            nextSession: 'To be scheduled'
          }
        );
        
        notification.status = emailResult.success ? 'sent' : 'failed';
        notification.sentAt = new Date();
        notification.metadata.emailSent = emailResult.success;
        notification.metadata.emailError = emailResult.error;
        await notification.save();
        
        console.log(`${emailResult.success ? '✅' : '❌'} Post-therapy notification for ${session.patientId.email}`);
        
      } catch (err) {
        console.error(`❌ Error processing procedure ${procedure._id}:`, err.message);
      }
    }
    
  } catch (err) {
    console.error('❌ Post-therapy notifications error:', err);
  }
}

// =====================
// SCHEDULED NOTIFICATIONS - Process pending notifications
// =====================
async function sendScheduledNotifications() {
  try {
    const now = new Date();
    
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

// =====================
// Initialize cron jobs
// =====================
function initializeCronJobs() {
  console.log('⏰ Initializing cron jobs...');
  
  // ✅ DAILY TIPS - Every day at 8:00 AM
  cron.schedule('0 8 * * *', () => {
    console.log('🔔 Daily tips cron triggered');
    sendDailyTipsToAllPatients();
  }, {
    timezone: "Asia/Kolkata"
  });
  console.log('✅ Daily tips scheduled for 8:00 AM every day');
  
  // ✅ PRE-THERAPY NOTIFICATIONS - Every 6 hours
  cron.schedule('0 */6 * * *', () => {
    console.log('🔔 Pre-therapy notifications cron triggered');
    sendPreTherapyNotifications();
  });
  console.log('✅ Pre-therapy notifications check every 6 hours');
  
  // ✅ POST-THERAPY NOTIFICATIONS - Every hour
  cron.schedule('0 * * * *', () => {
    console.log('🔔 Post-therapy notifications cron triggered');
    sendPostTherapyNotifications();
  });
  console.log('✅ Post-therapy notifications check every hour');
  
  // ✅ SCHEDULED NOTIFICATIONS - Every 15 minutes
  cron.schedule('*/15 * * * *', () => {
    sendScheduledNotifications();
  });
  console.log('✅ Scheduled notifications check every 15 minutes');
  
  // ✅ FOR TESTING: Uncomment to run checks every minute
  // cron.schedule('* * * * *', () => {
  //   console.log('🧪 TEST: Running all notification checks (every minute)');
  //   sendPreTherapyNotifications();
  //   sendPostTherapyNotifications();
  //   sendScheduledNotifications();
  // });
  
  console.log('⏰ All cron jobs initialized successfully!\n');
}

// Manual trigger functions (for testing or admin)
async function manualSendDailyTips() {
  console.log('🔧 Manual daily tips trigger activated');
  await sendDailyTipsToAllPatients();
}

async function manualSendPreTherapy() {
  console.log('🔧 Manual pre-therapy notifications trigger activated');
  await sendPreTherapyNotifications();
}

async function manualSendPostTherapy() {
  console.log('🔧 Manual post-therapy notifications trigger activated');
  await sendPostTherapyNotifications();
}

module.exports = {
  initializeCronJobs,
  sendDailyTipsToAllPatients,
  sendPreTherapyNotifications,
  sendPostTherapyNotifications,
  sendScheduledNotifications,
  manualSendDailyTips,
  manualSendPreTherapy,
  manualSendPostTherapy
};
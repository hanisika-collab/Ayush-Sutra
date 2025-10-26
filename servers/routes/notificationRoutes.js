// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');
const TherapySession = require('../models/TherapySession');
const { sendEmail } = require('../services/emailService');

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
// GET user notifications
// =====================
router.get('/user/:userId', async (req, res) => {
  try {
    console.log(`\n📬 Fetching notifications for user: ${req.params.userId}`);
    
    const notifications = await Notification.find({ userId: req.params.userId })
      .populate('relatedSession', 'therapyType startTime')
      .sort({ createdAt: -1 })
      .limit(50);
    
    const unreadCount = await Notification.countDocuments({ 
      userId: req.params.userId, 
      status: { $in: ['pending', 'sent'] }
    });
    
    console.log(`✅ Found ${notifications.length} notifications, ${unreadCount} unread`);
    
    res.json({
      notifications,
      unreadCount
    });
  } catch (err) {
    console.error('❌ Fetch notifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications', message: err.message });
  }
});

// =====================
// CREATE notification
// =====================
router.post('/', async (req, res) => {
  try {
    const { userId, type, title, message, channel, scheduledFor, relatedSession, metadata } = req.body;
    
    console.log(`\n📬 Creating notification for user: ${userId}, type: ${type}`);
    
    if (!userId || !type || !title || !message) {
      return res.status(400).json({ error: 'userId, type, title, and message are required' });
    }
    
    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const notification = new Notification({
      userId,
      type,
      title,
      message,
      channel: channel || 'email',
      scheduledFor: scheduledFor || new Date(),
      relatedSession,
      metadata: metadata || {},
      status: 'pending'
    });
    
    await notification.save();
    console.log(`✅ Notification created: ${notification._id}`);
    
    // If scheduled for now or past, send immediately
    if (new Date(notification.scheduledFor) <= new Date()) {
      await sendNotificationNow(notification._id);
    }
    
    res.status(201).json(notification);
  } catch (err) {
    console.error('❌ Create notification error:', err);
    res.status(400).json({ error: 'Failed to create notification', message: err.message });
  }
});

// =====================
// SEND pre-therapy notification
// =====================
router.post('/pre-therapy', async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    console.log(`\n📬 Creating pre-therapy notification for session: ${sessionId}`);
    
    const session = await TherapySession.findById(sessionId)
      .populate('patientId', 'name email')
      .populate('therapistId', 'name')
      .populate('roomId', 'name');
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const patient = session.patientId;
    if (!patient || !patient.email) {
      return res.status(400).json({ error: 'Patient email not found' });
    }
    
    // Create notification
    const notification = new Notification({
      userId: patient._id,
      type: 'pre-therapy',
      title: `Upcoming: ${session.therapyType} Session`,
      message: `Your ${session.therapyType} session is scheduled for ${new Date(session.startTime).toLocaleString()}`,
      channel: 'email',
      scheduledFor: new Date(session.startTime.getTime() - 24 * 60 * 60 * 1000), // 24 hours before
      relatedSession: session._id,
      metadata: {
        therapyType: session.therapyType,
        therapistName: session.therapistId?.name || 'TBA',
        sessionTime: new Date(session.startTime).toLocaleString(),
        roomName: session.roomId?.name || 'TBA'
      }
    });
    
    await notification.save();
    
    // Send email immediately if scheduled time has passed
    if (notification.scheduledFor <= new Date()) {
      const emailResult = await sendEmail(
        patient.email,
        'pre-therapy',
        {
          patientName: patient.name,
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
    }
    
    console.log(`✅ Pre-therapy notification created: ${notification._id}`);
    res.status(201).json(notification);
  } catch (err) {
    console.error('❌ Pre-therapy notification error:', err);
    res.status(500).json({ error: 'Failed to create pre-therapy notification', message: err.message });
  }
});

// =====================
// SEND daily wellness tip
// =====================
router.post('/daily-tip', async (req, res) => {
  try {
    const { userIds } = req.body; // Array of user IDs or "all"
    
    console.log(`\n💡 Sending daily wellness tips...`);
    
    // Get random tip
    const randomTip = dailyTips[Math.floor(Math.random() * dailyTips.length)];
    
    // Get users
    let users;
    if (userIds === 'all') {
      users = await User.find({ role: 'patient', email: { $exists: true, $ne: '' } });
    } else if (Array.isArray(userIds)) {
      users = await User.find({ _id: { $in: userIds }, email: { $exists: true, $ne: '' } });
    } else {
      return res.status(400).json({ error: 'userIds must be an array or "all"' });
    }
    
    console.log(`📧 Sending to ${users.length} users`);
    
    const notifications = [];
    const emailResults = [];
    
    for (const user of users) {
      // Create notification
      const notification = new Notification({
        userId: user._id,
        type: 'daily-tip',
        title: `Daily Tip: ${randomTip.title}`,
        message: randomTip.content,
        channel: 'email',
        scheduledFor: new Date(),
        status: 'pending'
      });
      
      await notification.save();
      
      // Send email
      const emailResult = await sendEmail(
        user.email,
        'daily-tip',
        {
          tipTitle: randomTip.title,
          tipContent: randomTip.content
        }
      );
      
      notification.status = emailResult.success ? 'sent' : 'failed';
      notification.sentAt = new Date();
      notification.metadata = {
        emailSent: emailResult.success,
        emailError: emailResult.error
      };
      await notification.save();
      
      notifications.push(notification);
      emailResults.push({
        userId: user._id,
        email: user.email,
        success: emailResult.success
      });
    }
    
    const successCount = emailResults.filter(r => r.success).length;
    console.log(`✅ Sent ${successCount}/${users.length} daily tips successfully`);
    
    res.json({
      message: `Daily tips sent to ${users.length} users`,
      successCount,
      totalCount: users.length,
      tip: randomTip,
      results: emailResults
    });
  } catch (err) {
    console.error('❌ Daily tip error:', err);
    res.status(500).json({ error: 'Failed to send daily tips', message: err.message });
  }
});

// =====================
// MARK as read
// =====================
router.put('/:id/read', async (req, res) => {
  try {
    console.log(`\n📖 Marking notification as read: ${req.params.id}`);
    
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    notification.status = 'read';
    notification.readAt = new Date();
    await notification.save();
    
    console.log(`✅ Notification marked as read`);
    res.json(notification);
  } catch (err) {
    console.error('❌ Mark read error:', err);
    res.status(500).json({ error: 'Failed to mark notification as read', message: err.message });
  }
});

// =====================
// DELETE notification
// =====================
router.delete('/:id', async (req, res) => {
  try {
    console.log(`\n🗑️ Deleting notification: ${req.params.id}`);
    
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    console.log(`✅ Notification deleted`);
    res.json({ message: 'Notification deleted successfully' });
  } catch (err) {
    console.error('❌ Delete notification error:', err);
    res.status(500).json({ error: 'Failed to delete notification', message: err.message });
  }
});

// =====================
// GET scheduled notifications (for cron job)
// =====================
router.get('/scheduled/pending', async (req, res) => {
  try {
    const now = new Date();
    const notifications = await Notification.find({
      status: 'pending',
      scheduledFor: { $lte: now }
    })
      .populate('userId', 'name email')
      .populate('relatedSession', 'therapyType startTime')
      .limit(100);
    
    console.log(`📅 Found ${notifications.length} scheduled notifications to send`);
    res.json(notifications);
  } catch (err) {
    console.error('❌ Fetch scheduled notifications error:', err);
    res.status(500).json({ error: 'Failed to fetch scheduled notifications', message: err.message });
  }
});

// Helper function to send notification immediately
async function sendNotificationNow(notificationId) {
  try {
    const notification = await Notification.findById(notificationId)
      .populate('userId', 'name email')
      .populate('relatedSession', 'therapyType startTime therapistId roomId');
    
    if (!notification || !notification.userId || !notification.userId.email) {
      console.log(`⚠️ Cannot send notification ${notificationId}: missing user or email`);
      return;
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
    
    console.log(`${emailResult.success ? '✅' : '❌'} Notification ${notificationId} sent`);
  } catch (err) {
    console.error(`❌ Error sending notification ${notificationId}:`, err);
  }
}

module.exports = router;
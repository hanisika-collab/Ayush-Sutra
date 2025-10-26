// models/Notification.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const NotificationSchema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['pre-therapy', 'post-therapy', 'daily-tip', 'appointment-reminder', 'general'],
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'sent', 'failed', 'read'],
    default: 'pending' 
  },
  channel: { 
    type: String, 
    enum: ['email', 'sms', 'in-app'],
    default: 'email' 
  },
  scheduledFor: { 
    type: Date 
  },
  sentAt: { 
    type: Date 
  },
  readAt: { 
    type: Date 
  },
  relatedSession: { 
    type: Schema.Types.ObjectId, 
    ref: 'TherapySession' 
  },
  metadata: {
    therapyType: String,
    therapistName: String,
    sessionTime: Date,
    emailSent: { type: Boolean, default: false },
    emailError: String
  }
}, { timestamps: true });

// Index for efficient queries
NotificationSchema.index({ userId: 1, status: 1, createdAt: -1 });
NotificationSchema.index({ scheduledFor: 1, status: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);
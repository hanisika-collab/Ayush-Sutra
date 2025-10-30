// servers/models/Appointment.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const AppointmentSchema = new Schema({
  patientId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  doctorId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User'
  },
  therapistId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User'
  },
  appointmentType: {
    type: String,
    enum: ['consultation', 'therapy', 'follow-up', 'emergency'],
    required: true
  },
  therapyType: {
    type: String,
    enum: ['Abhyanga', 'Swedana', 'Pizhichil', 'Shirodhara', 'Udvartana', 'Nasya', 'Virechana', 'Basti', 'Other']
  },
  preferredDate: {
    type: Date,
    required: true
  },
  preferredTime: {
    type: String,
    required: true
  },
  alternateDate: Date,
  alternateTime: String,
  symptoms: {
    type: String,
    required: true
  },
  medicalHistory: String,
  currentMedications: String,
  allergies: String,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled', 'rescheduled'],
    default: 'pending'
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedDate: Date,
  assignedTime: String,
  roomId: {
    type: Schema.Types.ObjectId,
    ref: 'Room'
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalDate: Date,
  rejectionReason: String,
  adminNotes: String,
  doctorNotes: String,
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'partial', 'refunded'],
    default: 'pending'
  },
  consultationFee: Number,
  actualStartTime: Date,
  actualEndTime: Date,
  duration: Number, // in minutes
  followUpRequired: {
    type: Boolean,
    default: false
  },
  followUpDate: Date,
  reminderSent: {
    type: Boolean,
    default: false
  },
  cancellationReason: String,
  cancelledBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  cancelledAt: Date
}, { 
  timestamps: true 
});

// Indexes for better query performance
AppointmentSchema.index({ patientId: 1, status: 1 });
AppointmentSchema.index({ doctorId: 1, status: 1 });
AppointmentSchema.index({ therapistId: 1, status: 1 });
AppointmentSchema.index({ preferredDate: 1, status: 1 });
AppointmentSchema.index({ status: 1, createdAt: -1 });

// Virtual for assigned staff
AppointmentSchema.virtual('assignedStaff').get(function() {
  return this.doctorId || this.therapistId;
});

// Method to check if appointment can be cancelled
AppointmentSchema.methods.canBeCancelled = function() {
  if (this.status === 'completed' || this.status === 'cancelled') {
    return false;
  }
  const appointmentTime = new Date(this.preferredDate + ' ' + this.preferredTime);
  const now = new Date();
  const hoursDiff = (appointmentTime - now) / (1000 * 60 * 60);
  return hoursDiff >= 2; // Can cancel if more than 2 hours away
};

// Static method to get upcoming appointments
AppointmentSchema.statics.getUpcoming = function(userId, role) {
  const query = {
    status: { $in: ['pending', 'approved'] },
    preferredDate: { $gte: new Date() }
  };
  
  if (role === 'patient') {
    query.patientId = userId;
  } else if (role === 'doctor') {
    query.doctorId = userId;
  } else if (role === 'therapist') {
    query.therapistId = userId;
  }
  
  return this.find(query)
    .populate('patientId', 'name email phone')
    .populate('doctorId', 'name email')
    .populate('therapistId', 'name email')
    .populate('roomId', 'name location')
    .sort({ preferredDate: 1, preferredTime: 1 });
};

module.exports = mongoose.model('Appointment', AppointmentSchema);
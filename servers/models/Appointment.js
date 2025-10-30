// servers/models/Appointment.js - ENHANCED VERSION
const mongoose = require('mongoose');
const { Schema } = mongoose;

const AppointmentSchema = new Schema({
  patientId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  // ✅ Healthcare provider selection
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
  // Confirmed details after approval
  confirmedDate: Date,
  confirmedTime: String,
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
  staffNotes: String, // Notes from doctor/therapist
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
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

// ✅ Enhanced indexes for better query performance
AppointmentSchema.index({ patientId: 1, status: 1 });
AppointmentSchema.index({ doctorId: 1, status: 1 });
AppointmentSchema.index({ therapistId: 1, status: 1 });
AppointmentSchema.index({ preferredDate: 1, status: 1 });
AppointmentSchema.index({ status: 1, createdAt: -1 });

// ✅ Virtual for assigned healthcare provider
AppointmentSchema.virtual('assignedProvider').get(function() {
  return this.doctorId || this.therapistId;
});

// ✅ Method to get provider details
AppointmentSchema.methods.getProviderInfo = function() {
  if (this.doctorId) {
    return {
      type: 'doctor',
      id: this.doctorId._id || this.doctorId,
      name: this.doctorId.name || 'Doctor'
    };
  } else if (this.therapistId) {
    return {
      type: 'therapist',
      id: this.therapistId._id || this.therapistId,
      name: this.therapistId.name || 'Therapist'
    };
  }
  return null;
};

// ✅ Static method to get appointments for a provider
AppointmentSchema.statics.getProviderAppointments = function(userId, role) {
  const query = {
    status: { $in: ['pending', 'approved'] }
  };
  
  if (role === 'doctor') {
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
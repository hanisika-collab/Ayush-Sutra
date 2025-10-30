// servers/models/Prescription.js - FINAL FIXED VERSION
const mongoose = require("mongoose");
const { Schema } = mongoose;

const PrescriptionSchema = new Schema({
  // ✅ CRITICAL: Reference User model, not Patient
  patientId: { 
    type: Schema.Types.ObjectId, 
    ref: "User",  // Must be "User" because patients are users with role='patient'
    required: true 
  },
  uploadedBy: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  fileName: { 
    type: String, 
    required: true 
  },
  filePath: { 
    type: String, 
    required: true 
  },
  notes: { 
    type: String 
  },
  uploadedAt: { 
    type: Date, 
    default: Date.now 
  },
}, { 
  timestamps: true 
});

// Add indexes for better query performance
PrescriptionSchema.index({ patientId: 1, uploadedAt: -1 });
PrescriptionSchema.index({ uploadedBy: 1 });

// ✅ Add a method to get populated prescription
PrescriptionSchema.methods.populateDetails = async function() {
  await this.populate([
    { path: 'patientId', select: 'name email role' },
    { path: 'uploadedBy', select: 'name email role' }
  ]);
  return this;
};

// ✅ Add static method to get all with population
PrescriptionSchema.statics.findAllPopulated = function(query = {}) {
  return this.find(query)
    .populate('patientId', 'name email role')
    .populate('uploadedBy', 'name email role')
    .sort({ uploadedAt: -1 });
};

module.exports = mongoose.model("Prescription", PrescriptionSchema);
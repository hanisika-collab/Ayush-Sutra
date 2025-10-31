// servers/models/TherapySession.js - WITH DOCTOR FIELD
const mongoose = require("mongoose");
const { Schema } = mongoose;

const TherapySessionSchema = new Schema({
  patientId: { 
    type: Schema.Types.ObjectId, 
    ref: "User",
    required: true 
  },
  // ✅ NEW: Doctor field (optional)
  doctorId: { 
    type: Schema.Types.ObjectId, 
    ref: "User"
  },
  therapistId: { 
    type: Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  roomId: { 
    type: Schema.Types.ObjectId, 
    ref: "Room" 
  },
  therapyType: { 
    type: String, 
    required: true 
  },
  startTime: { 
    type: Date, 
    required: true 
  },
  endTime: { 
    type: Date, 
    required: true 
  },
  status: {
    type: String,
    enum: ["scheduled", "ongoing", "completed", "cancelled"],
    default: "scheduled",
  },
  notes: String,
}, { timestamps: true });

// ✅ Add indexes for better query performance
TherapySessionSchema.index({ startTime: 1, status: 1 });
TherapySessionSchema.index({ patientId: 1 });
TherapySessionSchema.index({ therapistId: 1 });
TherapySessionSchema.index({ doctorId: 1 }); // ✅ NEW: Index for doctor queries

module.exports = mongoose.model("TherapySession", TherapySessionSchema);
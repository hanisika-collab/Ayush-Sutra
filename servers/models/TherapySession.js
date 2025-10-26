const mongoose = require("mongoose");
const { Schema } = mongoose;

const TherapySessionSchema = new Schema({
  // ✅ IMPORTANT: Use "User" instead of "Patient" if your patients are stored in User model
  patientId: { 
    type: Schema.Types.ObjectId, 
    ref: "User", // ✅ Changed from "Patient" to "User"
    required: true 
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
  }, // Abhyanga, Swedana, etc.
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

// ✅ Add index for better query performance
TherapySessionSchema.index({ startTime: 1, status: 1 });
TherapySessionSchema.index({ patientId: 1 });
TherapySessionSchema.index({ therapistId: 1 });

module.exports = mongoose.model("TherapySession", TherapySessionSchema);
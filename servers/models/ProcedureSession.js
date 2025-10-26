const mongoose = require("mongoose");
const { Schema } = mongoose;

// Sub-schema for steps
const StepSchema = new Schema({
  stepName: { type: String, required: true },
  description: String,
  startTime: Date,
  endTime: Date,
  duration: Number, // minutes
  status: { type: String, enum: ["pending", "in-progress", "completed"], default: "pending" },
  notes: String,
});

// Sub-schema for vitals
const VitalsSchema = new Schema({
  heartRate: String,
  bloodPressure: String,
  temperature: String,
  recordedAt: { type: Date, default: Date.now },
});

// Main Procedure Session
const ProcedureSessionSchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
  therapistId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  therapyType: { type: String, required: true },
  steps: [StepSchema],
  vitals: [VitalsSchema],
  startTime: { type: Date, default: Date.now },
  endTime: Date,
  status: { type: String, enum: ["pending", "in-progress", "completed"], default: "pending" },
  notes: String,
}, { timestamps: true });

module.exports = mongoose.model("ProcedureSession", ProcedureSessionSchema);

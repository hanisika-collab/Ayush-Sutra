const mongoose = require("mongoose");
const { Schema } = mongoose;

// Step sub-schema
const StepSchema = new Schema({
  stepName: { type: String, required: true },
  description: String,
  startTime: Date,
  endTime: Date,
  duration: Number, // minutes
  elapsed: { type: Number, default: 0 }, // seconds - for real-time tracking
  status: { type: String, enum: ["pending", "in-progress", "completed"], default: "pending" },
  notes: String,
});

// Vitals sub-schema
const VitalsSchema = new Schema({
  heartRate: String,
  bloodPressure: String,
  temperature: String,
  recordedAt: { type: Date, default: Date.now },
});

// Main Procedure Session schema
const ProcedureSessionSchema = new Schema(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    therapistId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    therapyType: { type: String, required: true },
    procedureName: String, // Added field for display
    steps: [StepSchema],
    vitals: [VitalsSchema],
    startTime: { type: Date, default: Date.now },
    endTime: Date,
    status: { type: String, enum: ["pending", "in-progress", "completed"], default: "pending" },
    notes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("ProcedureSession", ProcedureSessionSchema);
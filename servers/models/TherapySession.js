const mongoose = require("mongoose");
const { Schema } = mongoose;

const ProcedureStepSchema = new Schema({
  stepName: { type: String, required: true }, // e.g., Abhyanga, Swedana
  startTime: Date,
  endTime: Date,
  status: { type: String, enum: ["pending","ongoing","completed"], default: "pending" },
  notes: String,
});

const TherapySessionSchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
  therapistId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true },
  therapyType: { type: String, required: true },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  status: { type: String, enum: ["scheduled", "ongoing", "completed", "cancelled"], default: "scheduled" },
  notes: String,
  steps: [ProcedureStepSchema], // ✅ Track procedure steps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

TherapySessionSchema.pre("save", function(next){
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("TherapySession", TherapySessionSchema);

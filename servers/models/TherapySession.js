const mongoose = require("mongoose");
const { Schema } = mongoose;

const TherapySessionSchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
  therapistId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  roomId: { type: Schema.Types.ObjectId, ref: "Room" },
  therapyType: { type: String, required: true }, // Abhyanga, Swedana, etc.
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  status: {
    type: String,
    enum: ["scheduled", "ongoing", "completed", "cancelled"],
    default: "scheduled",
  },
  notes: String,
}, { timestamps: true });

module.exports = mongoose.model("TherapySession", TherapySessionSchema);

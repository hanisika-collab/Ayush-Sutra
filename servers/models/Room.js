// models/Room.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const SlotSchema = new Schema({
  dayOfWeek: { type: Number, min: 0, max: 6 }, // 0=Sun..6=Sat
  startTime: String, // "09:00"
  endTime: String,   // "13:00"
  maxConcurrent: { type: Number, default: 1 } // capacity per slot
});

const RoomSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, required: true }, // ✅ ADDED - e.g., "Shirodhara", "Abhyanga"
  location: String,
  capacity: { type: Number, default: 1 }, // ✅ ADDED - number of people
  available: { type: Boolean, default: true }, // ✅ ADDED - is room available
  slots: [SlotSchema],
  resources: [String], // e.g., ["stool","steam machine"]
  createdAt: { type: Date, default: Date.now },
  active: { type: Boolean, default: true }
}, { timestamps: true }); // ✅ ADDED timestamps

module.exports = mongoose.model('Room', RoomSchema);
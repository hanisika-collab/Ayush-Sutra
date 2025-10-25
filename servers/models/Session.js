// models/Session.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const SessionSchema = new Schema({
  patient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  therapist: { type: Schema.Types.ObjectId, ref: 'User' },
  doctor: { type: Schema.Types.ObjectId, ref: 'User' },
  room: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  therapyType: { type: String },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  status: { type: String, enum: ['scheduled','completed','cancelled','no-show'], default: 'scheduled' },
  createdAt: { type: Date, default: Date.now },
  notes: String
});

module.exports = mongoose.model('Session', SessionSchema);

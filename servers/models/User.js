// models/User.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin','doctor','therapist','patient'], default: 'patient' },
  phone: String,
  meta: Schema.Types.Mixed, // arbitrary metadata (qualifications, notes)
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date,
  active: { type: Boolean, default: true }
});

module.exports = mongoose.model('User', UserSchema);

// models/Audit.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const AuditSchema = new Schema({
  actor: { type: Schema.Types.ObjectId, ref: 'User' },
  action: String,
  details: Schema.Types.Mixed,
  ip: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Audit', AuditSchema);

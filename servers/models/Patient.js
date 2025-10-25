// models/Patient.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const DocumentSchema = new Schema({
  fileName: String,
  filePath: String,
  uploadedAt: { type: Date, default: Date.now },
});

const PatientSchema = new Schema({
  name: String,
  age: Number,
  gender: String,
  contact: String,
  email: String,
  address: String,
  doshaType: String,
  medicalHistory: String,
  documents: [DocumentSchema], // ✅ added
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Patient", PatientSchema);

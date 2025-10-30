// routes/Patients.js - ENHANCED VERSION
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const Patient = require("../models/Patient");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

/* -----------------------------
   🧩 MULTER SETUP FOR FILE UPLOAD
------------------------------ */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads/patient_docs";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// ✅ Apply auth middleware to all routes
router.use(auth);

/* -----------------------------
   🩺 PATIENT CRUD ROUTES
------------------------------ */

// ✅ CREATE PATIENT + USER ACCOUNT
// Admin, Doctor, and Therapist can create patients
router.post("/", async (req, res) => {
  try {
    console.log("\n👥 Creating new patient by:", req.user.role);
    
    // ✅ Check permissions
    if (!['admin', 'doctor', 'therapist'].includes(req.user.role)) {
      return res.status(403).json({ error: "Only admin, doctor, or therapist can create patients" });
    }

    const {
      name,
      age,
      gender,
      contact,
      email,
      password, // ✅ NEW: For user account
      address,
      doshaType,
      medicalHistory,
    } = req.body;

    // ✅ Validation
    if (!name || !age || !gender || !contact) {
      return res.status(400).json({ 
        error: "Name, age, gender, and contact are required" 
      });
    }

    // ✅ Step 1: Create User Account (if email and password provided)
    let userId = null;
    if (email && password) {
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ 
          error: "A user with this email already exists" 
        });
      }

      // Create user account
      const passwordHash = await bcrypt.hash(password, 12);
      const user = new User({
        name,
        email,
        passwordHash,
        role: "patient",
        phone: contact,
      });

      await user.save();
      userId = user._id;
      console.log("✅ Created user account for patient:", email);
    }

    // ✅ Step 2: Create Patient Record
    const patient = new Patient({
      name,
      age,
      gender,
      contact,
      email,
      address,
      doshaType,
      medicalHistory,
      documents: [],
    });

    await patient.save();
    console.log("✅ Created patient record:", patient._id);

    res.status(201).json({
      message: "Patient created successfully",
      patient,
      userAccountCreated: !!userId,
      userId,
      credentials: email && password ? {
        email,
        note: "Password set by creator"
      } : null
    });
  } catch (err) {
    console.error("❌ Create patient error:", err);
    res.status(500).json({ 
      error: "Failed to create patient",
      message: err.message 
    });
  }
});

// ✅ Get all patients
// Role-based filtering
router.get("/", async (req, res) => {
  try {
    console.log("\n📋 Fetching patients by:", req.user.role);
    
    // ✅ All authenticated users can view patients
    // But you could add filters here if needed
    const patients = await Patient.find().sort({ createdAt: -1 });
    
    console.log(`✅ Found ${patients.length} patients`);
    res.json(patients);
  } catch (err) {
    console.error("❌ Fetch patients error:", err);
    res.status(500).json({ error: "Failed to fetch patients" });
  }
});

// ✅ Get single patient by ID
router.get("/:id", async (req, res) => {
  try {
    console.log(`\n📋 Fetching patient: ${req.params.id}`);
    
    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    
    console.log("✅ Patient found:", patient.name);
    res.json(patient);
  } catch (err) {
    console.error("❌ Fetch patient error:", err);
    res.status(500).json({ error: "Failed to fetch patient" });
  }
});

// ✅ Update patient
// Admin, Doctor, and Therapist can update
router.put("/:id", async (req, res) => {
  try {
    console.log(`\n🔄 Updating patient: ${req.params.id}`);
    
    // ✅ Check permissions
    if (!['admin', 'doctor', 'therapist'].includes(req.user.role)) {
      return res.status(403).json({ error: "You don't have permission to update patients" });
    }

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    
    console.log("✅ Patient updated:", patient.name);
    res.json({ message: "Patient updated", patient });
  } catch (err) {
    console.error("❌ Update patient error:", err);
    res.status(500).json({ error: "Failed to update patient" });
  }
});

// ✅ Delete patient
// Only admin can delete
router.delete("/:id", async (req, res) => {
  try {
    console.log(`\n🗑️ Deleting patient: ${req.params.id}`);
    
    // ✅ Only admin can delete
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Only admin can delete patients" });
    }

    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    
    // ✅ Also delete associated user account if exists
    if (patient.email) {
      await User.findOneAndDelete({ email: patient.email, role: 'patient' });
      console.log("✅ Deleted associated user account");
    }
    
    console.log("✅ Patient deleted");
    res.json({ message: "Patient deleted successfully" });
  } catch (err) {
    console.error("❌ Delete patient error:", err);
    res.status(500).json({ error: "Failed to delete patient" });
  }
});

/* -----------------------------
   📂 FILE UPLOAD ROUTE
------------------------------ */

// ✅ Upload patient document
router.post("/:id/upload", upload.single("file"), async (req, res) => {
  try {
    console.log(`\n📤 Uploading document for patient: ${req.params.id}`);
    
    // ✅ Check permissions
    if (!['admin', 'doctor', 'therapist'].includes(req.user.role)) {
      return res.status(403).json({ error: "You don't have permission to upload documents" });
    }

    const patient = await Patient.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = `/uploads/patient_docs/${req.file.filename}`;

    patient.documents.push({
      fileName: req.file.originalname,
      filePath,
      uploadedAt: new Date(),
    });

    await patient.save();
    console.log("✅ File uploaded successfully");

    res.json({
      message: "File uploaded successfully",
      file: {
        name: req.file.originalname,
        path: filePath,
      },
    });
  } catch (err) {
    console.error("❌ File upload error:", err);
    res.status(500).json({ error: "File upload failed" });
  }
});

module.exports = router;
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Patient = require("../models/Patient");

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

/* -----------------------------
   🩺 PATIENT CRUD ROUTES
------------------------------ */

// ✅ Add patient
router.post("/", async (req, res) => {
  try {
    const patient = new Patient(req.body);
    await patient.save();
    res.status(201).json({ message: "Patient added successfully", patient });
  } catch (err) {
    res.status(500).json({ error: "Failed to add patient" });
  }
});

// ✅ Get all patients
router.get("/", async (req, res) => {
  try {
    const patients = await Patient.find();
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch patients" });
  }
});

// ✅ Get single patient by ID
router.get("/:id", async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch patient" });
  }
});

// ✅ Update patient
router.put("/:id", async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    res.json({ message: "Patient updated", patient });
  } catch (err) {
    res.status(500).json({ error: "Failed to update patient" });
  }
});

// ✅ Delete patient
router.delete("/:id", async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    res.json({ message: "Patient deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete patient" });
  }
});

/* -----------------------------
   📂 FILE UPLOAD ROUTE
------------------------------ */

// ✅ Upload patient document (lab report, prescription, etc.)
router.post("/:id/upload", upload.single("file"), async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    const filePath = `/uploads/patient_docs/${req.file.filename}`;

    patient.documents.push({
      fileName: req.file.originalname,
      filePath,
      uploadedAt: new Date(),
    });

    await patient.save();

    res.json({
      message: "File uploaded successfully",
      file: {
        name: req.file.originalname,
        path: filePath,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "File upload failed" });
  }
});

module.exports = router;

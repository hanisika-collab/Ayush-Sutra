const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const Prescription = require("../models/Prescription");
const Patient = require("../models/Patient");
const router = express.Router();

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads/prescriptions";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// -----------------------------
// 📄 Prescription Routes
// -----------------------------

// POST: Upload new prescription
router.post("/", upload.single("file"), async (req, res) => {
  try {
    const { patientId, uploadedBy, notes } = req.body;

    // Validate required fields
    if (!patientId || !uploadedBy) {
      return res.status(400).json({ error: "Patient ID and uploader ID are required" });
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ error: "Invalid Patient ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(uploadedBy)) {
      return res.status(400).json({ error: "Invalid Uploader ID" });
    }

    // Check if patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    // Check if file exists
    if (!req.file) {
      return res.status(400).json({ error: "Prescription file is required" });
    }

    const filePath = `/uploads/prescriptions/${req.file.filename}`;

    const prescription = new Prescription({
      patientId,
      uploadedBy,
      fileName: req.file.originalname,
      filePath,
      notes,
    });

    await prescription.save();

    res.status(201).json({ message: "Prescription uploaded successfully", prescription });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to upload prescription", details: err.message });
  }
});

// GET: All prescriptions
router.get("/", async (req, res) => {
  try {
    const prescriptions = await Prescription.find()
      .populate("patientId", "name")
      .populate("uploadedBy", "name email")
      .sort({ uploadedAt: -1 });
    res.json(prescriptions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch prescriptions" });
  }
});

// GET: Single prescription by ID
router.get("/:id", async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate("patientId", "name")
      .populate("uploadedBy", "name email");
    if (!prescription) return res.status(404).json({ error: "Prescription not found" });
    res.json(prescription);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch prescription" });
  }
});

// DELETE: Remove prescription
router.delete("/:id", async (req, res) => {
  try {
    const prescription = await Prescription.findByIdAndDelete(req.params.id);
    if (!prescription) return res.status(404).json({ error: "Prescription not found" });

    // Delete file from disk
    const filePath = path.join(__dirname, "..", prescription.filePath);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({ message: "Prescription deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete prescription" });
  }
});

module.exports = router;

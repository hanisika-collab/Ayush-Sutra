const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const Prescription = require("../models/Prescription");
const Notification = require("../models/Notification");
const User = require("../models/User"); // ✅ FIXED: Use User model for patients
// const Patient = require("../models/Patient"); // ❌ Remove this

const verifyToken = require("../middleware/auth");
const { sendEmail } = require("../services/emailService");

const router = express.Router();

// -----------------------------
// ⚙️ Multer Storage Setup
// -----------------------------
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
// 📄 POST: Upload New Prescription
// -----------------------------
router.post("/", verifyToken, upload.single("file"), async (req, res) => {
  try {
    const { patientId, notes } = req.body;
    const uploadedBy = req.user.id; // from JWT

    console.log("📄 Uploading prescription:", { patientId, uploadedBy });

    // Validate file presence
    if (!req.file) {
      return res.status(400).json({ error: "Prescription file is required" });
    }

    // Validate patient ID
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ error: "Invalid patient ID" });
    }

    // ✅ FIXED: Verify uploader role
    const uploader = await User.findById(uploadedBy);
    if (!uploader) {
      return res.status(401).json({ error: "Unauthorized user" });
    }

    console.log("👤 Uploader role:", uploader.role);

    if (!["doctor", "therapist", "admin"].includes(uploader.role)) {
      return res.status(403).json({
        error: "Only doctors, therapists, or admins can upload prescriptions",
      });
    }

    // ✅ FIXED: Verify patient exists (in User model with role='patient')
    const patientUser = await User.findById(patientId);
    if (!patientUser || patientUser.role !== "patient") {
      console.log("❌ Patient not found or invalid role:", patientUser?.role);
      return res.status(404).json({ error: "Patient not found" });
    }

    console.log("✅ Patient found:", patientUser.name);

    // Create prescription record
    const filePath = `/uploads/prescriptions/${req.file.filename}`;
    const prescription = new Prescription({
      patientId,
      uploadedBy,
      fileName: req.file.originalname,
      filePath,
      notes,
    });
    await prescription.save();

    console.log("✅ Prescription saved:", prescription._id);

    // Create notification for patient
    const notification = new Notification({
      userId: patientId,
      type: "general", // ✅ Changed from "prescription" to "general"
      title: "New Prescription Uploaded",
      message: `${uploader.role === 'doctor' ? 'Dr.' : ''} ${uploader.name} has uploaded a new prescription: ${req.file.originalname}`,
      channel: "email",
      scheduledFor: new Date(),
      metadata: {
        prescriptionId: prescription._id,
        uploadedBy: uploader.name,
        fileName: req.file.originalname,
      },
    });

    await notification.save();
    console.log("✅ Notification created");

    // Send email to patient
    if (patientUser.email) {
      const emailResult = await sendEmail(patientUser.email, "prescription-upload", {
        patientName: patientUser.name,
        uploadedByName: uploader.name,
        fileName: req.file.originalname,
        notes,
      });

      if (emailResult.success) {
        notification.status = "sent";
        notification.sentAt = new Date();
        await notification.save();
        console.log("✅ Email sent successfully");
      } else {
        console.warn("⚠️ Email failed:", emailResult.error);
      }
    }

    res.status(201).json({
      message: "Prescription uploaded successfully",
      prescription,
    });
  } catch (err) {
    console.error("❌ Prescription Upload Error:", err);
    res.status(500).json({
      error: "Failed to upload prescription",
      details: err.message,
    });
  }
});

// -----------------------------
// 📄 GET: All Prescriptions (NO AUTH REQUIRED)
// -----------------------------
router.get("/", async (req, res) => {
  try {
    console.log("📋 Fetching all prescriptions");
    
    const prescriptions = await Prescription.find()
      .populate("patientId", "name email")
      .populate("uploadedBy", "name email role")
      .sort({ uploadedAt: -1 });

    console.log(`✅ Found ${prescriptions.length} prescriptions`);
    res.json(prescriptions);
  } catch (err) {
    console.error("❌ Fetch Prescriptions Error:", err);
    res.status(500).json({ error: "Failed to fetch prescriptions" });
  }
});

// -----------------------------
// 📄 GET: Single Prescription
// -----------------------------
router.get("/:id", async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate("patientId", "name email")
      .populate("uploadedBy", "name email role");

    if (!prescription) {
      return res.status(404).json({ error: "Prescription not found" });
    }

    res.json(prescription);
  } catch (err) {
    console.error("❌ Fetch Prescription Error:", err);
    res.status(500).json({ error: "Failed to fetch prescription" });
  }
});

// -----------------------------
// ❌ DELETE: Remove Prescription
// -----------------------------
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription)
      return res.status(404).json({ error: "Prescription not found" });

    // Only uploader or admin can delete
    const user = await User.findById(req.user.id);
    if (
      !user ||
      (user.role !== "admin" && user._id.toString() !== prescription.uploadedBy.toString())
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Remove from DB
    await prescription.deleteOne();

    // Delete physical file
    const filePath = path.join(__dirname, "..", prescription.filePath);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({ message: "Prescription deleted successfully" });
  } catch (err) {
    console.error("❌ Delete Prescription Error:", err);
    res.status(500).json({ error: "Failed to delete prescription" });
  }
});

module.exports = router;
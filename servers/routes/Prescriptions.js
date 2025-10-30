// servers/routes/Prescriptions.js - COMPLETE FIX
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const Prescription = require("../models/Prescription");
const Notification = require("../models/Notification");
const User = require("../models/User");

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
    const uploadedBy = req.user.id || req.user._id;

    console.log("\n📄 Uploading prescription:", { patientId, uploadedBy, uploaderRole: req.user.role });

    if (!req.file) {
      return res.status(400).json({ error: "Prescription file is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ error: "Invalid patient ID" });
    }

    // Verify uploader role
    const uploader = await User.findById(uploadedBy);
    if (!uploader) {
      return res.status(401).json({ error: "Unauthorized user" });
    }

    console.log("👤 Uploader:", uploader.name, "Role:", uploader.role);

    if (!["doctor", "therapist", "admin"].includes(uploader.role)) {
      return res.status(403).json({
        error: "Only doctors, therapists, or admins can upload prescriptions",
      });
    }

    // ✅ FIX: Find patient in User collection with role='patient'
    const patientUser = await User.findOne({ 
      _id: patientId, 
      role: "patient" 
    });
    
    if (!patientUser) {
      console.log("❌ Patient not found. ID:", patientId);
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

    // ✅ FIX: Populate immediately after save
    await prescription.populate([
      { path: "patientId", select: "name email role" },
      { path: "uploadedBy", select: "name email role" }
    ]);

    console.log("✅ Populated patient:", prescription.patientId?.name);

    // Create notification
    const notification = new Notification({
      userId: patientId,
      type: "general",
      title: "New Prescription Uploaded",
      message: `${uploader.role === 'doctor' ? 'Dr. ' : ''}${uploader.name} has uploaded a new prescription: ${req.file.originalname}`,
      channel: "email",
      scheduledFor: new Date(),
      metadata: {
        prescriptionId: prescription._id,
        uploadedBy: uploader.name,
        fileName: req.file.originalname,
      },
    });

    await notification.save();

    // Send email (async)
    if (patientUser.email) {
      setImmediate(async () => {
        try {
          await sendEmail(patientUser.email, "prescription-upload", {
            patientName: patientUser.name,
            uploadedByName: uploader.name,
            fileName: req.file.originalname,
            notes,
          });
          notification.status = "sent";
          notification.sentAt = new Date();
          await notification.save();
        } catch (err) {
          console.warn("⚠️ Email error:", err.message);
        }
      });
    }

    res.status(201).json({
      message: "Prescription uploaded successfully",
      prescription,
    });
  } catch (err) {
    console.error("❌ Upload Error:", err);
    res.status(500).json({
      error: "Failed to upload prescription",
      details: err.message,
    });
  }
});

// -----------------------------
// 📄 GET: All Prescriptions
// -----------------------------
router.get("/", verifyToken, async (req, res) => {
  try {
    console.log("\n📋 Fetching prescriptions for:", req.user.role);
    
    let query = {};
    
    // Role-based filtering
    if (req.user.role === 'patient') {
      query.patientId = req.user._id;
    }
    
    const prescriptions = await Prescription.find(query)
      .populate("patientId", "name email role")
      .populate("uploadedBy", "name email role")
      .sort({ uploadedAt: -1 });

    console.log(`✅ Found ${prescriptions.length} prescriptions`);
    
    // Debug: Log first prescription
    if (prescriptions.length > 0) {
      console.log("Sample prescription:", {
        id: prescriptions[0]._id,
        fileName: prescriptions[0].fileName,
        patientName: prescriptions[0].patientId?.name,
        uploaderName: prescriptions[0].uploadedBy?.name
      });
    }
    
    res.json(prescriptions);
  } catch (err) {
    console.error("❌ Fetch Error:", err);
    res.status(500).json({ error: "Failed to fetch prescriptions" });
  }
});

// -----------------------------
// 📄 GET: Single Prescription
// -----------------------------
router.get("/:id", verifyToken, async (req, res) => {
  try {
    console.log("\n📋 Fetching single prescription:", req.params.id);
    
    const prescription = await Prescription.findById(req.params.id)
      .populate("patientId", "name email role")
      .populate("uploadedBy", "name email role");

    if (!prescription) {
      console.log("❌ Prescription not found");
      return res.status(404).json({ error: "Prescription not found" });
    }

    // Check access
    if (req.user.role === 'patient' && 
        prescription.patientId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Access denied" });
    }

    console.log("✅ Found prescription for:", prescription.patientId?.name);
    res.json(prescription);
  } catch (err) {
    console.error("❌ Fetch Error:", err);
    res.status(500).json({ error: "Failed to fetch prescription" });
  }
});

// -----------------------------
// 📥 GET: Download Prescription (FIXED ROUTE)
// -----------------------------
router.get("/:id/download", verifyToken, async (req, res) => {
  try {
    console.log(`\n📥 Download request for: ${req.params.id}`);
    console.log("User:", req.user.role, req.user._id);
    
    const prescription = await Prescription.findById(req.params.id)
      .populate("patientId", "_id name");

    if (!prescription) {
      console.log("❌ Prescription not found");
      return res.status(404).json({ error: "Prescription not found" });
    }

    console.log("✅ Prescription found:", prescription.fileName);
    console.log("Patient ID:", prescription.patientId?._id);
    console.log("Requesting user ID:", req.user._id);

    // Check access
    if (req.user.role === 'patient') {
      const patientIdStr = prescription.patientId?._id?.toString();
      const userIdStr = req.user._id.toString();
      
      if (patientIdStr !== userIdStr) {
        console.log("❌ Access denied. Patient mismatch.");
        return res.status(403).json({ error: "Access denied" });
      }
    }

    // Get file path
    const filePath = path.join(__dirname, "..", prescription.filePath);
    console.log("📂 File path:", filePath);
    
    if (!fs.existsSync(filePath)) {
      console.error("❌ File not found at:", filePath);
      return res.status(404).json({ error: "File not found on server" });
    }

    console.log("✅ File exists, sending download...");

    // Send file
    res.download(filePath, prescription.fileName, (err) => {
      if (err) {
        console.error("❌ Download error:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Failed to download file" });
        }
      } else {
        console.log("✅ File downloaded successfully");
      }
    });
  } catch (err) {
    console.error("❌ Download Error:", err);
    res.status(500).json({ 
      error: "Failed to download prescription",
      details: err.message 
    });
  }
});

// -----------------------------
// ❌ DELETE: Remove Prescription
// -----------------------------
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    console.log("\n🗑️ Delete request for:", req.params.id);
    
    const prescription = await Prescription.findById(req.params.id)
      .populate("uploadedBy", "_id role");
      
    if (!prescription) {
      return res.status(404).json({ error: "Prescription not found" });
    }

    // Check permissions
    const canDelete = 
      req.user.role === "admin" || 
      prescription.uploadedBy._id.toString() === req.user._id.toString();
      
    if (!canDelete) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Delete from database
    await prescription.deleteOne();

    // Delete physical file
    const filePath = path.join(__dirname, "..", prescription.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("✅ File deleted");
    }

    res.json({ message: "Prescription deleted successfully" });
  } catch (err) {
    console.error("❌ Delete Error:", err);
    res.status(500).json({ error: "Failed to delete prescription" });
  }
});

module.exports = router;
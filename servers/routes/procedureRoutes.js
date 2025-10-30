// servers/routes/procedureRoutes.js - UPDATED VERSION
const express = require("express");
const router = express.Router();
const ProcedureSession = require("../models/ProcedureSession");
const User = require("../models/User");

// --------------------------------------
// 🔹 GET all procedures (WITH FILTERS)
// --------------------------------------
router.get("/", async (req, res) => {
  try {
    const { patientId, therapistId, status } = req.query;
    
    // Build query filter
    const filter = {};
    
    if (patientId) filter.patientId = patientId;
    if (therapistId) filter.therapistId = therapistId;
    if (status) filter.status = status;
    
    console.log("\n📋 Fetching procedures with filter:", filter);
    
    const procedures = await ProcedureSession.find(filter)
      .populate({
        path: "patientId",
        select: "name email phone role",
        model: "User"
      })
      .populate({
        path: "therapistId",
        select: "name email role",
        model: "User"
      })
      .sort({ createdAt: -1 });
    
    console.log(`✅ Found ${procedures.length} procedures`);
    
    res.json(procedures);
  } catch (err) {
    console.error("❌ Fetch procedures error:", err);
    res.status(500).json({ error: "Failed to fetch procedures", message: err.message });
  }
});

// --------------------------------------
// 🔹 GET single procedure by ID
// --------------------------------------
router.get("/:id", async (req, res) => {
  try {
    console.log(`\n📋 Fetching procedure: ${req.params.id}`);
    
    const procedure = await ProcedureSession.findById(req.params.id)
      .populate({
        path: "patientId",
        select: "name email phone role",
        model: "User"
      })
      .populate({
        path: "therapistId",
        select: "name email role",
        model: "User"
      });

    if (!procedure) {
      console.log("❌ Procedure not found");
      return res.status(404).json({ error: "Procedure not found" });
    }
    
    console.log("✅ Procedure found");
    res.json(procedure);
  } catch (err) {
    console.error("❌ Fetch single procedure error:", err);
    res.status(500).json({ error: "Failed to fetch procedure", message: err.message });
  }
});

// --------------------------------------
// 🔹 CREATE new procedure session
// --------------------------------------
router.post("/", async (req, res) => {
  try {
    const { patientId, therapistId, therapyType, procedureName, notes } = req.body;
    
    console.log("\n📝 Creating new procedure:", { patientId, therapistId, therapyType });
    
    if (!patientId || !therapistId || !therapyType) {
      return res.status(400).json({ 
        error: "patientId, therapistId and therapyType are required" 
      });
    }

    // Verify patient exists
    const patient = await User.findById(patientId);
    if (!patient) {
      console.log("❌ Patient not found:", patientId);
      return res.status(404).json({ error: "Patient not found" });
    }
    
    // Verify therapist exists
    const therapist = await User.findById(therapistId);
    if (!therapist) {
      console.log("❌ Therapist not found:", therapistId);
      return res.status(404).json({ error: "Therapist not found" });
    }
    
    const session = new ProcedureSession({
      patientId,
      therapistId,
      therapyType,
      procedureName: procedureName || therapyType,
      notes,
      status: "in-progress"
    });

    await session.save();
    
    // Populate before returning
    await session.populate({
      path: "patientId",
      select: "name email phone role",
      model: "User"
    });
    await session.populate({
      path: "therapistId",
      select: "name email role",
      model: "User"
    });
    
    console.log("✅ Procedure created successfully:", session._id);
    
    req.app.get("io")?.emit("procedureUpdated", session);
    res.status(201).json(session);
  } catch (err) {
    console.error("❌ Create procedure error:", err);
    res.status(400).json({ error: "Failed to create procedure", message: err.message });
  }
});

// --------------------------------------
// 🔹 ADD a new step
// --------------------------------------
router.post("/:id/add-step", async (req, res) => {
  try {
    const { stepName, description } = req.body;
    
    console.log(`\n➕ Adding step to procedure: ${req.params.id}`);
    
    if (!stepName) return res.status(400).json({ error: "stepName is required" });

    const procedure = await ProcedureSession.findById(req.params.id)
      .populate({
        path: "patientId",
        select: "name email phone role",
        model: "User"
      })
      .populate({
        path: "therapistId",
        select: "name email role",
        model: "User"
      });
      
    if (!procedure) {
      console.log("❌ Procedure not found");
      return res.status(404).json({ error: "Procedure not found" });
    }

    procedure.steps.push({ 
      stepName, 
      description,
      status: "pending",
      elapsed: 0
    });
    
    await procedure.save();

    console.log("✅ Step added:", stepName);
    
    req.app.get("io")?.emit("procedureUpdated", procedure);
    res.json(procedure);
  } catch (err) {
    console.error("❌ Add step error:", err);
    res.status(500).json({ error: "Failed to add step", message: err.message });
  }
});

// --------------------------------------
// 🔹 UPDATE a step status
// --------------------------------------
router.put("/:id/step/:stepId", async (req, res) => {
  try {
    const { status, elapsed } = req.body;
    
    console.log(`\n🔄 Updating step ${req.params.stepId} to status: ${status}`);
    
    if (!["pending", "in-progress", "completed"].includes(status)) {
      return res.status(400).json({ error: "Invalid step status" });
    }

    const procedure = await ProcedureSession.findById(req.params.id)
      .populate({
        path: "patientId",
        select: "name email phone role",
        model: "User"
      })
      .populate({
        path: "therapistId",
        select: "name email role",
        model: "User"
      });
      
    if (!procedure) {
      console.log("❌ Procedure not found");
      return res.status(404).json({ error: "Procedure not found" });
    }

    const step = procedure.steps.id(req.params.stepId);
    if (!step) {
      console.log("❌ Step not found");
      return res.status(404).json({ error: "Step not found" });
    }

    step.status = status;
    if (status === "in-progress" && !step.startTime) step.startTime = new Date();
    if (status === "completed") {
      if (!step.endTime) step.endTime = new Date();
      if (elapsed !== undefined) step.elapsed = elapsed;
    }

    await procedure.save();
    
    console.log("✅ Step updated successfully");
    
    req.app.get("io")?.emit("procedureUpdated", procedure);
    res.json(procedure);
  } catch (err) {
    console.error("❌ Update step error:", err);
    res.status(500).json({ error: "Failed to update step", message: err.message });
  }
});

// --------------------------------------
// 🔹 ADD VITALS
// --------------------------------------
router.post("/:id/vitals", async (req, res) => {
  try {
    const { heartRate, bloodPressure, temperature } = req.body;
    
    console.log(`\n💓 Adding vitals to procedure: ${req.params.id}`);
    
    const procedure = await ProcedureSession.findById(req.params.id)
      .populate({
        path: "patientId",
        select: "name email phone role",
        model: "User"
      })
      .populate({
        path: "therapistId",
        select: "name email role",
        model: "User"
      });
      
    if (!procedure) {
      console.log("❌ Procedure not found");
      return res.status(404).json({ error: "Procedure not found" });
    }

    procedure.vitals.push({ heartRate, bloodPressure, temperature });
    await procedure.save();

    console.log("✅ Vitals added successfully");
    
    req.app.get("io")?.emit("procedureUpdated", procedure);
    res.json(procedure);
  } catch (err) {
    console.error("❌ Add vitals error:", err);
    res.status(500).json({ error: "Failed to add vitals", message: err.message });
  }
});

// --------------------------------------
// 🔹 MARK PROCEDURE AS COMPLETED
// --------------------------------------
router.put("/:id/complete", async (req, res) => {
  try {
    console.log(`\n✅ Completing procedure: ${req.params.id}`);
    
    const procedure = await ProcedureSession.findById(req.params.id)
      .populate({
        path: "patientId",
        select: "name email phone role",
        model: "User"
      })
      .populate({
        path: "therapistId",
        select: "name email role",
        model: "User"
      });
      
    if (!procedure) {
      console.log("❌ Procedure not found");
      return res.status(404).json({ error: "Procedure not found" });
    }

    // Mark procedure as completed
    procedure.status = "completed";
    procedure.endTime = new Date();
    await procedure.save();

    console.log("✅ Procedure completed successfully");

    // ✅ ALSO UPDATE RELATED THERAPY SESSION STATUS
    try {
      const relatedSession = await TherapySession.findOne({
        patientId: procedure.patientId._id,
        therapistId: procedure.therapistId._id,
        therapyType: procedure.therapyType,
        status: { $in: ['scheduled', 'ongoing'] }
      }).sort({ startTime: -1 });

      if (relatedSession) {
        relatedSession.status = 'completed';
        await relatedSession.save();
        console.log("✅ Updated related therapy session to completed");
      }
    } catch (err) {
      console.warn("⚠️ Could not update therapy session:", err.message);
    }

    // ✅ AUTO-CREATE POST-THERAPY NOTIFICATION
    try {
      const patient = procedure.patientId;
      const therapist = procedure.therapistId;
      
      if (patient && patient.email) {
        console.log("📧 Creating post-therapy notification...");
        
        const notification = new Notification({
          userId: patient._id,
          type: 'post-therapy',
          title: `Post-Care: ${procedure.therapyType} Session`,
          message: `Your ${procedure.therapyType} therapy session has been completed. Please follow the post-care instructions sent to your email.`,
          channel: 'email',
          scheduledFor: new Date(),
          metadata: {
            therapyType: procedure.therapyType,
            therapistName: therapist?.name || 'Your therapist',
            completedAt: new Date().toLocaleString(),
            nextSession: 'To be scheduled'
          }
        });
        
        await notification.save();
        console.log("✅ Post-therapy notification created");
        
        // Send email immediately
        const emailResult = await sendEmail(
          patient.email,
          'post-therapy',
          {
            patientName: patient.name,
            therapyType: procedure.therapyType,
            therapistName: therapist?.name || 'Your therapist',
            nextSession: 'Please contact us to schedule your next session'
          }
        );
        
        notification.status = emailResult.success ? 'sent' : 'failed';
        notification.sentAt = new Date();
        notification.metadata.emailSent = emailResult.success;
        notification.metadata.emailError = emailResult.error;
        await notification.save();
        
        if (emailResult.success) {
          console.log("✅ Post-therapy email sent successfully");
        } else {
          console.warn("⚠️ Post-therapy email failed:", emailResult.error);
        }
      } else {
        console.warn("⚠️ Patient email not found, skipping notification");
      }
    } catch (notifErr) {
      console.error("❌ Failed to create post-therapy notification:", notifErr);
      // Don't fail the procedure completion if notification fails
    }
    
    req.app.get("io")?.emit("procedureUpdated", procedure);
    
    res.json({ 
      message: "Procedure completed successfully! Post-therapy notification sent.",
      procedure 
    });
  } catch (err) {
    console.error("❌ Complete procedure error:", err);
    res.status(500).json({ error: "Failed to complete procedure", message: err.message });
  }
});

// --------------------------------------
// 🔹 DELETE procedure
// --------------------------------------
router.delete("/:id", async (req, res) => {
  try {
    console.log(`\n🗑️ Deleting procedure: ${req.params.id}`);
    
    const procedure = await ProcedureSession.findByIdAndDelete(req.params.id);
    if (!procedure) {
      console.log("❌ Procedure not found");
      return res.status(404).json({ error: "Procedure not found" });
    }
    
    console.log("✅ Procedure deleted successfully");
    
    req.app.get("io")?.emit("procedureDeleted", { id: req.params.id });
    res.json({ message: "Procedure deleted successfully" });
  } catch (err) {
    console.error("❌ Delete procedure error:", err);
    res.status(500).json({ error: "Failed to delete procedure", message: err.message });
  }
});

module.exports = router;
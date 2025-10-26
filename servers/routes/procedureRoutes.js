const express = require("express");
const router = express.Router();
const ProcedureSession = require("../models/ProcedureSession");
const User = require("../models/User"); // Make sure this path is correct

// --------------------------------------
// 🔹 GET all procedures (with enhanced population)
// --------------------------------------
router.get("/", async (req, res) => {
  try {
    console.log("\n📋 Fetching all procedures...");
    
    const procedures = await ProcedureSession.find()
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
    
    // Log sample for debugging
    if (procedures.length > 0) {
      const sample = procedures[0];
      console.log("Sample procedure:", {
        id: sample._id,
        therapyType: sample.therapyType,
        patientId: sample.patientId?._id,
        patientName: sample.patientId?.name,
        therapistId: sample.therapistId?._id,
        therapistName: sample.therapistId?.name,
        status: sample.status
      });
    }
    
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
    
    console.log("✅ Procedure found:", {
      id: procedure._id,
      patient: procedure.patientId?.name || "NO NAME",
      therapist: procedure.therapistId?.name || "NO NAME"
    });
    
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
    
    console.log("✅ Patient:", patient.name);
    console.log("✅ Therapist:", therapist.name);

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

    procedure.status = "completed";
    procedure.endTime = new Date();
    await procedure.save();

    console.log("✅ Procedure completed successfully");
    
    req.app.get("io")?.emit("procedureUpdated", procedure);
    res.json(procedure);
  } catch (err) {
    console.error("❌ Complete procedure error:", err);
    res.status(500).json({ error: "Failed to complete procedure", message: err.message });
  }
});

// --------------------------------------
// 🔹 DELETE procedure (optional - for cleanup)
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

// --------------------------------------
// 🔹 FIX existing procedures (run once)
// --------------------------------------
router.post("/fix/all", async (req, res) => {
  try {
    console.log("\n🔧 Fixing all procedures...");
    
    const procedures = await ProcedureSession.find();
    let fixed = 0;
    
    for (const proc of procedures) {
      let needsSave = false;
      
      // Add procedureName if missing
      if (!proc.procedureName && proc.therapyType) {
        proc.procedureName = proc.therapyType;
        needsSave = true;
      }
      
      // Add elapsed to steps if missing
      if (proc.steps && proc.steps.length > 0) {
        proc.steps.forEach(step => {
          if (step.elapsed === undefined) {
            step.elapsed = 0;
            needsSave = true;
          }
        });
      }
      
      // Set default status if missing
      if (!proc.status) {
        proc.status = "in-progress";
        needsSave = true;
      }
      
      if (needsSave) {
        await proc.save();
        fixed++;
        console.log(`✅ Fixed procedure ${proc._id}`);
      }
    }
    
    console.log(`✅ Fixed ${fixed} out of ${procedures.length} procedures`);
    res.json({ 
      message: `Fixed ${fixed} procedures`, 
      total: procedures.length,
      fixed: fixed 
    });
  } catch (err) {
    console.error("❌ Fix procedures error:", err);
    res.status(500).json({ error: "Failed to fix procedures", message: err.message });
  }
});

// --------------------------------------
// 🔹 GET statistics (optional - useful info)
// --------------------------------------
router.get("/stats/summary", async (req, res) => {
  try {
    const total = await ProcedureSession.countDocuments();
    const active = await ProcedureSession.countDocuments({ status: { $ne: "completed" } });
    const completed = await ProcedureSession.countDocuments({ status: "completed" });
    
    const recentProcedures = await ProcedureSession.find()
      .populate({
        path: "patientId",
        select: "name",
        model: "User"
      })
      .populate({
        path: "therapistId",
        select: "name",
        model: "User"
      })
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.json({
      total,
      active,
      completed,
      recent: recentProcedures.map(p => ({
        id: p._id,
        therapy: p.therapyType,
        patient: p.patientId?.name || "Unknown",
        therapist: p.therapistId?.name || "Unknown",
        status: p.status,
        createdAt: p.createdAt
      }))
    });
  } catch (err) {
    console.error("❌ Stats error:", err);
    res.status(500).json({ error: "Failed to get statistics", message: err.message });
  }
});

module.exports = router;
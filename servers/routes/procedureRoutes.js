const express = require("express");
const router = express.Router();
const ProcedureSession = require("../models/ProcedureSession");

// --------------------------------------
// 🔹 GET all procedures
// --------------------------------------
router.get("/", async (req, res) => {
  try {
    const procedures = await ProcedureSession.find()
      .populate("patientId", "name")
      .populate("therapistId", "name")
      .sort({ createdAt: -1 });
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
    const procedure = await ProcedureSession.findById(req.params.id)
      .populate("patientId", "name")
      .populate("therapistId", "name");

    if (!procedure) return res.status(404).json({ error: "Procedure not found" });
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
    const { patientId, therapistId, therapyType, notes } = req.body;
    if (!patientId || !therapistId || !therapyType) {
      return res.status(400).json({ error: "patientId, therapistId and therapyType are required" });
    }

    const session = new ProcedureSession({
      patientId,
      therapistId,
      therapyType,
      notes,
    });

    await session.save();
    req.app.get("io")?.emit("procedureCreated", session);
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
    if (!stepName) return res.status(400).json({ error: "stepName is required" });

    const procedure = await ProcedureSession.findById(req.params.id);
    if (!procedure) return res.status(404).json({ error: "Procedure not found" });

    procedure.steps.push({ stepName, description });
    await procedure.save();

    req.app.get("io")?.emit("procedureUpdated", { procedureId: req.params.id });
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
    const { status } = req.body;
    if (!["pending", "in-progress", "completed"].includes(status)) {
      return res.status(400).json({ error: "Invalid step status" });
    }

    const procedure = await ProcedureSession.findById(req.params.id);
    if (!procedure) return res.status(404).json({ error: "Procedure not found" });

    const step = procedure.steps.id(req.params.stepId);
    if (!step) return res.status(404).json({ error: "Step not found" });

    step.status = status;
    if (status === "in-progress" && !step.startTime) step.startTime = new Date();
    if (status === "completed" && !step.endTime) step.endTime = new Date();

    await procedure.save();
    req.app.get("io")?.emit("procedureUpdated", { procedureId: req.params.id });
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
    const procedure = await ProcedureSession.findById(req.params.id);
    if (!procedure) return res.status(404).json({ error: "Procedure not found" });

    procedure.vitals.push({ heartRate, bloodPressure, temperature });
    await procedure.save();

    req.app.get("io")?.emit("vitalsUpdated", { procedureId: req.params.id });
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
    const procedure = await ProcedureSession.findById(req.params.id);
    if (!procedure) return res.status(404).json({ error: "Procedure not found" });

    procedure.status = "completed";
    procedure.endTime = new Date();
    await procedure.save();

    req.app.get("io")?.emit("procedureCompleted", { procedureId: req.params.id });
    res.json(procedure);
  } catch (err) {
    console.error("❌ Complete procedure error:", err);
    res.status(500).json({ error: "Failed to complete procedure", message: err.message });
  }
});

module.exports = router;

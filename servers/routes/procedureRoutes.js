const express = require("express");
const router = express.Router();
const TherapySession = require("../models/TherapySession");

// GET all therapy sessions
router.get("/", async (req, res) => {
  try {
    const sessions = await TherapySession.find()
      .populate("patientId", "name")
      .populate("therapistId", "name")
      .populate("roomId", "name")
      .sort({ createdAt: -1 });
    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch therapy sessions" });
  }
});

// GET single session by ID
router.get("/", async (req, res) => {
  try {
    const session = await TherapySession.findById(req.params.id)
      .populate("patientId", "name")
      .populate("therapistId", "name")
      .populate("roomId", "name");
    if (!session) return res.status(404).json({ error: "Session not found" });
    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch session" });
  }
});

// CREATE new session
router.post("/", async (req, res) => {
  try {
    const session = new TherapySession(req.body);
    await session.save();
    res.status(201).json(session);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to create session" });
  }
});

// UPDATE step status
router.put("/:id/step", async (req, res) => {
  const { stepIndex, status } = req.body;
  try {
    const session = await TherapySession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });

    session.steps[stepIndex].status = status;
    if (status === "in-progress") session.status = "ongoing";
    if (status === "completed" && session.steps.every(s => s.status === "completed")) {
      session.status = "completed";
    }

    await session.save();
    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update step" });
  }
});

// ADD vitals
router.post("/:id/vitals", async (req, res) => {
  const { heartRate, bloodPressure, temperature } = req.body;
  try {
    const session = await TherapySession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });

    if (!session.vitals) session.vitals = [];
    session.vitals.push({ heartRate, bloodPressure, temperature, recordedAt: new Date() });
    await session.save();
    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add vitals" });
  }
});

// MARK session complete
router.put("/:id/complete", async (req, res) => {
  try {
    const session = await TherapySession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });

    session.status = "completed";
    session.endTime = new Date();
    await session.save();
    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to complete session" });
  }
});

module.exports = router;

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
      .sort({ startTime: -1 });
    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch therapy sessions" });
  }
});

// CREATE new therapy session
router.post("/", async (req, res) => {
  try {
    const session = new TherapySession(req.body);
    await session.save();
    res.status(201).json(session);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to create therapy session" });
  }
});

// GET single session
router.get("/:id", async (req, res) => {
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

// UPDATE session status (optional)
router.put("/:id/status", async (req, res) => {
  try {
    const session = await TherapySession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });
    session.status = req.body.status;
    await session.save();
    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update session status" });
  }
});

module.exports = router;

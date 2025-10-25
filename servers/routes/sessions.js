const express = require("express");
const router = express.Router();
const TherapySession = require("../models/TherapySession");
const verifyAdminToken = require("../middleware/verifyAdminToken");
const verifyRole = require("../middleware/verifyRole");

// ---------------- GET ALL SESSIONS ----------------
router.get("/", verifyAdminToken, verifyRole("admin", "therapist"), async (req, res) => {
  try {
    const filter = req.user.role === "therapist" ? { therapistId: req.user.id } : {};
    const sessions = await TherapySession.find(filter)
      .populate("patientId", "name")
      .populate("therapistId", "name")
      .populate("roomId", "name");
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- CREATE SESSION ----------------
router.post("/", verifyAdminToken, verifyRole("admin", "therapist"), async (req, res) => {
  try {
    const { patientId, therapistId: bodyTherapistId, roomId, therapyType, startTime, endTime, notes } = req.body;

    if (!patientId || !roomId || !therapyType || !startTime || !endTime) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Therapist can only assign self
    const therapistId = req.user.role === "therapist" ? req.user.id : bodyTherapistId;
    if (!therapistId) return res.status(400).json({ error: "therapistId is required" });

    // ---------------- Check for conflicts ----------------
    const conflict = await TherapySession.findOne({
      $or: [
        { therapistId, startTime: { $lt: new Date(endTime) }, endTime: { $gt: new Date(startTime) } },
        { roomId, startTime: { $lt: new Date(endTime) }, endTime: { $gt: new Date(startTime) } },
      ],
    });
    if (conflict) return res.status(400).json({ error: "Therapist or room is already booked in this time slot." });

    // ---------------- Create session ----------------
    const session = await TherapySession.create({
      patientId, therapistId, roomId, therapyType, startTime, endTime, notes
    });

    // Populate for frontend
    const populatedSession = await TherapySession.findById(session._id)
      .populate("patientId", "name")
      .populate("therapistId", "name")
      .populate("roomId", "name");

    // ---------------- Real-time emit ----------------
    const io = req.app.get("io");
    io.emit("sessionCreated", populatedSession);

    res.status(201).json({ message: "Session scheduled successfully", session: populatedSession });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- UPDATE SESSION ----------------
router.put("/:id", verifyAdminToken, verifyRole("admin"), async (req, res) => {
  try {
    const updatedSession = await TherapySession.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate("patientId", "name")
      .populate("therapistId", "name")
      .populate("roomId", "name");

    const io = req.app.get("io");
    io.emit("sessionUpdated", updatedSession);

    res.json({ message: "Session updated", session: updatedSession });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- UPDATE SESSION STATUS ----------------
router.put("/:id/status", verifyAdminToken, verifyRole("admin", "therapist"), async (req, res) => {
  try {
    const { status } = req.body;
    if (!["scheduled", "ongoing", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const updatedSession = await TherapySession.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: Date.now() },
      { new: true }
    )
      .populate("patientId", "name")
      .populate("therapistId", "name")
      .populate("roomId", "name");

    const io = req.app.get("io");
    io.emit("sessionUpdated", updatedSession);

    res.json({ message: "Session status updated", session: updatedSession });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- DELETE SESSION ----------------
router.delete("/:id", verifyAdminToken, verifyRole("admin"), async (req, res) => {
  try {
    await TherapySession.findByIdAndDelete(req.params.id);
    const io = req.app.get("io");
    io.emit("sessionDeleted", req.params.id);
    res.json({ message: "Session deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

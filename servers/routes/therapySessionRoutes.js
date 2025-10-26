const express = require("express");
const router = express.Router();
const TherapySession = require("../models/TherapySession");

// --------------------------------------
// 🔹 GET all therapy sessions
// --------------------------------------
router.get("/", async (req, res) => {
  try {
    const sessions = await TherapySession.find()
      .populate("patientId", "name email phone") // ✅ Enhanced population
      .populate("therapistId", "name email")
      .populate("roomId", "name location")
      .sort({ startTime: -1 });
    
    console.log("📋 Fetched therapy sessions:", sessions.length);
    // ✅ Debug: Log first session to check population
    if (sessions.length > 0) {
      console.log("Sample session:", JSON.stringify(sessions[0], null, 2));
    }
    
    res.json(sessions);
  } catch (err) {
    console.error("❌ Fetch therapy sessions error:", err);
    res.status(500).json({ error: "Failed to fetch therapy sessions", message: err.message });
  }
});

// --------------------------------------
// 🔹 CREATE new therapy session
// --------------------------------------
router.post("/", async (req, res) => {
  try {
    const { patientId, therapistId, roomId, therapyType, startTime, endTime, notes } = req.body;
    
    // ✅ Validation
    if (!patientId || !therapistId || !therapyType || !startTime || !endTime) {
      return res.status(400).json({ 
        error: "patientId, therapistId, therapyType, startTime, and endTime are required" 
      });
    }

    const session = new TherapySession({
      patientId,
      therapistId,
      roomId,
      therapyType,
      startTime,
      endTime,
      notes,
      status: "scheduled" // ✅ Default status
    });

    await session.save();
    
    // ✅ Populate before returning
    await session.populate("patientId", "name email phone");
    await session.populate("therapistId", "name email");
    if (roomId) await session.populate("roomId", "name location");
    
    console.log("✅ Created therapy session:", session._id);
    
    // ✅ Emit socket event if available
    req.app.get("io")?.emit("therapySessionCreated", session);
    
    res.status(201).json(session);
  } catch (err) {
    console.error("❌ Create therapy session error:", err);
    res.status(400).json({ error: "Failed to create therapy session", message: err.message });
  }
});

// --------------------------------------
// 🔹 GET single session
// --------------------------------------
router.get("/:id", async (req, res) => {
  try {
    const session = await TherapySession.findById(req.params.id)
      .populate("patientId", "name email phone")
      .populate("therapistId", "name email")
      .populate("roomId", "name location");
      
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    
    console.log("📋 Fetched single session:", session._id);
    res.json(session);
  } catch (err) {
    console.error("❌ Fetch single session error:", err);
    res.status(500).json({ error: "Failed to fetch session", message: err.message });
  }
});

// --------------------------------------
// 🔹 UPDATE session
// --------------------------------------
router.put("/:id", async (req, res) => {
  try {
    const session = await TherapySession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // ✅ Update allowed fields
    const { therapyType, startTime, endTime, notes, status, roomId } = req.body;
    
    if (therapyType) session.therapyType = therapyType;
    if (startTime) session.startTime = startTime;
    if (endTime) session.endTime = endTime;
    if (notes !== undefined) session.notes = notes;
    if (status) session.status = status;
    if (roomId !== undefined) session.roomId = roomId;

    await session.save();
    
    // ✅ Populate before returning
    await session.populate("patientId", "name email phone");
    await session.populate("therapistId", "name email");
    if (session.roomId) await session.populate("roomId", "name location");
    
    console.log("✅ Updated session:", session._id);
    req.app.get("io")?.emit("therapySessionUpdated", session);
    
    res.json(session);
  } catch (err) {
    console.error("❌ Update session error:", err);
    res.status(500).json({ error: "Failed to update session", message: err.message });
  }
});

// --------------------------------------
// 🔹 UPDATE session status (specific route)
// --------------------------------------
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!["scheduled", "ongoing", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const session = await TherapySession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    session.status = status;
    await session.save();
    
    // ✅ Populate before returning
    await session.populate("patientId", "name email phone");
    await session.populate("therapistId", "name email");
    if (session.roomId) await session.populate("roomId", "name location");
    
    console.log("✅ Updated session status:", session._id, "to", status);
    req.app.get("io")?.emit("therapySessionUpdated", session);
    
    res.json(session);
  } catch (err) {
    console.error("❌ Update session status error:", err);
    res.status(500).json({ error: "Failed to update session status", message: err.message });
  }
});

// --------------------------------------
// 🔹 DELETE session
// --------------------------------------
router.delete("/:id", async (req, res) => {
  try {
    const session = await TherapySession.findByIdAndDelete(req.params.id);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    
    console.log("✅ Deleted session:", req.params.id);
    req.app.get("io")?.emit("therapySessionDeleted", { id: req.params.id });
    
    res.json({ message: "Session deleted successfully" });
  } catch (err) {
    console.error("❌ Delete session error:", err);
    res.status(500).json({ error: "Failed to delete session", message: err.message });
  }
});

module.exports = router;
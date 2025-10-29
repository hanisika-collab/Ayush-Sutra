// servers/routes/therapySessionRoutes.js - UPDATED VERSION
const express = require("express");
const router = express.Router();
const TherapySession = require("../models/TherapySession");
const Notification = require("../models/Notification");
const { sendEmail } = require("../services/emailService");

// --------------------------------------
// 🔹 GET all therapy sessions (WITH FILTERS)
// --------------------------------------
router.get("/", async (req, res) => {
  try {
    const { patientId, therapistId, status, startDate, endDate } = req.query;
    
    // Build query filter
    const filter = {};
    
    if (patientId) filter.patientId = patientId;
    if (therapistId) filter.therapistId = therapistId;
    if (status) filter.status = status;
    
    if (startDate || endDate) {
      filter.startTime = {};
      if (startDate) filter.startTime.$gte = new Date(startDate);
      if (endDate) filter.startTime.$lte = new Date(endDate);
    }
    
    console.log("📋 Fetching therapy sessions with filter:", filter);
    
    const sessions = await TherapySession.find(filter)
      .populate("patientId", "name email phone")
      .populate("therapistId", "name email")
      .populate("roomId", "name location")
      .sort({ startTime: -1 });
    
    console.log(`✅ Found ${sessions.length} therapy sessions`);
    
    res.json(sessions);
  } catch (err) {
    console.error("❌ Fetch therapy sessions error:", err);
    res.status(500).json({ error: "Failed to fetch therapy sessions", message: err.message });
  }
});

// --------------------------------------
// 🔹 CREATE new therapy session (WITH NOTIFICATION)
// --------------------------------------
router.post("/", async (req, res) => {
  try {
    const { patientId, therapistId, roomId, therapyType, startTime, endTime, notes } = req.body;
    
    console.log("\n📝 Creating therapy session:", { patientId, therapistId, therapyType });
    
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
      status: "scheduled"
    });

    await session.save();
    
    // ✅ Populate before returning
    await session.populate("patientId", "name email phone");
    await session.populate("therapistId", "name email");
    if (roomId) await session.populate("roomId", "name location");
    
    console.log("✅ Created therapy session:", session._id);
    
    // ✅ AUTO-CREATE PRE-THERAPY NOTIFICATION
    try {
      const patient = session.patientId;
      
      if (patient && patient.email) {
        const scheduledFor = new Date(session.startTime.getTime() - 24 * 60 * 60 * 1000); // 24 hours before
        
        const notification = new Notification({
          userId: patient._id,
          type: 'pre-therapy',
          title: `Upcoming: ${session.therapyType} Session`,
          message: `Your ${session.therapyType} session is scheduled for ${new Date(session.startTime).toLocaleString()}`,
          channel: 'email',
          scheduledFor: scheduledFor,
          relatedSession: session._id,
          metadata: {
            therapyType: session.therapyType,
            therapistName: session.therapistId?.name || 'TBA',
            sessionTime: new Date(session.startTime).toLocaleString(),
            roomName: session.roomId?.name || 'TBA'
          }
        });
        
        await notification.save();
        console.log("✅ Auto-created pre-therapy notification");
        
        // Send email if scheduled time has passed
        if (scheduledFor <= new Date()) {
          setImmediate(async () => {
            try {
              const emailResult = await sendEmail(
                patient.email,
                'pre-therapy',
                {
                  patientName: patient.name,
                  therapyType: session.therapyType,
                  sessionTime: new Date(session.startTime).toLocaleString(),
                  therapistName: session.therapistId?.name || 'TBA',
                  roomName: session.roomId?.name || 'TBA'
                }
              );
              
              notification.status = emailResult.success ? 'sent' : 'failed';
              notification.sentAt = new Date();
              notification.metadata.emailSent = emailResult.success;
              notification.metadata.emailError = emailResult.error;
              await notification.save();
              
              console.log(`${emailResult.success ? '✅' : '⚠️'} Email processed`);
            } catch (emailErr) {
              console.error(`❌ Background email error:`, emailErr);
            }
          });
        }
      }
    } catch (notifErr) {
      console.warn("⚠️ Failed to create notification:", notifErr);
      // Don't fail the session creation if notification fails
    }
    
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
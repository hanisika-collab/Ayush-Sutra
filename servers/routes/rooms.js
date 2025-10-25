const express = require("express");
const router = express.Router();
const Room = require("../models/Room");

// =====================
// CRUD for Rooms
// =====================

// GET all rooms
router.get("/", async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET a single room
router.get("/:id", async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ error: "Room not found" });
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// CREATE a new room
router.post("/", async (req, res) => {
  try {
    const newRoom = new Room(req.body);
    await newRoom.save();
    res.status(201).json(newRoom);
  } catch (err) {
    res.status(400).json({ error: "Invalid data", details: err.message });
  }
});

// UPDATE a room (basic fields + slots + resources)
router.put("/:id", async (req, res) => {
  try {
    const updatedRoom = await Room.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedRoom) return res.status(404).json({ error: "Room not found" });
    res.json(updatedRoom);
  } catch (err) {
    res.status(400).json({ error: "Invalid data", details: err.message });
  }
});

// DELETE a room
router.delete("/:id", async (req, res) => {
  try {
    const deletedRoom = await Room.findByIdAndDelete(req.params.id);
    if (!deletedRoom) return res.status(404).json({ error: "Room not found" });
    res.json({ message: "Room deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// =====================
// Nested Routes for Slots
// =====================

// ADD a slot
router.post("/:id/slots", async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ error: "Room not found" });

    room.slots.push(req.body);
    await room.save();
    res.status(201).json(room);
  } catch (err) {
    res.status(400).json({ error: "Invalid data", details: err.message });
  }
});

// UPDATE a slot by slot index
router.put("/:id/slots/:slotIndex", async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ error: "Room not found" });

    const index = parseInt(req.params.slotIndex, 10);
    if (!room.slots[index]) return res.status(404).json({ error: "Slot not found" });

    room.slots[index] = { ...room.slots[index].toObject(), ...req.body };
    await room.save();
    res.json(room);
  } catch (err) {
    res.status(400).json({ error: "Invalid data", details: err.message });
  }
});

// DELETE a slot by slot index
router.delete("/:id/slots/:slotIndex", async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ error: "Room not found" });

    const index = parseInt(req.params.slotIndex, 10);
    if (!room.slots[index]) return res.status(404).json({ error: "Slot not found" });

    room.slots.splice(index, 1);
    await room.save();
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

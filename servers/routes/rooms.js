const express = require("express");
const router = express.Router();
const Room = require("../models/Room");

// =====================
// CRUD for Rooms
// =====================

// GET all rooms
router.get("/", async (req, res) => {
  try {
    console.log("\n🏠 Fetching all rooms...");
    const rooms = await Room.find().sort({ createdAt: -1 });
    console.log(`✅ Found ${rooms.length} rooms`);
    
    // Log sample for debugging
    if (rooms.length > 0) {
      console.log("Sample room:", {
        id: rooms[0]._id,
        name: rooms[0].name,
        type: rooms[0].type,
        capacity: rooms[0].capacity,
        available: rooms[0].available
      });
    }
    
    res.json(rooms);
  } catch (err) {
    console.error("❌ Fetch rooms error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// GET a single room
router.get("/:id", async (req, res) => {
  try {
    console.log(`\n🏠 Fetching room: ${req.params.id}`);
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      console.log("❌ Room not found");
      return res.status(404).json({ error: "Room not found" });
    }
    
    console.log("✅ Room found:", room.name);
    res.json(room);
  } catch (err) {
    console.error("❌ Fetch room error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// CREATE a new room
router.post("/", async (req, res) => {
  try {
    console.log("\n🏠 Creating new room...");
    console.log("Request body:", req.body);
    
    const { name, type, location, capacity, available, slots, resources } = req.body;
    
    // Validation
    if (!name || !type) {
      console.log("❌ Missing required fields");
      return res.status(400).json({ error: "Name and type are required" });
    }
    
    const newRoom = new Room({
      name,
      type,
      location,
      capacity: capacity || 1,
      available: available !== undefined ? available : true,
      slots: slots || [],
      resources: resources || [],
      active: true
    });
    
    await newRoom.save();
    console.log("✅ Room created successfully:", newRoom._id);
    
    res.status(201).json(newRoom);
  } catch (err) {
    console.error("❌ Create room error:", err);
    res.status(400).json({ error: "Invalid data", details: err.message });
  }
});

// UPDATE a room (all fields + slots + resources)
router.put("/:id", async (req, res) => {
  try {
    console.log(`\n🏠 Updating room: ${req.params.id}`);
    console.log("Update data:", req.body);
    
    const { name, type, location, capacity, available, slots, resources, active } = req.body;
    
    // Find the room first
    const room = await Room.findById(req.params.id);
    if (!room) {
      console.log("❌ Room not found");
      return res.status(404).json({ error: "Room not found" });
    }
    
    // Update fields
    if (name !== undefined) room.name = name;
    if (type !== undefined) room.type = type;
    if (location !== undefined) room.location = location;
    if (capacity !== undefined) room.capacity = capacity;
    if (available !== undefined) room.available = available;
    if (slots !== undefined) room.slots = slots;
    if (resources !== undefined) room.resources = resources;
    if (active !== undefined) room.active = active;
    
    await room.save();
    console.log("✅ Room updated successfully");
    
    res.json(room);
  } catch (err) {
    console.error("❌ Update room error:", err);
    res.status(400).json({ error: "Invalid data", details: err.message });
  }
});

// DELETE a room
router.delete("/:id", async (req, res) => {
  try {
    console.log(`\n🗑️ Deleting room: ${req.params.id}`);
    
    const deletedRoom = await Room.findByIdAndDelete(req.params.id);
    
    if (!deletedRoom) {
      console.log("❌ Room not found");
      return res.status(404).json({ error: "Room not found" });
    }
    
    console.log("✅ Room deleted successfully:", deletedRoom.name);
    res.json({ message: "Room deleted successfully", room: deletedRoom });
  } catch (err) {
    console.error("❌ Delete room error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// =====================
// Nested Routes for Slots
// =====================

// ADD a slot
router.post("/:id/slots", async (req, res) => {
  try {
    console.log(`\n⏰ Adding slot to room: ${req.params.id}`);
    
    const room = await Room.findById(req.params.id);
    if (!room) {
      console.log("❌ Room not found");
      return res.status(404).json({ error: "Room not found" });
    }

    const { dayOfWeek, startTime, endTime, maxConcurrent } = req.body;
    
    if (dayOfWeek === undefined || !startTime || !endTime) {
      return res.status(400).json({ error: "dayOfWeek, startTime, and endTime are required" });
    }

    room.slots.push({ dayOfWeek, startTime, endTime, maxConcurrent: maxConcurrent || 1 });
    await room.save();
    
    console.log("✅ Slot added successfully");
    res.status(201).json(room);
  } catch (err) {
    console.error("❌ Add slot error:", err);
    res.status(400).json({ error: "Invalid data", details: err.message });
  }
});

// UPDATE a slot by slot index
router.put("/:id/slots/:slotIndex", async (req, res) => {
  try {
    console.log(`\n⏰ Updating slot ${req.params.slotIndex} in room: ${req.params.id}`);
    
    const room = await Room.findById(req.params.id);
    if (!room) {
      console.log("❌ Room not found");
      return res.status(404).json({ error: "Room not found" });
    }

    const index = parseInt(req.params.slotIndex, 10);
    if (index < 0 || index >= room.slots.length) {
      console.log("❌ Slot not found");
      return res.status(404).json({ error: "Slot not found" });
    }

    // Update the slot
    const { dayOfWeek, startTime, endTime, maxConcurrent } = req.body;
    if (dayOfWeek !== undefined) room.slots[index].dayOfWeek = dayOfWeek;
    if (startTime) room.slots[index].startTime = startTime;
    if (endTime) room.slots[index].endTime = endTime;
    if (maxConcurrent !== undefined) room.slots[index].maxConcurrent = maxConcurrent;
    
    await room.save();
    console.log("✅ Slot updated successfully");
    res.json(room);
  } catch (err) {
    console.error("❌ Update slot error:", err);
    res.status(400).json({ error: "Invalid data", details: err.message });
  }
});

// DELETE a slot by slot index
router.delete("/:id/slots/:slotIndex", async (req, res) => {
  try {
    console.log(`\n🗑️ Deleting slot ${req.params.slotIndex} from room: ${req.params.id}`);
    
    const room = await Room.findById(req.params.id);
    if (!room) {
      console.log("❌ Room not found");
      return res.status(404).json({ error: "Room not found" });
    }

    const index = parseInt(req.params.slotIndex, 10);
    if (index < 0 || index >= room.slots.length) {
      console.log("❌ Slot not found");
      return res.status(404).json({ error: "Slot not found" });
    }

    room.slots.splice(index, 1);
    await room.save();
    
    console.log("✅ Slot deleted successfully");
    res.json(room);
  } catch (err) {
    console.error("❌ Delete slot error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// =====================
// Utility Routes
// =====================

// GET room availability (check if room is free at a given time)
router.get("/:id/availability", async (req, res) => {
  try {
    const { date, startTime, endTime } = req.query;
    
    if (!date || !startTime || !endTime) {
      return res.status(400).json({ error: "date, startTime, and endTime are required" });
    }
    
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }
    
    // Check if room is available
    const isAvailable = room.available && room.active;
    
    // You can add more complex logic here to check against bookings
    // For now, just return basic availability
    
    res.json({
      roomId: room._id,
      roomName: room.name,
      available: isAvailable,
      date,
      startTime,
      endTime
    });
  } catch (err) {
    console.error("❌ Check availability error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// FIX existing rooms - add missing fields
router.post("/fix/all", async (req, res) => {
  try {
    console.log("\n🔧 Fixing all rooms...");
    
    const rooms = await Room.find();
    let fixed = 0;
    
    for (const room of rooms) {
      let needsSave = false;
      
      // Add type if missing
      if (!room.type) {
        room.type = "General";
        needsSave = true;
      }
      
      // Add capacity if missing
      if (!room.capacity) {
        room.capacity = 1;
        needsSave = true;
      }
      
      // Add available if missing
      if (room.available === undefined) {
        room.available = true;
        needsSave = true;
      }
      
      if (needsSave) {
        await room.save();
        fixed++;
        console.log(`✅ Fixed room ${room._id}`);
      }
    }
    
    console.log(`✅ Fixed ${fixed} out of ${rooms.length} rooms`);
    res.json({ 
      message: `Fixed ${fixed} rooms`, 
      total: rooms.length,
      fixed: fixed 
    });
  } catch (err) {
    console.error("❌ Fix rooms error:", err);
    res.status(500).json({ error: "Failed to fix rooms", message: err.message });
  }
});

module.exports = router;
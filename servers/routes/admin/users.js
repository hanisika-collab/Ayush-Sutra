// routes/admin/users.js - FIXED VERSION
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../../models/User");
const auth = require("../../middleware/auth");

// ✅ Apply auth middleware - already applied in parent router
// But we'll add role-specific logic in each route

// -----------------------------
// Get all users (optional ?role=doctor/patient/therapist)
// Admin, doctor, and therapist can access
// -----------------------------
router.get("/", async (req, res) => {
  try {
    // ✅ Check permissions
    if (!['admin', 'doctor', 'therapist'].includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { role } = req.query;
    const filter = role ? { role } : {};
    
    // ✅ Therapists can only see patients
    if (req.user.role === 'therapist' && !role) {
      filter.role = 'patient';
    } else if (req.user.role === 'therapist' && role !== 'patient') {
      return res.status(403).json({ error: "Therapists can only view patients" });
    }

    console.log(`📋 Fetching users with filter:`, filter, `by ${req.user.role}`);
    
    const users = await User.find(filter).select("-passwordHash");
    
    console.log(`✅ Found ${users.length} users`);
    res.json(users);
  } catch (error) {
    console.error("❌ Fetch users error:", error);
    res.status(500).json({ error: error.message });
  }
});

// -----------------------------
// Get current logged-in user info (role-based)
// -----------------------------
router.get("/me", async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-passwordHash");
    if (!user) return res.status(404).json({ error: "User not found" });

    let responseData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    };

    // Add role-specific data if needed
    if (user.role === "doctor") {
      responseData.patients = [];
    }

    if (user.role === "therapist") {
      responseData.therapies = [];
    }

    if (user.role === "patient") {
      responseData.therapies = [];
    }

    console.log(`✅ Fetched user info for: ${user.name} (${user.role})`);
    res.json(responseData);
  } catch (error) {
    console.error("❌ Fetch user info error:", error);
    res.status(500).json({ error: error.message });
  }
});

// -----------------------------
// Create user (doctor / therapist / patient)
// Only admin can create users
// -----------------------------
router.post("/", async (req, res) => {
  try {
    // ✅ Only admin can create users
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Only admin can create users" });
    }

    const { name, email, password, role, phone } = req.body;
    
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "User already exists" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ name, email, passwordHash, role, phone });
    await user.save();
    
    console.log(`✅ Created new ${role}: ${name}`);
    res.json({ message: `${role} created successfully`, user: { ...user.toObject(), passwordHash: undefined } });
  } catch (error) {
    console.error("❌ Create user error:", error);
    res.status(500).json({ error: error.message });
  }
});

// -----------------------------
// Update user
// Admin can update anyone, others can only update themselves
// -----------------------------
router.put("/:id", async (req, res) => {
  try {
    // ✅ Check permissions
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ error: "You can only update your own profile" });
    }

    const updates = req.body;
    delete updates.passwordHash; // Don't allow direct password hash updates
    delete updates.role; // Don't allow role changes unless admin
    
    // ✅ Admin can change roles
    if (req.user.role === 'admin' && req.body.role) {
      updates.role = req.body.role;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select("-passwordHash");
    
    if (!user) return res.status(404).json({ error: "User not found" });
    
    console.log(`✅ Updated user: ${user.name}`);
    res.json({ message: "User updated", user });
  } catch (error) {
    console.error("❌ Update user error:", error);
    res.status(500).json({ error: error.message });
  }
});

// -----------------------------
// Deactivate user
// Only admin can deactivate users
// -----------------------------
router.delete("/:id", async (req, res) => {
  try {
    // ✅ Only admin can deactivate users
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: "Only admin can deactivate users" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id, 
      { active: false }, 
      { new: true }
    ).select("-passwordHash");
    
    if (!user) return res.status(404).json({ error: "User not found" });
    
    console.log(`✅ Deactivated user: ${user.name}`);
    res.json({ message: "User deactivated", user });
  } catch (error) {
    console.error("❌ Deactivate user error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
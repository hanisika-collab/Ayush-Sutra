const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../../models/User");
const verifyAdminToken = require("../../middleware/verifyAdminToken");


// -----------------------------
// Get all users (optional ?role=doctor/patient/therapist)
// Only admin can access
// -----------------------------
router.get("/", verifyAdminToken, async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter).select("-passwordHash");
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -----------------------------
// Get current logged-in user info (role-based)
// -----------------------------
router.get("/me", verifyAdminToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash");
    if (!user) return res.status(404).json({ error: "User not found" });

    // For doctors/therapists, you can add custom data like assigned patients/therapies
    let responseData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    };

    if (user.role === "doctor") {
      // Example: doctor assigned patients (implement your logic)
      responseData.patients = []; // fill with actual patient list if available
    }

    if (user.role === "therapist") {
      // Example: therapist assigned therapies
      responseData.therapies = []; // fill with actual therapy list if available
    }

    if (user.role === "patient") {
      // Example: patient therapies
      responseData.therapies = []; // fill with actual therapy list if available
    }

    res.json(responseData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -----------------------------
// Create user (doctor / therapist / patient)
// Only admin can access
// -----------------------------
router.post("/", verifyAdminToken, async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "User already exists" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ name, email, passwordHash, role, phone });
    await user.save();
    res.json({ message: `${role} created successfully`, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -----------------------------
// Update user
// Only admin can access
// -----------------------------
router.put("/:id", verifyAdminToken, async (req, res) => {
  try {
    const updates = req.body;
    delete updates.passwordHash;
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json({ message: "User updated", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -----------------------------
// Deactivate user
// Only admin can access
// -----------------------------
router.delete("/:id", verifyAdminToken, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    res.json({ message: "User deactivated", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

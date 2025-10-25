const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const verifyAdminToken = require("../../middleware/verifyAdminToken");

// GET: All therapists
router.get("/", verifyAdminToken, async (req, res) => {
  try {
    const therapists = await User.find({ role: "therapist" }).select("-passwordHash");
    res.json(therapists);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch therapists" });
  }
});

// DELETE: Deactivate therapist
router.delete("/:id", verifyAdminToken, async (req, res) => {
  try {
    const therapist = await User.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    );
    if (!therapist) return res.status(404).json({ error: "Therapist not found" });
    res.json({ message: "Therapist deactivated", therapist });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to deactivate therapist" });
  }
});

module.exports = router;

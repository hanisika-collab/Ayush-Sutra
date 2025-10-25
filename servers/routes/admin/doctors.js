const express = require("express");
const router = express.Router();
const User = require("../../models/User");
const verifyAdminToken = require("../../middleware/verifyAdminToken");

// GET: All doctors
router.get("/", verifyAdminToken, async (req, res) => {
  try {
    const doctors = await User.find({ role: "doctor" }).select("-passwordHash");
    res.json(doctors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch doctors" });
  }
});

// DELETE: Deactivate doctor
router.delete("/:id", verifyAdminToken, async (req, res) => {
  try {
    const doctor = await User.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    );
    if (!doctor) return res.status(404).json({ error: "Doctor not found" });
    res.json({ message: "Doctor deactivated", doctor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to deactivate doctor" });
  }
});

module.exports = router;

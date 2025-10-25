// middleware/verifyAdminToken.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const verifyAdminToken = async (req, res, next) => {
  try {
    const authHeader = req.headers?.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: Token missing" });
    }

    // ✅ Verify and decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Find the user in the database
    const user = await User.findById(decoded.id || decoded.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // ✅ Attach user to request
    req.user = user;

    // ✅ Restrict to admin only
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admins only" });
    }

    next();
  } catch (err) {
    console.error("Token verification error:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

module.exports = verifyAdminToken;

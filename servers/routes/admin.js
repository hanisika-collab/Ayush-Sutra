// routes/admin.js - FIXED VERSION
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const verifyRole = require('../middleware/verifyRole');

// ✅ Apply auth middleware to all admin routes
router.use(auth);

// ✅ Apply role verification - allow admin, doctor, and therapist
// This is more flexible than requireRole(['admin'])
router.use(verifyRole('admin', 'doctor', 'therapist'));

// Subroutes
router.use('/users', require('./admin/users'));
router.use('/rooms', require('./rooms')); // ✅ UNCOMMENTED
// router.use('/sessions', require('./admin/sessions'));
// router.use('/reports', require('./admin/reports'));

router.get('/', (req, res) => {
  res.json({ 
    message: '✅ Admin API working',
    user: req.user.name,
    role: req.user.role 
  });
});

module.exports = router;
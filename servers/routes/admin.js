// routes/admin.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

router.use(auth);
router.use(requireRole(['admin']));

// Subroutes
router.use('/users', require('./admin/users'));
// router.use('/rooms', require('./rooms'));
// router.use('/sessions', require('./admin/sessions'));
// router.use('/reports', require('./admin/reports'));

router.get('/', (req, res) => {
  res.send('✅ Admin API working');
});

module.exports = router;

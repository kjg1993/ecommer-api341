const express = require('express');
const router = express.Router();

router.use('/products', require('./products'));
router.use('/categories', require('./categories'));

// // Health check
// router.get('/health', (req, res) => {
//   const mongoose = require('mongoose');
//   res.json({
//     status: 'OK',
//     timestamp: new Date().toISOString(),
//     database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
//   });
// });

module.exports = router;


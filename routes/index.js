const express = require('express');
const router = express.Router();
const authRoutes = require('./auth'); 
router.use('/auth', authRoutes);

router.use('/products', require('./products'));
router.use('/categories', require('./categories'));

module.exports = router;
const express = require('express');
const router = express.Router();
const productsController = require('../controllers/products.controller');
const { isAuthenticated } = require('../middleware/auth'); 

// GET is public
router.get('/', productsController.getAllProducts);
router.get('/:id', productsController.getProductById);

// POST, PUT, DELETE are protected (OAuth)
router.post('/', isAuthenticated, productsController.createProduct);
router.put('/:id', isAuthenticated, productsController.updateProduct);
router.delete('/:id', isAuthenticated, productsController.deleteProduct);

module.exports = router;
const express = require('express');
const router = express.Router();

const {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
} = require('../controllers/products.controller');
const { route } = require('.');


//get all records
router.get('/', getAllProducts);

//get by id
router.get('/:id', getProductById);

// create product
router.post('/', createProduct);

//update product
router.put('/:id', updateProduct);

// delete produc
router.delete('/:id', deleteProduct);

module.exports = router;
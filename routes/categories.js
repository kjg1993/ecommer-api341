const express = require('express');
const router = express.Router();

const {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
} = require('../controllers/categories.controller');
const { updateProduct } = require('../controllers/products.controller');

//Get all 
router.get('/', getAllCategories);

//get by id
router.get('/:id', getCategoryById);

//create category
router.post('/', createCategory);

//update category
router.put('/:id', updateCategory);

// delete category 
router.delete('/:id', deleteCategory);


module.exports = router;

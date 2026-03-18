const express = require('express');
const router = express.Router();

const {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
} = require('../controllers/categories.controller');

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

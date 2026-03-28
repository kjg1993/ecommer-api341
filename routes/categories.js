const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

const {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
} = require('../controllers/categories.controller');

// public routes
//Get all 
router.get('/', getAllCategories);
//get by id
router.get('/:id', getCategoryById);

// Protected Routes
router.post('/', isAuthenticated, createCategory);
router.put('/:id', isAuthenticated, updateCategory);
router.delete('/:id', isAuthenticated, deleteCategory);

module.exports = router;

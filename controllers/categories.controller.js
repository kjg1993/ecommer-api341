const mongoose = require('mongoose');
const Category = require('../models/Category')

// GET all categories
const getAllCategories = async (req, res) => {
    try {
        const { isActive, search } = req.query;
        let query = {};

        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const categories = await Category.find(query)
            .populate('parentCategory', 'name')
            .sort({ name: 1 })
            .lean();

        res.status(200).json({
            success: true,
            count: categories.length,
            data: categories
        });

    } catch (error) {
        console.error('Error in getAllCategories:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving categories',
            error: error.message
        });
    }
};

// GET category by ID
const getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id)
            .populate('parentCategory', 'name')
            .lean();

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.status(200).json({
            success: true,
            data: category
        });

    } catch (error) {

        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid category ID format'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error retrieving category',
            error: error.message
        });
    }
};

// CREATE category
const createCategory = async (req, res) => {
    try {
        let { name, description, parentCategory, icon, slug, displayOrder = 0, isActive = true } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Category name is required'
            });
        }

        if (!slug) {
            slug = name
                .toLowerCase()
                .trim()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '');
        }

        const existingCategory = await Category.findOne({
            name: { $regex: new RegExp(`^${name}$`, 'i') }
        });

        if (existingCategory) {
            return res.status(409).json({
                success: false,
                message: 'Category with this name already exists'
            });
        }

        const existingSlug = await Category.findOne({ slug });
        if (existingSlug) {
            return res.status(409).json({
                success: false,
                message: 'Slug already in use'
            });
        }

        if (parentCategory) {
            const parentExists = await Category.exists({ _id: parentCategory });
            if (!parentExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Parent category does not exist'
                });
            }
        }

        const category = await Category.create({
            name,
            description,
            parentCategory: parentCategory || null,
            slug,
            icon,
            displayOrder,
            isActive
        });

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: category
        });

    } catch (error) {
        console.error('Error creating category:', error);
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Duplicate key (name or slug must be unique)'
            });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: Object.values(error.errors).map(e => e.message)
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error creating category',
            error: error.message
        });
    }
};

// UPDATE category
const updateCategory = async (req, res) => {
    try {
        const { name, description, parentCategory, icon, isActive, slug, displayOrder } = req.body;
        const categoryId = req.params.id;


        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category ID format'
            });
        }

        if (parentCategory && parentCategory === categoryId) {
            return res.status(400).json({
                success: false,
                message: 'Category cannot be its own parent'
            });
        }


        if (name) {
            const existingCategory = await Category.findOne({
                name: { $regex: new RegExp(`^${name}$`, 'i') },
                _id: { $ne: categoryId }
            });

            if (existingCategory) {
                return res.status(409).json({
                    success: false,
                    message: 'Category with this name already exists'
                });
            }
        }

        if (parentCategory) {
            const parentExists = await Category.exists({ _id: parentCategory });
            if (!parentExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Parent category does not exist'
                });
            }
        }

        const category = await Category.findByIdAndUpdate(
            categoryId,
            {
                name,
                description,
                parentCategory: parentCategory || null,
                icon,
                isActive,
                slug,
                displayOrder
            },
            { new: true, runValidators: true }
        ).populate('parentCategory', 'name slug');


        res.status(200).json({
            success: true,
            message: 'Category updated successfully',
            data: category
        });

    } catch (error) {
        console.error(`Error updating category: ${error}`);

        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid ID format'
            });
        }

        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(409).json({
                success: false,
                message: `${field} must be unique`
            });
        }

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: Object.values(error.errors).map(e => e.message)
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error updating category',
            error: error.message
        });
    }
};

// DELETE category
const deleteCategory = async (req, res) => {
    try {
        // Verificar si hay productos usando esta categoría
        const Product = require('../models/product');
        const productsUsingCategory = await Product.countDocuments({
            categoryId: req.params.id
        });

        if (productsUsingCategory > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete category. ${productsUsingCategory} product(s) are using this category.`
            });
        }

        const category = await Category.findByIdAndDelete(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Category deleted successfully',
            data: category
        });

    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid category ID format'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error deleting category',
            error: error.message
        });
    }
};

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};
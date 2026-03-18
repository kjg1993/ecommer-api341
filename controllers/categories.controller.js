const Product = require('../models/product');
const Category = require("../models/category");

// GET all categories
const getAllCategories = async (req, res, next) => {
    try {
        const { isActive, search, page = 1, limit = 10 } = req.query;
        let query = {};

        if (isActive !== undefined) {
            query.isActive = isActive === "true";
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [categories, totalCount] = await Promise.all([
            Category.find(query)
                .populate("parentCategory", "name slug")
                .sort({ name: 1 })
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            Category.countDocuments(query),
        ]);

        res.status(200).json({
            success: true,
            count: categories.length,
            total: totalCount,
            page: Number(page),
            pages: Math.ceil(totalCount / Number(limit)),
            data: categories,
        });
    } catch (error) {
        next(error);
    }
};

const getCategoryById = async (req, res, next) => {
    try {
        const categoryId = req.params.id;

        if (!categoryId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: "Invalid category ID format",
            });
        }

        const category = await Category.findById(categoryId)
            .populate("parentCategory", "name slug")
            .lean();

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        res.status(200).json({
            success: true,
            data: category,
        });
    } catch (error) {
        next(error);
    }
};

// CREATE category
const createCategory = async (req, res, next) => {
    try {
        let {
            name,
            description,
            parentCategory,
            slug,
            displayOrder = 0,
            isActive = true,
        } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Category name is required",
            });
        }

        if (name.length < 2 || name.length > 50) {
            return res.status(400).json({
                success: false,
                message: "Name must be between 2 and 50 characters",
            });
        }

        if (!slug) {
            slug = name
                .toLowerCase()
                .trim()
                .replace(/\s+/g, "-")
                .replace(/[^a-z0-9-]/g, "");
        }

        if (!/^[a-z0-9-]+$/.test(slug)) {
            return res.status(400).json({
                success: false,
                message:
                    "Slug must contain only lowercase letters, numbers, and hyphens",
            });
        }
        const existingCategory = await Category.findOne({
            name: { $regex: new RegExp(`^${name}$`, "i") },
        });

        if (existingCategory) {
            return res.status(409).json({
                success: false,
                message: "Category with this name already exists",
            });
        }

        const existingSlug = await Category.findOne({ slug });
        if (existingSlug) {
            return res.status(409).json({
                success: false,
                message: "Slug already in use",
            });
        }

        if (parentCategory) {
            if (!parentCategory.match(/^[0-9a-fA-F]{24}$/)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid parent category ID format",
                });
            }

            const parentExists = await Category.exists({ _id: parentCategory });
            if (!parentExists) {
                return res.status(400).json({
                    success: false,
                    message: "Parent category does not exist",
                });
            }
        }

        if (
            displayOrder !== undefined &&
            (isNaN(displayOrder) || displayOrder < 0)
        ) {
            return res.status(400).json({
                success: false,
                message: "Display order must be a positive number",
            });
        }

        const category = await Category.create({
            name: name.trim(),
            description: description ? description.trim() : undefined,
            parentCategory: parentCategory || null,
            slug,
            displayOrder: Number(displayOrder),
            isActive: isActive !== undefined ? isActive : true,
        });

        res.status(201).json({
            success: true,
            message: "Category created successfully",
            data: category,
        });
    } catch (error) {
        next(error);
    }
};

// UPDATE category
const updateCategory = async (req, res, next) => {
    try {
        const { name, description, parentCategory, isActive, slug, displayOrder } =
            req.body;
        const categoryId = req.params.id;

        if (!categoryId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: "Invalid category ID format",
            });
        }

        if (parentCategory && parentCategory === categoryId) {
            return res.status(400).json({
                success: false,
                message: "Category cannot be its own parent",
            });
        }

        if (name) {
            if (name.length < 2 || name.length > 50) {
                return res.status(400).json({
                    success: false,
                    message: "Name must be between 2 and 50 characters",
                });
            }

            const existingCategory = await Category.findOne({
                name: { $regex: new RegExp(`^${name}$`, "i") },
                _id: { $ne: categoryId },
            });

            if (existingCategory) {
                return res.status(409).json({
                    success: false,
                    message: "Category with this name already exists",
                });
            }
        }

        if (slug) {
            if (!/^[a-z0-9-]+$/.test(slug)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Slug must contain only lowercase letters, numbers, and hyphens",
                });
            }

            const existingSlug = await Category.findOne({
                slug,
                _id: { $ne: categoryId },
            });

            if (existingSlug) {
                return res.status(409).json({
                    success: false,
                    message: "Slug already in use",
                });
            }
        }

        if (parentCategory) {
            if (!parentCategory.match(/^[0-9a-fA-F]{24}$/)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid parent category ID format",
                });
            }

            const parentExists = await Category.exists({ _id: parentCategory });
            if (!parentExists) {
                return res.status(400).json({
                    success: false,
                    message: "Parent category does not exist",
                });
            }
        }

        if (
            displayOrder !== undefined &&
            (isNaN(displayOrder) || displayOrder < 0)
        ) {
            return res.status(400).json({
                success: false,
                message: "Display order must be a positive number",
            });
        }

        const category = await Category.findByIdAndUpdate(
            categoryId,
            {
                name: name ? name.trim() : undefined,
                description: description ? description.trim() : undefined,
                parentCategory: parentCategory || null,
                isActive,
                slug,
                displayOrder:
                    displayOrder !== undefined ? Number(displayOrder) : undefined,
            },
            { new: true, runValidators: true },
        ).populate("parentCategory", "name slug");

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Category updated successfully",
            data: category,
        });
    } catch (error) {
        next(error);
    }
};

// DELETE category
const deleteCategory = async (req, res, next) => {
    try {
        const categoryId = req.params.id;

        if (!categoryId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: "Invalid category ID format",
            });
        }

        
        const productsUsingCategory = await Product.countDocuments({
            category: categoryId, 
        });

        if (productsUsingCategory > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete category. ${productsUsingCategory} product(s) are using this category.`,
            });
        }

        const category = await Category.findByIdAndDelete(categoryId);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Category deleted successfully",
            data: {
                id: category._id,
                name: category.name,
                slug: category.slug,
            },
        });
    } catch (error) {
        console.log(`Error: ${error}`);
        next(error);
    }
};

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
};

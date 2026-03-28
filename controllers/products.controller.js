const Product = require('../models/product');
const Category = require('../models/category');

const getAllProducts = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            order = 'desc',
            category,
            brand,
            condition,
            minPrice,
            maxPrice,
            search,
            inStock
        } = req.query;

        if (page && (isNaN(page) || page < 1)) {
            return res.status(400).json({
                success: false,
                message: 'Page must be a positive number'
            });
        }
        
        if (limit && (isNaN(limit) || limit < 1 || limit > 100)) {
            return res.status(400).json({
                success: false,
                message: 'Limit must be between 1 and 100'
            });
        }

        let query = {};

        if (category) {
            if (!category.match(/^[0-9a-fA-F]{24}$/)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid category ID format'
                });
            }
            query.category = category;
        }

        if (brand) {
            if (typeof brand !== 'string' || brand.length > 50) {
                return res.status(400).json({
                    success: false,
                    message: 'Brand must be a valid string'
                });
            }
            query.brand = brand;
        }

        if (condition) {
            if (!['new', 'refurbished', 'used'].includes(condition)) {
                return res.status(400).json({
                    success: false,
                    message: 'Condition must be new, refurbished, or used'
                });
            }
            query.condition = condition;
        }

        if (minPrice || maxPrice) {
            query.price = {};
            
            if (minPrice) {
                if (isNaN(minPrice) || minPrice < 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'minPrice must be a positive number'
                    });
                }
                query.price.$gte = Number(minPrice);
            }
            
            if (maxPrice) {
                if (isNaN(maxPrice) || maxPrice < 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'maxPrice must be a positive number'
                    });
                }
                query.price.$lte = Number(maxPrice);
            }

            if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
                return res.status(400).json({
                    success: false,
                    message: 'minPrice cannot be greater than maxPrice'
                });
            }
        }

        if (search) {
            if (typeof search !== 'string' || search.length < 2) {
                return res.status(400).json({
                    success: false,
                    message: 'Search term must be at least 2 characters'
                });
            }
            query.$text = { $search: search };
        }

        if (inStock !== undefined) {
            if (inStock !== 'true' && inStock !== 'false') {
                return res.status(400).json({
                    success: false,
                    message: 'inStock must be true or false'
                });
            }
            if (inStock === 'true') {
                query.stock = { $gt: 0 };
            }
        }

        const allowedSortFields = ['price', 'name', 'createdAt', 'stock', 'brand'];
        if (sortBy && !allowedSortFields.includes(sortBy)) {
            return res.status(400).json({
                success: false,
                message: `sortBy must be one of: ${allowedSortFields.join(', ')}`
            });
        }

        if (order && !['asc', 'desc'].includes(order)) {
            return res.status(400).json({
                success: false,
                message: 'order must be asc or desc'
            });
        }

        const sortOrder = order === 'asc' ? 1 : -1;
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder;

        const skip = (Number(page) - 1) * Number(limit);

        const [products, totalCount] = await Promise.all([
            Product.find(query)
                .populate('category', 'name slug')
                .sort(sortOptions)
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            Product.countDocuments(query)
        ]);

       res.status(200).json(products);

    } catch (error) {
        next(error);
    }
};

// GET PRODUCT BY ID
const getProductById = async (req, res, next) => {
    try {
        const productId = req.params.id;

        if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID format'
            });
        }

        const product = await Product.findById(productId)
            .populate('category', 'name slug')
            .lean();

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.status(200).json({
            success: true,
            data: product
        });

    } catch (error) {
        next(error);
    }
};

// CREATE PRODUCT (con validación completa)

const createProduct = async (req, res, next) => {
    try {
        const {
            name,
            sku,
            description,
            price,
            category,
            stock,
            brand,
            condition,
            weight,
            dimensions,
            isActive,
            tags = []
        } = req.body;
        const requiredFields = ['name', 'sku', 'description', 'price', 'category', 'brand', 'condition', 'weight'];
        const missingFields = requiredFields.filter(field => req.body[field] == null);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        if (typeof name !== 'string' || name.length < 3 || name.length > 100) {
            return res.status(400).json({
                success: false,
                message: 'Name must be a string between 3 and 100 characters'
            });
        }

        if (typeof sku !== 'string' || !/^[A-Za-z0-9-]+$/.test(sku)) {
            return res.status(400).json({
                success: false,
                message: 'SKU must contain only letters, numbers, and hyphens'
            });
        }
        if (typeof description !== 'string' || description.length < 10 || description.length > 2000) {
            return res.status(400).json({
                success: false,
                message: 'Description must be between 10 and 2000 characters'
            });
        }

        if (isNaN(price) || price < 0 || price > 100000) {
            return res.status(400).json({
                success: false,
                message: 'Price must be a number between 0 and 100000'
            });
        }

        if (!category.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category ID format'
            });
        }

        if (stock !== undefined) {
            if (!Number.isInteger(Number(stock)) || Number(stock) < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Stock must be a positive integer'
                });
            }
        }

        if (typeof brand !== 'string' || brand.length > 50) {
            return res.status(400).json({
                success: false,
                message: 'Brand must be a string with max 50 characters'
            });
        }

        if (!['new', 'refurbished', 'used'].includes(condition)) {
            return res.status(400).json({
                success: false,
                message: 'Condition must be new, refurbished, or used'
            });
        }

        if (isNaN(weight) || weight < 0 || weight > 1000) {
            return res.status(400).json({
                success: false,
                message: 'Weight must be a number between 0 and 1000'
            });
        }

        if (dimensions) {
            const { length, width, height, unit } = dimensions;
            
            if (length !== undefined && (isNaN(length) || length < 0)) {
                return res.status(400).json({
                    success: false,
                    message: 'Length must be a positive number'
                });
            }
            
            if (width !== undefined && (isNaN(width) || width < 0)) {
                return res.status(400).json({
                    success: false,
                    message: 'Width must be a positive number'
                });
            }
            
            if (height !== undefined && (isNaN(height) || height < 0)) {
                return res.status(400).json({
                    success: false,
                    message: 'Height must be a positive number'
                });
            }
            
            if (unit && !['cm', 'in', 'm'].includes(unit)) {
                return res.status(400).json({
                    success: false,
                    message: 'Unit must be cm, in, or m'
                });
            }
        }

        if (tags && !Array.isArray(tags)) {
            return res.status(400).json({
                success: false,
                message: 'Tags must be an array'
            });
        }

        if (tags && tags.some(tag => typeof tag !== 'string' || tag.length > 30)) {
            return res.status(400).json({
                success: false,
                message: 'Each tag must be a string with max 30 characters'
            });
        }

        const categoryExists = await Category.exists({ _id: category });
        if (!categoryExists) {
            return res.status(400).json({
                success: false,
                message: 'Category does not exist'
            });
        }

        const skuUpper = sku.toUpperCase();
        const existingSku = await Product.findOne({ sku: skuUpper });
        if (existingSku) {
            return res.status(409).json({
                success: false,
                message: 'Product with this SKU already exists',
                details: {
                    field: 'sku',
                    value: skuUpper
                }
            });
        }

        const productData = {
            name: name.trim(),
            sku: skuUpper,
            description: description.trim(),
            price: Number(price),
            category,
            stock: stock !== undefined ? Number(stock) : 0,
            brand: brand.trim(),
            condition,
            weight: Number(weight),
            dimensions: dimensions || {
                length: 0,
                width: 0,
                height: 0,
                unit: 'cm'
            },
            isActive: isActive !== undefined ? isActive : true,
            tags: tags || []
        };

        const product = await Product.create(productData);

        const populatedProduct = await Product.findById(product._id)
            .populate('category', 'name slug')
            .lean();

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: populatedProduct
        });

    } catch (error) {
        next(error);
    }
};


const updateProduct = async (req, res, next) => {
    try {
        const updateData = { ...req.body };
        const productId = req.params.id;

        if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID format'
            });
        }

        if (updateData.name !== undefined) {
            if (typeof updateData.name !== 'string' || updateData.name.length < 3 || updateData.name.length > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Name must be a string between 3 and 100 characters'
                });
            }
            updateData.name = updateData.name.trim();
        }

        if (updateData.sku !== undefined) {
            if (typeof updateData.sku !== 'string' || !/^[A-Za-z0-9-]+$/.test(updateData.sku)) {
                return res.status(400).json({
                    success: false,
                    message: 'SKU must contain only letters, numbers, and hyphens'
                });
            }
            updateData.sku = updateData.sku.toUpperCase();

            const existingSku = await Product.findOne({
                sku: updateData.sku,
                _id: { $ne: productId }
            });
            if (existingSku) {
                return res.status(409).json({
                    success: false,
                    message: 'Another product with this SKU already exists'
                });
            }
        }

        if (updateData.description !== undefined) {
            if (typeof updateData.description !== 'string' || updateData.description.length < 10 || updateData.description.length > 2000) {
                return res.status(400).json({
                    success: false,
                    message: 'Description must be between 10 and 2000 characters'
                });
            }
            updateData.description = updateData.description.trim();
        }

        if (updateData.price !== undefined) {
            if (isNaN(updateData.price) || updateData.price < 0 || updateData.price > 100000) {
                return res.status(400).json({
                    success: false,
                    message: 'Price must be a number between 0 and 100000'
                });
            }
            updateData.price = Number(updateData.price);
        }

        if (updateData.category !== undefined) {
            if (!updateData.category.match(/^[0-9a-fA-F]{24}$/)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid category ID format'
                });
            }

            const categoryExists = await Category.exists({ _id: updateData.category });
            if (!categoryExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Category does not exist'
                });
            }
        }

        if (updateData.stock !== undefined) {
            if (!Number.isInteger(Number(updateData.stock)) || Number(updateData.stock) < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Stock must be a positive integer'
                });
            }
            updateData.stock = Number(updateData.stock);
        }

        if (updateData.brand !== undefined) {
            if (typeof updateData.brand !== 'string' || updateData.brand.length > 50) {
                return res.status(400).json({
                    success: false,
                    message: 'Brand must be a string with max 50 characters'
                });
            }
            updateData.brand = updateData.brand.trim();
        }

        if (updateData.condition !== undefined) {
            if (!['new', 'refurbished', 'used'].includes(updateData.condition)) {
                return res.status(400).json({
                    success: false,
                    message: 'Condition must be new, refurbished, or used'
                });
            }
        }

        if (updateData.weight !== undefined) {
            if (isNaN(updateData.weight) || updateData.weight < 0 || updateData.weight > 1000) {
                return res.status(400).json({
                    success: false,
                    message: 'Weight must be a number between 0 and 1000'
                });
            }
            updateData.weight = Number(updateData.weight);
        }

        if (updateData.dimensions) {
            const { length, width, height, unit } = updateData.dimensions;
            
            if (length !== undefined && (isNaN(length) || length < 0)) {
                return res.status(400).json({
                    success: false,
                    message: 'Length must be a positive number'
                });
            }
            
            if (width !== undefined && (isNaN(width) || width < 0)) {
                return res.status(400).json({
                    success: false,
                    message: 'Width must be a positive number'
                });
            }
            
            if (height !== undefined && (isNaN(height) || height < 0)) {
                return res.status(400).json({
                    success: false,
                    message: 'Height must be a positive number'
                });
            }
            
            if (unit && !['cm', 'in', 'm'].includes(unit)) {
                return res.status(400).json({
                    success: false,
                    message: 'Unit must be cm, in, or m'
                });
            }
        }

        if (updateData.tags !== undefined) {
            if (!Array.isArray(updateData.tags)) {
                return res.status(400).json({
                    success: false,
                    message: 'Tags must be an array'
                });
            }

            if (updateData.tags.some(tag => typeof tag !== 'string' || tag.length > 30)) {
                return res.status(400).json({
                    success: false,
                    message: 'Each tag must be a string with max 30 characters'
                });
            }
        }

        if (updateData.isActive !== undefined && typeof updateData.isActive !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'isActive must be a boolean'
            });
        }

        const product = await Product.findByIdAndUpdate(
            productId,
            updateData,
            { new: true, runValidators: true }
        ).populate('category', 'name slug');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            data: product
        });

    } catch (error) {
        next(error);
    }
};


// DELETE PRDUCT
const deleteProduct = async (req, res, next) => {
    try {
        const productId = req.params.id;
        if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID format'
            });
        }

        const product = await Product.findByIdAndDelete(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully',
            data: {
                id: product._id,
                name: product.name,
                sku: product.sku
            }
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};
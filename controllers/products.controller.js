const Product = require('../models/product');

// get all products
const getAllProducts = async (req, res) => {
    try {
        const {
            page = 1,          
            limit = 10,   
            sortBy = 'createdAt',
            order = 'desc'
        } = req.query;

       
        let query = {};

        const sortOrder = order === 'asc' ? 1 : -1;
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder;

        const skip = (Number(page) - 1) * Number(limit);

        const [products, totalCount] = await Promise.all([
            Product.find(query)
                .populate('category', 'name')
                .sort(sortOptions)
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            Product.countDocuments(query)
        ]);

        res.status(200).json({
            success: true,
            count: products.length,
            total: totalCount,
            page: Number(page),
            pages: Math.ceil(totalCount / Number(limit)),
            data: products
        });

    } catch (error) {
        console.error('Error in getAllProducts:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving products',
            error: error.message
        });
    }
}


//get by id
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category', 'name')
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
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID format'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error retrieving product',
            error: error.message
        });
    }
}

//Create product
const createProduct = async (req, res) => {
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
            tags = [],  
            images = [],  
            specifications = {} 
        } = req.body;

        if (!name || !sku || !description || price == null || !category) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: name, sku, description, price, category'
            });
        }

        if (!brand || !condition || weight == null) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: brand, condition, weight'
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
                    value: skuUpper,
                    existingProductId: existingSku._id
                }
            });
        }

        const productData = {
            name,
            sku: skuUpper,
            description,
            price: Number(price),
            category,
            stock: Number(stock) || 0,
            brand,
            condition,
            weight: Number(weight),
            dimensions: dimensions || {},
            isActive: isActive !== undefined ? isActive : true,
            tags: tags || [],
            images: images || [],
            specifications: specifications || {}
        };

        const product = await Product.create(productData);

        const populatedProduct = await Product.findById(product._id)
            .populate('category', 'name')
            .lean();

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: populatedProduct
        });

    } catch (error) {
        console.error('Error creating product:', error);
        
        if (error.name === 'ValidationError') {
            const errors = {};
            for (let field in error.errors) {
                errors[field] = error.errors[field].message;
            }
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: errors
            });
        }
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(409).json({
                success: false,
                message: `Duplicate value for ${field}`,
                field: field,
                value: error.keyValue[field]
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error creating product',
            error: error.message
        });
    }
};

// update product
const updateProduct = async (req, res) => {
    try {
        const updateData = req.body;

        // Si se actualiza el SKU, verificar que no exista otro
        if (updateData.sku) {
            updateData.sku = updateData.sku.toUpperCase();
            const existingSku = await Product.findOne({
                sku: updateData.sku,
                _id: { $ne: req.params.id }
            });
            if (existingSku) {
                return res.status(409).json({
                    success: false,
                    message: 'Another product with this SKU already exists'
                });
            }
        }

        // Si se actualiza categoryId, verificar que exista
        if (updateData.categoryId) {
            const categoryExists = await Category.exists({ _id: updateData.categoryId });
            if (!categoryExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Category does not exist'
                });
            }
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('categoryId', 'name');

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
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID format'
            });
        }
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'SKU must be unique'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error updating product',
            error: error.message
        });
    }
};

//delete product
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

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
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid product ID format'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error deleting product',
            error: error.message
        });
    }
};



module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
}
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 3 characters'],
        maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    sku: {
        type: String,
        required: [true, 'Sku is required'],
        unique: true,
        trim: true,
        uppercase: true,
        match: [/^[A-Z0-9-]+$/, 'SKU must contain only uppercase letters, numbers, and hyphens']
    },

    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true,
        minlength: [10, 'Description must be at least 10 characters'],
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },

    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative'],
        max: [100000, 'Price cannot exceed 100,000']
    },

    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Category is required']
    },

    stock: {
        type: Number,
        required: [true, 'Stock quantity is required'],
        min: [0, 'Stock cannot be negative'],
        default: 0,
        validate: {
            validator: Number.isInteger,
            message: 'Stock must be a whole number'
        }
    },

    brand: {
        type: String,
        required: [true, 'Brand is required'],
        trim: true,
        maxlength: [50, 'Brand cannot exceed 50 characters']
    },

    condition: {
        type: String,
        required: [true, 'Condition is required'],
        enum: {
            values: ['new', 'refurbished', 'used'],
            message: 'Condition must be new, refurbished, or used'
        },
        default: 'new'
    },

    weight: {
        type: Number,
        required: [true, 'Weight is required'],
        min: [0, 'Weight cannot be negative'],
        max: [1000, 'Weight cannot exceed 1000kg']
    },

    dimensions: {
        length: {
            type: Number,
            required: [true, 'Length is required'],
            min: 0
        },
        width: {
            type: Number,
            required: [true, 'Width is required'],
            min: 0
        },
        height: {
            type: Number,
            required: [true, 'Height is required'],
            min: 0
        },
        unit: {
            type: String,
            enum: ['cm', 'in', 'm'],
            default: 'cm'
        }
    },

    isActive: {
        type: Boolean,
        default: true
    },

    tags: [{
        type: String,
        trim: true,
        lowercase: true,
        maxlength: [30, 'Tag too long']
    }]

}, {
    timestamps: true,
    collection: 'products'
})


productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ brand: 1 });


productSchema.virtual('inStock').get(function () {
    return this.stock > 0 && this.isActive;
});


productSchema.virtual('weightLbs').get(function () {
    return (this.weight * 2.20462).toFixed(2);
});


module.exports = mongoose.model('Product', productSchema);
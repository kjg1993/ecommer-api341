const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        unique: true,
        trim: true,
        minlength: [2, 'Name must be at least 2 characters'],
        maxlength: [50, 'Name cannot exceed 50 characters']
    },

    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot excced 500 characters']
    },

    parentCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },

    slug: {
        type: String,
        required: [true, 'Slug is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens']
    },

    displayOrder: {
        type: Number,
        default: 0,
        min: 0
    },

    isActive: {
        type: Boolean,
        default: true
    }
},
    {
        timestamps: true,
        collection: 'categories'
    });


categorySchema.index({ isActive: 1 });

module.exports = mongoose.model('Category', categorySchema);
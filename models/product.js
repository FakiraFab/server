const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Product name is required"],
    trim: true,
    maxlength: [100, "Product name cannot exceed 100 characters"],
    index: true,
  },
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subcategory',
    required: [true, 'Subcategory is required'],
    index: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
    index: true,
  },
  description: {
    type: String,
    required: [true, "Description is required"],
    trim: true,
  },
  fullDescription: {
    type: String,
    trim: true,
    default: '',
  },
  price: {
    type: Number,
    required: [true, "Base price is required"],
    min: [0, "Price cannot be negative"],
  },
  imageUrl: {
    type: String,
    required: [true, "Primary image URL is required"],
  },
  // Multiple angle photos for the product
  images: [{
    type: String,
    required: true,
  }],
  quantity: {
    type: Number,
    required: [true, "Total quantity is required"],
    min: [0, "Quantity cannot be negative"],
  },
  // Product specifications
  specifications: {
    material: {
      type: String,
      default: 'Cotton',
    },
    style: {
      type: String,
      default: 'Traditional',
    },
    length: {
      type: String,
      default: '6 meters',
    },
    blousePiece: {
      type: String,
      default: 'Yes',
    },
    designNo: {
      type: String,
      default: 'N/A',
    },
  },
  // Unit of measurement for the product (meter or piece)
  unit: {
    type: String,
    enum: ['meter', 'piece'],
    required: [true, 'Unit of measurement is required'],
    default: 'piece',
  },
  // Color options with multiple images for each variant
  options: [
    {
      color: {
        type: String,
        required: [true, "Color is required"],
        enum: ["Red", "Blue", "Green", "Black", "White", "Yellow", "Mustard", "Coral", "Beige", "Orange", "Pink", "Purple", "Brown", "Gray", "Navy", "Maroon"],
      },
      colorCode: {
        type: String,
        required: [true, "Color code is required"],
      },
      quantity: {
        type: Number,
        required: [true, "Variant quantity is required"],
        min: [0, "Quantity cannot be negative"],
      },
      // Multiple images for each color variant (3 different angles)
      imageUrls: [
        {
          type: String,
          required: [true, "Variant image URL is required"],
        },
      ],
      price: {
        type: Number,
        min: [0, "Price cannot be negative"],
        default: null, // Null if using base price
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update updatedAt on save
productSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Update index for fast filtering
productSchema.index({ category: 1, subcategory: 1, name: 1 });

// Text index for search optimization
productSchema.index({
  name: 'text',
  description: 'text',
  'specifications.material': 'text',
  'specifications.style': 'text',
  'specifications.designNo': 'text',
  'options.color': 'text'
}, {
  weights: {
    name: 10,           // Highest priority
    description: 5,      // Medium priority
    'specifications.material': 3,
    'specifications.style': 3,
    'specifications.designNo': 2,
    'options.color': 2
  },
  name: 'product_search_index'
});

module.exports = mongoose.model("Product", productSchema);

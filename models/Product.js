const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Product name is required"],
    trim: true,
    maxlength: [100, "Product name cannot exceed 100 characters"],
    index: true,
    
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: [true, "Category is required"],
    index: true,
  },
  description: {
    type: String,
    required: [true, "Description is required"],
    trim: true,
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
  quantity: {
    type: Number,
    required: [true, "Total quantity is required"],
    min: [0, "Quantity cannot be negative"],
  },
  options: [
    {
      color: {
        type: String,
        required: [true, "Color is required"],
        enum: ["Red", "Blue", "Green", "Black", "White", "Yellow"], // Expand as needed
      },
      quantity: {
        type: Number,
        required: [true, "Variant quantity is required"],
        min: [0, "Quantity cannot be negative"],
      },
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

// Index for fast filtering
productSchema.index({ category: 1, name: 1 });

module.exports = mongoose.model("Product", productSchema);

const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Category name is required"],
    trim: true,
    unique: true,
    maxlength: [50, "Category name cannot exceed 50 characters"],
    index: true,
  },
  description: {
    type: String,
    required: [true, "Category description is required"],
    trim: true,
  },
  categoryImage: {
    type: String,
    required: [true, "Category image URL is required"],
  },
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
categorySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for fast lookup
categorySchema.index({ name: 1 });

module.exports = mongoose.model("Category", categorySchema);

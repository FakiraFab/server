const mongoose = require("mongoose");

const inquirySchema = new mongoose.Schema({
  userName: {
    type: String,
    required: [true, "Full name is required"],
    trim: true,
    maxlength: [100, "Full name cannot exceed 100 characters"],
  },
  userEmail: {
    type: String,
    required: [true, "Email is required"],
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address"],
  },
  whatsappNumber: {
    type: String,
    required: [true, "WhatsApp number is required"],
    trim: true,
    match: [/^\+?[1-9]\d{1,14}$/, "Please enter a valid WhatsApp number"],
  },
  buyOption: {
    type: String,
    required: [true, "Buy option is required"],
    enum: ["Personal", "Wholesale", "Other"],
  },
  location: {
    type: String,
    required: [true, "Location is required"],
    trim: true,
    maxlength: [300, "Location cannot exceed 300 characters"],
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [1, "Quantity must be at least 1"],
  },
  companyName: {
    type: String,
    trim: true,
    required: [
      function () {
        return this.buyOption === "Wholesale";
      },
      "Company name is required for wholesale inquiries",
    ],
    maxlength: [100, "Company name cannot exceed 100 characters"],
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: [true, "Product is required"],
    index: true,
  },
  productName: {
    type: String,
    required: [true, "Product name is required"],
    trim: true,
    maxlength: [200, "Product name cannot exceed 200 characters"],
  },
  productImage: {
    type: String,
    trim: true,
    maxlength: [1000, "Product image URL cannot exceed 1000 characters"],
  },
  variant: {
    type: String,
    trim: true,
    maxlength: [50, "Variant cannot exceed 50 characters"],
    default: "",
  },
  status: {
    type: String,
    enum: ["Pending", "Contacted", "Closed"],
    default: "Pending",
    index: true,
  },
  message: {
    type: String,
    trim: true,
    maxlength: [500, "Message cannot exceed 500 characters"],
  },
  adminNotes: {
    type: String,
    trim: true,
    maxlength: [500, "Admin notes cannot exceed 500 characters"],
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
inquirySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for fast admin queries
inquirySchema.index({ product: 1, status: 1 });

module.exports = mongoose.model("Inquiry", inquirySchema);
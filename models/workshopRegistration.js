const mongoose = require("mongoose");

const workshopRegistrationSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, "Full name is required"],
    trim: true,
    maxlength: [100, "Full name cannot exceed 100 characters"],
  },
  age: {
    type: Number,
    required: [true, "Age is required"],
    min: [10, "Age must be at least 10 years"],
    max: [30, "Age cannot exceed 30 years"],
  },
  institution: {
    type: String,
    required: [true, "College/School name is required"],
    trim: true,
    maxlength: [200, "Institution name cannot exceed 200 characters"],
  },
  educationLevel: {
    type: String,
    required: [true, "Education level is required"],
    enum: ["School", "College", "University"],
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address"],
  },
  contactNumber: {
    type: String,
    required: [true, "Contact number is required"],
    trim: true,
    match: [/^\+?[1-9]\d{1,14}$/, "Please enter a valid contact number"],
  },
  workshopName: {
    type: String,
    required: [true, "Workshop name is required"],
    trim: true,
  },
  status: {
    type: String,
    enum: ["Pending", "Confirmed", "Cancelled"],
    default: "Pending",
  },
  specialRequirements: {
    type: String,
    trim: true,
    maxlength: [500, "Special requirements cannot exceed 500 characters"],
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
workshopRegistrationSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for fast queries
workshopRegistrationSchema.index({ workshopName: 1, status: 1 });

module.exports = mongoose.model("WorkshopRegistration", workshopRegistrationSchema);

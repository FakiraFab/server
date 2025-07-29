const mongoose = require("mongoose");

const workshopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Workshop name is required"],
    trim: true,
    maxlength: [200, "Workshop name cannot exceed 200 characters"],
  },
  description: {
    type: String,
    required: [true, "Workshop description is required"],
    trim: true,
    maxlength: [1000, "Description cannot exceed 1000 characters"],
  },
  dateTime: {
    type: Date,
    required: [true, "Workshop date and time is required"],
  },
  duration: {
    type: String,
    required: [true, "Workshop duration is required"],
    trim: true,
    maxlength: [50, "Duration cannot exceed 50 characters"],
  },
  maxParticipants: {
    type: Number,
    required: [true, "Maximum participants is required"],
    min: [1, "Maximum participants must be at least 1"],
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: [0, "Price cannot be negative"],
  },
  location: {
    type: String,
    required: [true, "Workshop location is required"],
    trim: true,
    maxlength: [200, "Location cannot exceed 200 characters"],
  },
  requirements: {
    type: String,
    trim: true,
    maxlength: [1000, "Requirements cannot exceed 1000 characters"],
  },
  status: {
    type: String,
    enum: ["Upcoming", "Ongoing", "Completed", "Cancelled"],
    default: "Upcoming",
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
workshopSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for fast queries
workshopSchema.index({ dateTime: 1, status: 1 });

module.exports = mongoose.model("Workshop", workshopSchema);

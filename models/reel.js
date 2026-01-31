const mongoose = require('mongoose');

const reelSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    
    videoUrl: {
      type: String,
      required: true,
      trim: true,
    },
    thumbnail: {
        type: String,
        required: true,
        trim: true,
    },
    isVideo: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      trim: true,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Reel', reelSchema); 
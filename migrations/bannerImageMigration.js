const mongoose = require('mongoose');
const Banner = require('../models/banner');

const dotenv = require("dotenv");
dotenv.config();

// Add MongoDB connection URL - update this with your actual MongoDB URL
const MONGODB_URL = process.env.MONGODB_URI ;

console.log(MONGODB_URL);

const migrateBannerImages = async () => {
  try {
    await mongoose.connect(MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    // Rename field "image" → "imageDesktop"
    const result = await Banner.updateMany(
      { image: { $exists: true } },
      { $rename: { image: "imageDesktop" } }
    );

    console.log(`Successfully renamed ${result.modifiedCount} banners`);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

if (require.main === module) {
  migrateBannerImages();
}

module.exports = migrateBannerImages;
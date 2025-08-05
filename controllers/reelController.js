const Reel = require('../models/reel');
const catchAsync = require('../utils/catchAsync');
const responseHandler = require('../utils/responseHandler');

// Get all reels with pagination
exports.getReels = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const isActive = req.query.isActive;

  let query = {};
  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  const [reels, total] = await Promise.all([
    Reel.find(query)
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Reel.countDocuments(query),
  ]);

  responseHandler.success(res, {
    data: reels,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalItems: total,
  });
});

// Get single reel
exports.getReel = catchAsync(async (req, res) => {
  const reel = await Reel.findById(req.params.id);
  if (!reel) {
    return responseHandler.error(res, 'Reel not found', 404);
  }
  responseHandler.success(res, { data: reel });
});

// Create reel
exports.createReel = catchAsync(async (req, res) => {
  const reel = await Reel.create(req.body);
  responseHandler.success(res, { data: reel, message: 'Reel created successfully' }, 201);
});

// Update reel
exports.updateReel = catchAsync(async (req, res) => {
  const reel = await Reel.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  
  if (!reel) {
    return responseHandler.error(res, 'Reel not found', 404);
  }

  responseHandler.success(res, { data: reel, message: 'Reel updated successfully' });
});

// Delete reel
exports.deleteReel = catchAsync(async (req, res) => {
  const reel = await Reel.findByIdAndDelete(req.params.id);
  
  if (!reel) {
    return responseHandler.error(res, 'Reel not found', 404);
  }

  responseHandler.success(res, { message: 'Reel deleted successfully' });
});

// Toggle reel visibility
exports.toggleReelVisibility = catchAsync(async (req, res) => {
  const reel = await Reel.findById(req.params.id);
  
  if (!reel) {
    return responseHandler.error(res, 'Reel not found', 404);
  }

  reel.isActive = !reel.isActive;
  await reel.save();

  responseHandler.success(res, { 
    data: reel, 
    message: `Reel ${reel.isActive ? 'activated' : 'deactivated'} successfully` 
  });
});

// Get active reels only
exports.getActiveReels = catchAsync(async (req, res) => {
  const reels = await Reel.find({ isActive: true })
    .sort({ order: 1, createdAt: -1 });

  responseHandler.success(res, { data: reels });
}); 
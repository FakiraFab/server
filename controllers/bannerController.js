const Banner = require('../models/banner');
const catchAsync = require('../utils/catchAsync');
const responseHandler = require('../utils/responseHandler');

// Get all banners with pagination
exports.getBanners = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [banners, total] = await Promise.all([
    Banner.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Banner.countDocuments(),
  ]);

  responseHandler.success(res, {
    data: banners,
    currentPage: page,
    totalPages: Math.ceil(total / limit),
    totalItems: total,
  });
});

// Get single banner
exports.getBanner = catchAsync(async (req, res) => {
  const banner = await Banner.findById(req.params.id);
  if (!banner) {
    return responseHandler.error(res, 'Banner not found', 404);
  }
  responseHandler.success(res, { data: banner });
});

// Create banner
exports.createBanner = catchAsync(async (req, res) => {
  const banner = await Banner.create(req.body);
  responseHandler.success(res, { data: banner, message: 'Banner created successfully' }, 201);
});

// Update banner
exports.updateBanner = catchAsync(async (req, res) => {
  const banner = await Banner.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  
  if (!banner) {
    return responseHandler.error(res, 'Banner not found', 404);
  }

  responseHandler.success(res, { data: banner, message: 'Banner updated successfully' });
});

// Delete banner
exports.deleteBanner = catchAsync(async (req, res) => {
  const banner = await Banner.findByIdAndDelete(req.params.id);
  
  if (!banner) {
    return responseHandler.error(res, 'Banner not found', 404);
  }

  responseHandler.success(res, { message: 'Banner deleted successfully' });
});

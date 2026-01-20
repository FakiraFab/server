const Address = require('../models/address');
const catchAsync = require('../utils/catchAsync');
const { AppError } = require('../middleware/errorHandler');
const { StatusCodes } = require('../utils/errorMessages');
const ResponseHandler = require('../utils/responseHandler');
const logger = require('../utils/logger');
const { createAddressSchema, updateAddressSchema } = require('../schemas/addressSchemas');

/**
 * GET /api/addresses
 * Get all addresses for the authenticated user
 */
exports.getAddresses = catchAsync(async (req, res, next) => {
  const addresses = await Address.find({ userId: req.user.id })
    .sort({ isDefault: -1, createdAt: -1 })
    .lean();

  ResponseHandler.success(res, {
    data: addresses,
    message: 'Addresses retrieved successfully'
  });
});

/**
 * POST /api/addresses
 * Create a new address
 */
exports.createAddress = catchAsync(async (req, res, next) => {
  // Validate request body
  const { error } = createAddressSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, StatusCodes.BAD_REQUEST));
  }

  const addressData = {
    ...req.body,
    userId: req.user.id
  };

  // If this is being set as default, unset other defaults
  if (addressData.isDefault) {
    await Address.updateMany(
      { userId: req.user.id },
      { isDefault: false }
    );
  }

  const address = await Address.create(addressData);

  logger.info('Address created', {
    userId: req.user.id,
    addressId: address._id
  });

  ResponseHandler.created(res, address, 'Address created successfully');
});

/**
 * GET /api/addresses/:id
 * Get a specific address by ID
 */
exports.getAddressById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const address = await Address.findOne({
    _id: id,
    userId: req.user.id
  }).lean();

  if (!address) {
    return next(new AppError('Address not found', StatusCodes.NOT_FOUND));
  }

  ResponseHandler.success(res, {
    data: address,
    message: 'Address retrieved successfully'
  });
});

/**
 * PATCH /api/addresses/:id
 * Update an address
 */
exports.updateAddress = catchAsync(async (req, res, next) => {
  // Validate request body
  const { error } = updateAddressSchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, StatusCodes.BAD_REQUEST));
  }

  const { id } = req.params;

  // If setting as default, unset other defaults first
  if (req.body.isDefault) {
    await Address.updateMany(
      { userId: req.user.id, _id: { $ne: id } },
      { isDefault: false }
    );
  }

  const address = await Address.findOneAndUpdate(
    { _id: id, userId: req.user.id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!address) {
    return next(new AppError('Address not found', StatusCodes.NOT_FOUND));
  }

  logger.info('Address updated', {
    userId: req.user.id,
    addressId: address._id
  });

  ResponseHandler.success(res, {
    data: address,
    message: 'Address updated successfully'
  });
});

/**
 * DELETE /api/addresses/:id
 * Delete an address
 */
exports.deleteAddress = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const address = await Address.findOneAndDelete({
    _id: id,
    userId: req.user.id
  });

  if (!address) {
    return next(new AppError('Address not found', StatusCodes.NOT_FOUND));
  }

  // If deleted address was default, set another address as default
  if (address.isDefault) {
    const nextAddress = await Address.findOne({ userId: req.user.id }).sort({ createdAt: -1 });
    if (nextAddress) {
      nextAddress.isDefault = true;
      await nextAddress.save();
    }
  }

  logger.info('Address deleted', {
    userId: req.user.id,
    addressId: id
  });

  ResponseHandler.deleted(res, 'Address deleted successfully');
});

/**
 * PATCH /api/addresses/:id/set-default
 * Set an address as default
 */
exports.setDefaultAddress = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // Check if address exists and belongs to user
  const address = await Address.findOne({
    _id: id,
    userId: req.user.id
  });

  if (!address) {
    return next(new AppError('Address not found', StatusCodes.NOT_FOUND));
  }

  // Use static method to set default
  await Address.setDefaultAddress(req.user.id, id);

  // Fetch the updated address
  const updatedAddress = await Address.findById(id);

  logger.info('Default address set', {
    userId: req.user.id,
    addressId: id
  });

  ResponseHandler.success(res, {
    data: updatedAddress,
    message: 'Default address set successfully'
  });
});

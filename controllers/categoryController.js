const Category = require("../models/category");
const categorySchema = require("../schemas/categorySchema");
const { AppError } = require("../middleware/errorHandler");
const catchAsync = require("../utils/catchAsync");
const { ErrorMessages, StatusCodes } = require("../utils/errorMessages");
const ResponseHandler = require("../utils/responseHandler");
const Subcategory = require("../models/subcategory");

const getCategories = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, sort = "name" } = req.query;
  const skip = (page - 1) * limit;
  const categories = await Category.find()
    .skip(skip)
    .limit(parseInt(limit))
    .sort(sort)
    .lean();
  const total = await Category.countDocuments();
  ResponseHandler.paginated(res, {
    data: categories,
    page,
    limit,
    total,
    message: 'Categories retrieved successfully',
  });
});

const getCategoryById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id) {
    return next(new AppError(ErrorMessages.REQUIRED_FIELD('Category ID'), StatusCodes.BAD_REQUEST));
  }
  const category = await Category.findById(id).lean();
  if (!category) {
    return next(new AppError(ErrorMessages.RESOURCE_NOT_FOUND('Category'), StatusCodes.NOT_FOUND));
  }
  ResponseHandler.success(res, {
    data: category,
    message: 'Category retrieved successfully',
  });
});

const createCategory = catchAsync(async (req, res, next) => {
  const { error } = categorySchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, StatusCodes.BAD_REQUEST));
  }

  const existingCategory = await Category.findOne({ name: req.body.name });
  if (existingCategory) {
    return next(new AppError(ErrorMessages.RESOURCE_EXISTS('Category'), StatusCodes.CONFLICT));
  }

  const category = await Category.create(req.body);
  ResponseHandler.created(res, category, 'Category created successfully');
});

const updateCategory = catchAsync(async (req, res, next) => {
  const { error } = categorySchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, StatusCodes.BAD_REQUEST));
  }

  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!category) {
    return next(new AppError(ErrorMessages.RESOURCE_NOT_FOUND('Category'), StatusCodes.NOT_FOUND));
  }
  ResponseHandler.success(res, {
    data: category,
    message: 'Category updated successfully',
  });
});

const deleteCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) {
    return next(new AppError(ErrorMessages.RESOURCE_NOT_FOUND('Category'), StatusCodes.NOT_FOUND));
  }
  ResponseHandler.deleted(res, 'Category deleted successfully');
});

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
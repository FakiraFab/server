const Subcategory = require('../models/subcategory');
const Category = require('../models/category');
const subcategorySchema = require('../schemas/subcategorySchema');
const catchAsync = require('../utils/catchAsync');
const { AppError } = require('../middleware/errorHandler');
const { ErrorMessages, StatusCodes } = require('../utils/errorMessages');
const ResponseHandler = require('../utils/responseHandler');

// Create a new subcategory
const createSubcategory = catchAsync(async (req, res, next) => {
  const { error } = subcategorySchema.validate(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, StatusCodes.BAD_REQUEST));
  }

  const { name, parentCategory } = req.body;
  // Check if parent category exists
  const parent = await Category.findById(parentCategory);
  // console.log(parent.name);
  if (!parent) {
    return next(new AppError('Parent category does not exist', StatusCodes.BAD_REQUEST));
  }

  // Check for duplicate subcategory name
  const existing = await Subcategory.findOne({ name, parentCategory });
  if (existing) {
    return next(new AppError(ErrorMessages.RESOURCE_EXISTS('Subcategory'), StatusCodes.CONFLICT));
  }



  const subcategory = await Subcategory.create(req.body);
  
  // Add subcategory to parent category's subcategories array if not already there
  if (!parent.subcategories.includes(subcategory._id)) {
    parent.subcategories.push(subcategory._id);
    await parent.save();
  }
  
  ResponseHandler.created(res, subcategory, 'Subcategory created successfully');
});

// Get all subcategories (with optional pagination and population)
const getAllSubcategories = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, parentCategory, category } = req.query;
  const skip = (page - 1) * limit;
  // Accept both 'parentCategory' and 'category' as filter
  const filter = {};
  if (parentCategory) filter.parentCategory = parentCategory;
  if (category) filter.parentCategory = category;

  const subcategories = await Subcategory.find(filter)
    .populate('parentCategory', 'name')
    .skip(skip)
    .limit(parseInt(limit))
    .lean();
  const total = await Subcategory.countDocuments(filter);
  ResponseHandler.paginated(res, {
    data: subcategories,
    page,
    limit,
    total,
    message: 'Subcategories retrieved successfully',
  });
});

// Get a single subcategory by ID
const getSubcategoryById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id) {
    return next(new AppError(ErrorMessages.REQUIRED_FIELD('Subcategory ID'), StatusCodes.BAD_REQUEST));
  }
  const subcategory = await Subcategory.findById(id)
    .populate('parentCategory', 'name description')
    .lean();
  if (!subcategory) {
    return next(new AppError(ErrorMessages.RESOURCE_NOT_FOUND('Subcategory'), StatusCodes.NOT_FOUND));
  }
  ResponseHandler.success(res, {
    data: subcategory,
    message: 'Subcategory retrieved successfully',
  });
});

// Update a subcategory by ID
const updateSubcategory = catchAsync(async (req, res, next) => {
  const { error } = subcategorySchema.validate(req.body);
  console.log(req.body);
  if (error) {
    return next(new AppError(error.details[0].message, StatusCodes.BAD_REQUEST));
  }
  const { parentCategory } = req.body;
  if (parentCategory) {
    const parent = await Category.findById(parentCategory);
    if (!parent) {
      return next(new AppError('Parent category does not exist', StatusCodes.BAD_REQUEST));
    }
  }
  const subcategory = await Subcategory.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!subcategory) {
    return next(new AppError(ErrorMessages.RESOURCE_NOT_FOUND('Subcategory'), StatusCodes.NOT_FOUND));
  }
  ResponseHandler.success(res, {
    data: subcategory,
    message: 'Subcategory updated successfully',
  });
});

// Delete a subcategory by ID
const deleteSubcategory = catchAsync(async (req, res, next) => {
  const subcategory = await Subcategory.findByIdAndDelete(req.params.id);
  if (!subcategory) {
    return next(new AppError(ErrorMessages.RESOURCE_NOT_FOUND('Subcategory'), StatusCodes.NOT_FOUND));
  }
  ResponseHandler.deleted(res, 'Subcategory deleted successfully');
});

module.exports = {
  createSubcategory,
  getAllSubcategories,
  getSubcategoryById,
  updateSubcategory,
  deleteSubcategory,
};
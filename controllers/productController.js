const Product = require('../models/product');
const Category = require('../models/category');
const Subcategory = require('../models/subcategory');
const { productSchema } = require('../schemas/productSchemas');
const mongoose = require('mongoose');


// Enhanced color mapping with more colors
const COLOR_MAP = {
  'Red': '#e53e3e',
  'Blue': '#3182ce',
  'Navy': '#1a365d',
  'Green': '#38a169',
  'Yellow': '#ecc94b',
  'Orange': '#ff8c00',
  'Pink': '#ff69b4',
  'Purple': '#9f7aea',
  'Brown': '#8b4513',
  'Black': '#000000',
  'White': '#ffffff',
  'Gray': '#718096',
  'Maroon': '#8b0000',
  'Mustard': '#d69e2e',
  'Coral': '#ff7f7f',
  'Beige': '#c6a882',
  'Turquoise': '#38b2ac',
  'Lavender': '#b794f6',
  'Peach': '#fbb6ce',
  'Mint': '#81e6d9',
};

const getProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category: categoryParam, subcategory: subcategoryParam, sort = 'name' } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};

    let categoryId = null;
    if (categoryParam) {
      if (mongoose.Types.ObjectId.isValid(categoryParam)) {
        categoryId = categoryParam;
        const categoryExists = await Category.findById(categoryId).lean();
        if (!categoryExists) {
          return res.status(400).json({ success: false, message: 'Category not found' });
        }
      } else {
        const category = await Category.findOne({ name: categoryParam }).select('_id').lean();
        if (!category) {
          return res.status(400).json({ success: false, message: 'Category not found' });
        }
        categoryId = category._id;
      }
      filter.category = categoryId;
    }

    let subcategoryId = null;
    if (subcategoryParam && subcategoryParam !== 'All') {
      if (mongoose.Types.ObjectId.isValid(subcategoryParam)) {
        subcategoryId = subcategoryParam;
        const subcategoryExists = await Subcategory.findById(subcategoryId).lean();
        if (!subcategoryExists) {
          return res.status(400).json({ success: false, message: 'Subcategory not found' });
        }
      } else {
        const subcategory = await Subcategory.findOne({ name: subcategoryParam, parentCategory: categoryId }).select('_id').lean();
        if (!subcategory) {
          return res.status(400).json({ success: false, message: 'Subcategory not found' });
        }
        subcategoryId = subcategory._id;
      }
      filter.subcategory = subcategoryId;
    }

    const products = await Product.find(filter)
      .populate('category', 'name')
      .populate('subcategory', 'name')
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sort)
      .lean();

    const total = await Product.countDocuments(filter);

    let subCategories = [];
    if (categoryId) {
      subCategories = (await Subcategory.find({ parentCategory: categoryId }).select('name').lean()).map((sc) => sc.name);
    }

    res.status(200).json({
      success: true,
      data: products,
      total,
      filters: { subCategories },
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }
    
    const product = await Product.findById(id)
      .populate('category', 'name description')
      .populate('subcategory', 'name description')
      .lean();

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Prepare images array - combining main images and variant images
    const images = product.images && product.images.length > 0 
      ? product.images 
      : [product.imageUrl];

    // Transform options into variants with proper structure
    const variants = product.options.map((opt, index) => ({
      id: opt._id,
      color: opt.color,
      colorCode: opt.colorCode || getColorCode(opt.color),
      image: opt.imageUrls[0] || product.imageUrl,
      images: opt.imageUrls || [product.imageUrl], // All images for this variant
      quantity: opt.quantity,
      price: opt.price || product.price,
    }));

    // Prepare specifications
    const specifications = {
      material: product.specifications?.material || 'Cotton',
      color: product.options[0]?.color || 'Unknown',
      style: product.specifications?.style || 'Traditional',
      length: product.specifications?.length || '6 meters',
      blousePiece: product.specifications?.blousePiece || 'Yes',
      designNo: product.specifications?.designNo || 'N/A',
    };

    // Full description
    const fullDescription = product.fullDescription || product.description || 'No detailed description available.';

    res.status(200).json({
      success: true,
      data: {
        ...product,
        images,
        variants,
        specifications,
        fullDescription,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Enhanced color mapping function
function getColorCode(color) {
  return COLOR_MAP[color] || '#000000';
}

// Enhanced product creation with better validation
const createProduct = async (req, res, next) => {
  try {
    // Validate request body
    const { error } = productSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    const { category, subcategory, options = [] } = req.body;

    // Validate category existence
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ success: false, message: 'Category does not exist' });
    }

    // Validate subcategory existence and relationship
    const subcategoryExists = await Subcategory.findById(subcategory);
    if (!subcategoryExists) {
      return res.status(400).json({ success: false, message: 'Subcategory does not exist' });
    }
    if (String(subcategoryExists.parentCategory) !== String(category)) {
      return res.status(400).json({ success: false, message: 'Subcategory does not belong to the specified category' });
    }

    // Enhanced validation for options
    const validationErrors = [];
    
    if (options.length === 0) {
      validationErrors.push('At least one product variant is required');
    }

    options.forEach((option, index) => {
      if (!option.color) {
        validationErrors.push(`Option ${index + 1}: Color is required`);
      }
      if (!option.quantity || option.quantity <= 0) {
        validationErrors.push(`Option ${index + 1}: Valid quantity is required`);
      }
      if (option.price && option.price < 0) {
        validationErrors.push(`Option ${index + 1}: Price cannot be negative`);
      }
      if (!option.imageUrls || option.imageUrls.length === 0) {
        validationErrors.push(`Option ${index + 1}: At least one image is required`);
      }
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Auto-generate color codes if not provided
    const processedOptions = options.map(option => ({
      ...option,
      colorCode: option.colorCode || getColorCode(option.color),
      imageUrls: option.imageUrls.filter(url => url && url.trim() !== '')
    }));

    // Create product with processed options
    const productData = {
      ...req.body,
      options: processedOptions,
      images: req.body.images?.filter(img => img && img.trim() !== '') || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const product = await Product.create(productData);

    // Populate the response with category and subcategory details
    const populatedProduct = await Product.findById(product._id)
      .populate('category', 'name description')
      .populate('subcategory', 'name description')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: populatedProduct,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    // Check if product exists
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Validate request body
    const { error } = productSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    const { category, subcategory, options = [] } = req.body;

    // Validate category if provided
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(404).json({ success: false, message: 'Category does not exist' });
      }
    }

    // Validate subcategory if provided
    if (subcategory) {
      const subcategoryExists = await Subcategory.findById(subcategory);
      if (!subcategoryExists) {
        return res.status(404).json({ success: false, message: 'Subcategory does not exist' });
      }
      if (category && String(subcategoryExists.parentCategory) !== String(category)) {
        return res.status(400).json({ success: false, message: 'Subcategory does not belong to the specified category' });
      }
    }

    // Process options with auto-generated color codes
    const processedOptions = options.map(option => ({
      ...option,
      colorCode: option.colorCode || getColorCode(option.color),
      imageUrls: option.imageUrls?.filter(url => url && url.trim() !== '') || []
    }));

    // Update product data
    const updateData = {
      ...req.body,
      options: processedOptions,
      images: req.body.images?.filter(img => img && img.trim() !== '') || [],
      updatedAt: new Date()
    };

    const product = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate('category', 'name description')
      .populate('subcategory', 'name description');

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid product ID' });
    }

    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      data: { id: product._id, name: product.name }
    });
  } catch (error) {
    next(error);
  }
};

// Additional utility functions for better product management
const bulkUpdateProducts = async (req, res, next) => {
  try {
    const { products } = req.body;
    
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ success: false, message: 'Products array is required' });
    }

    const updatePromises = products.map(async (productData) => {
      if (!productData.id) {
        throw new Error('Product ID is required for bulk update');
      }

      const processedOptions = productData.options?.map(option => ({
        ...option,
        colorCode: option.colorCode || getColorCode(option.color),
        imageUrls: option.imageUrls?.filter(url => url && url.trim() !== '') || []
      })) || [];

      return Product.findByIdAndUpdate(
        productData.id,
        {
          ...productData,
          options: processedOptions,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      );
    });

    const updatedProducts = await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: `${updatedProducts.length} products updated successfully`,
      data: updatedProducts
    });
  } catch (error) {
    next(error);
  }
};

const getProductsByCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 10, sort = 'name' } = req.query;
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ success: false, message: 'Invalid category ID' });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const products = await Product.find({ category: categoryId })
      .populate('category', 'name')
      .populate('subcategory', 'name')
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sort)
      .lean();

    const total = await Product.countDocuments({ category: categoryId });

    res.status(200).json({
      success: true,
      data: products,
      category: category.name,
      total,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { 
  getProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  bulkUpdateProducts,
  getProductsByCategory
};
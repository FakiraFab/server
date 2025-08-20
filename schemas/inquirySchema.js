const Joi = require('joi');

const createInquirySchema = Joi.object({
  userName: Joi.string().trim().required().max(100).messages({
    'string.base': 'Full name must be a string',
    'string.empty': 'Full name is required',
    'string.max': 'Full name cannot exceed 100 characters',
    'any.required': 'Full name is required',
  }),
  userEmail: Joi.string().trim().email().required().messages({
    'string.base': 'Email must be a string',
    'string.empty': 'Email is required',
    'string.email': 'Please enter a valid email address',
    'any.required': 'Email is required',
  }),
  whatsappNumber: Joi.string().trim().required().pattern(/^\+?[1-9]\d{1,14}$/).messages({
    'string.base': 'WhatsApp number must be a string',
    'string.empty': 'WhatsApp number is required',
    'string.pattern.base': 'Please enter a valid WhatsApp number',
    'any.required': 'WhatsApp number is required',
  }),
  buyOption: Joi.string().valid('Personal', 'Wholesale', 'Other').required().messages({
    'string.base': 'Buy option must be a string',
    'any.only': 'Buy option must be one of Personal, Wholesale, Other',
    'any.required': 'Buy option is required',
  }),
  location: Joi.string().trim().required().max(300).messages({
    'string.base': 'Location must be a string',
    'string.empty': 'Location is required',
    'string.max': 'Location cannot exceed 300 characters',
    'any.required': 'Location is required',
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    'number.base': 'Quantity must be a number',
    'number.integer': 'Quantity must be an integer',
    'number.min': 'Quantity must be at least 1',
    'any.required': 'Quantity is required',
  }),
  companyName: Joi.string().trim().max(100).when('buyOption', {
    is: 'Wholesale',
    then: Joi.required(),
    otherwise: Joi.optional().allow(''),
  }).messages({
    'string.base': 'Company name must be a string',
    'string.max': 'Company name cannot exceed 100 characters',
    'any.required': 'Company name is required for wholesale inquiries',
  }),
  productId: Joi.string().hex().length(24).required().messages({
    'string.base': 'Product ID must be a string',
    'string.hex': 'Product ID must be a valid ObjectId',
    'string.length': 'Product ID must be 24 characters long',
    'any.required': 'Product ID is required',
  }),
  productName: Joi.string().trim().required().max(200).messages({
    'string.base': 'Product name must be a string',
    'string.empty': 'Product name is required',
    'string.max': 'Product name cannot exceed 200 characters',
    'any.required': 'Product name is required',
  }),
  productImage: Joi.string().trim().max(1000).allow('').optional().messages({
    'string.base': 'Product image must be a string',
    'string.max': 'Product image URL cannot exceed 1000 characters',
  }),
  variant: Joi.string().trim().max(50).allow('').optional().messages({
    'string.base': 'Variant must be a string',
    'string.max': 'Variant cannot exceed 50 characters',
  }),
  message: Joi.string().trim().max(500).allow('').optional().messages({
    'string.base': 'Message must be a string',
    'string.max': 'Message cannot exceed 500 characters',
  }),
  status: Joi.string().valid('pending', 'processing', 'completed', 'cancelled').optional().messages({
    'string.base': 'Status must be a string',
    'any.only': 'Status must be one of pending, processing, completed, cancelled',
  }),
  adminNotes: Joi.string().trim().max(500).allow('').optional().messages({
    'string.base': 'Admin notes must be a string',
    'string.max': 'Admin notes cannot exceed 500 characters',
  }),
});

const updateInquirySchema = Joi.object({
  userName: Joi.string().trim().max(100).optional().messages({
    'string.base': 'Full name must be a string',
    'string.max': 'Full name cannot exceed 100 characters'
  }),
  userEmail: Joi.string().trim().email().optional().messages({
    'string.base': 'Email must be a string',
    'string.email': 'Please enter a valid email address'
  }),
  whatsappNumber: Joi.string().trim().pattern(/^\+?[1-9]\d{1,14}$/).optional().messages({
    'string.base': 'WhatsApp number must be a string',
    'string.pattern.base': 'Please enter a valid WhatsApp number'
  }),
  buyOption: Joi.string().valid('Personal', 'Wholesale', 'Other').optional().messages({
    'string.base': 'Buy option must be a string',
    'any.only': 'Buy option must be one of Personal, Wholesale, Other'
  }),
  location: Joi.string().trim().max(300).optional().messages({
    'string.base': 'Location must be a string',
    'string.max': 'Location cannot exceed 300 characters'
  }),
  quantity: Joi.number().integer().min(1).optional().messages({
    'number.base': 'Quantity must be a number',
    'number.integer': 'Quantity must be an integer',
    'number.min': 'Quantity must be at least 1'
  }),
  companyName: Joi.string().trim().max(100).optional().messages({
    'string.base': 'Company name must be a string',
    'string.max': 'Company name cannot exceed 100 characters'
  }),
  productName: Joi.string().trim().max(200).optional().messages({
    'string.base': 'Product name must be a string',
    'string.max': 'Product name cannot exceed 200 characters'
  }),
  productImage: Joi.string().trim().max(1000).allow('').optional().messages({
    'string.base': 'Product image must be a string',
    'string.max': 'Product image URL cannot exceed 1000 characters'
  }),
  variant: Joi.string().trim().max(50).allow('').optional().messages({
    'string.base': 'Variant must be a string',
    'string.max': 'Variant cannot exceed 50 characters'
  }),
  message: Joi.string().trim().max(500).allow('').optional().messages({
    'string.base': 'Message must be a string',
    'string.max': 'Message cannot exceed 500 characters'
  }),
  status: Joi.string().valid('Pending', 'Processing', 'Completed', 'Cancelled').optional().messages({
    'string.base': 'Status must be a string',
    'any.only': 'Status must be one of pending, processing, completed, cancelled'
  }),
  adminNotes: Joi.string().trim().max(500).allow('').optional().messages({
    'string.base': 'Admin notes must be a string',
    'string.max': 'Admin notes cannot exceed 500 characters'
  })
});

module.exports = { createInquirySchema, updateInquirySchema };
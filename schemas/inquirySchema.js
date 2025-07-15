const Joi = require('joi');

const inquirySchema = Joi.object({
  fullName: Joi.string()
    .trim()
    .max(100)
    .required()
    .messages({
      'string.base': 'Full name must be a string',
      'string.empty': 'Full name is required',
      'string.max': 'Full name cannot exceed 100 characters',
    }),

  phoneNumber: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .required()
    .messages({
      'string.pattern.base': 'Please enter a valid phone number',
      'string.empty': 'Phone number is required',
    }),

  buyOption: Joi.string()
    .valid('Personal', 'Wholesale', 'Other')
    .required()
    .messages({
      'any.only': 'Buy option must be one of: Personal, Wholesale, or Other',
      'any.required': 'Buy option is required',
    }),

  location: Joi.string()
    .trim()
    .max(300)
    .required()
    .messages({
      'string.base': 'Location must be a string',
      'string.empty': 'Location is required',
      'string.max': 'Location cannot exceed 300 characters',
    }),

  quantity: Joi.number()
    .min(1)
    .required()
    .messages({
      'number.base': 'Quantity must be a number',
      'number.min': 'Quantity must be at least 1',
      'any.required': 'Quantity is required',
    }),

  companyName: Joi.string()
    .trim()
    .when('buyOption', {
      is: 'Wholesale',
      then: Joi.required(),
      otherwise: Joi.optional(),
    })
    .messages({
      'string.empty': 'Company name is required for wholesale inquiries',
    }),

  product: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid product ID format',
      'any.required': 'Product is required',
    }),

  variant: Joi.string()
    .valid('Red', 'Blue', 'Green', 'Black', 'White', 'Yellow', '')
    .default('')
    .messages({
      'any.only': 'Invalid variant color',
    }),

  message: Joi.string()
    .trim()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Message cannot exceed 500 characters',
    }),

  adminNotes: Joi.string()
    .trim()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Admin notes cannot exceed 500 characters',
    }),
});

module.exports = inquirySchema;
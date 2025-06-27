const Joi = require('joi');

const productSchema = Joi.object({
  name: Joi.string()
    .trim()
    .max(100)
    .required()
    .messages({
      'string.base': 'Product name must be a string',
      'string.empty': 'Product name is required',
      'string.max': 'Product name cannot exceed 100 characters',
    }),

  category: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/) 
    .required()
    .messages({
      'string.pattern.base': 'Invalid category ID format',
      'any.required': 'Category is required',
    }),

  description: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': 'Description is required',
    }),

  price: Joi.number()
    .min(0)
    .required()
    .messages({
      'number.base': 'Price must be a number',
      'number.min': 'Price cannot be negative',
      'any.required': 'Base price is required',
    }),

  imageUrl: Joi.string()
    .uri()
    .required()
    .messages({
      'string.uri': 'Primary image URL must be a valid URI',
      'any.required': 'Primary image URL is required',
    }),

  quantity: Joi.number()
    .min(0)
    .required()
    .messages({
      'number.min': 'Quantity cannot be negative',
      'any.required': 'Total quantity is required',
    }),

  options: Joi.array().items(
    Joi.object({
      color: Joi.string()
        .valid('Red', 'Blue', 'Green', 'Black', 'White', 'Yellow')
        .required()
        .messages({
          'any.only': 'Color must be one of the allowed values',
          'any.required': 'Color is required',
        }),

      quantity: Joi.number()
        .min(0)
        .required()
        .messages({
          'number.min': 'Variant quantity cannot be negative',
          'any.required': 'Variant quantity is required',
        }),

      imageUrls: Joi.array()
        .items(Joi.string().uri().required())
        .min(1)
        .required()
        .messages({
          'array.base': 'Image URLs must be an array of valid URIs',
          'any.required': 'Variant image URLs are required',
        }),

      price: Joi.number()
        .min(0)
        .allow(null)
        .messages({
          'number.min': 'Variant price cannot be negative',
        }),
    })
  ),

  createdAt: Joi.date().optional(),
  updatedAt: Joi.date().optional(),
});


module.exports = productSchema;

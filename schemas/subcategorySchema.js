const Joi = require('joi');

const subcategorySchema = Joi.object({
  name: Joi.string()
    .trim()
    .max(50)
    .required()
    .messages({
      'string.base': 'Subcategory name must be a string',
      'string.empty': 'Subcategory name is required',
      'string.max': 'Subcategory name cannot exceed 50 characters',
    }),

  description: Joi.string()
    .trim()
    .required()
    .messages({
      'string.base': 'Description must be a string',
      'string.empty': 'Subcategory description is required',
    }),

  parentCategory: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid parent category ID format',
      'any.required': 'Parent category is required',
    }),

  createdAt: Joi.date().optional(),
  updatedAt: Joi.date().optional(),
});

module.exports = subcategorySchema; 
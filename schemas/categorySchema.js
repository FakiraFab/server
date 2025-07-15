const Joi = require('joi');

const categorySchema = Joi.object({
  name: Joi.string()
    .trim()
    .max(50)
    .required()
    .messages({
      'string.base': 'Category name must be a string',
      'string.empty': 'Category name is required',
      'string.max': 'Category name cannot exceed 50 characters',
    }),

  description: Joi.string()
    .trim()
    .required()
    .messages({
      'string.base': 'Description must be a string',
      'string.empty': 'Category description is required',
    }),

  categoryImage: Joi.string()
    .uri()
    .required()
    .messages({
      'string.uri': 'Category image must be a valid URL',
      'any.required': 'Category image URL is required',
    }),

  createdAt: Joi.date().optional(),
  updatedAt: Joi.date().optional(),
});


module.exports = categorySchema;
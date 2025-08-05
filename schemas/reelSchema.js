const Joi = require('joi');

const createReelSchema = Joi.object({
  title: Joi.string().trim().required().messages({
    'string.empty': 'Title is required',
    'any.required': 'Title is required',
  }),

  videoUrl: Joi.string().trim().required().uri().messages({
    'string.empty': 'Video URL is required',
    'any.required': 'Video URL is required',
    'string.uri': 'Video URL must be a valid URL',
  }),
  thumbnail: Joi.string().trim().required().uri().messages({
    'string.empty': 'Thumbnail is required',
    'any.required': 'Thumbnail is required',
    'string.uri': 'Thumbnail must be a valid URL',
  }),
  isVideo: Joi.boolean().default(true),
  isActive: Joi.boolean().default(true),
  description: Joi.string().trim().allow('').messages({
    'string.empty': 'Description cannot be empty',
  }),
  tags: Joi.array().items(Joi.string().trim()).messages({
    'array.base': 'Tags must be an array',
  }),
  order: Joi.number().integer().min(0).default(0).messages({
    'number.base': 'Order must be a number',
    'number.integer': 'Order must be an integer',
    'number.min': 'Order must be 0 or greater',
  }),
});

const updateReelSchema = Joi.object({
  title: Joi.string().trim().messages({
    'string.empty': 'Title cannot be empty',
  }),
  videoUrl: Joi.string().trim().uri().messages({
    'string.empty': 'Video URL cannot be empty',
    'string.uri': 'Video URL must be a valid URL',
  }),
  thumbnail: Joi.string().trim().uri().messages({
    'string.empty': 'Thumbnail is required',
    'any.required': 'Thumbnail is required',
    'string.uri': 'Thumbnail must be a valid URL',
  }),
  isVideo: Joi.boolean(),
  isActive: Joi.boolean(),
  description: Joi.string().trim().allow('').messages({
    'string.empty': 'Description cannot be empty',
  }),
  tags: Joi.array().items(Joi.string().trim()).messages({
    'array.base': 'Tags must be an array',
  }),
  order: Joi.number().integer().min(0).messages({
    'number.base': 'Order must be a number',
    'number.integer': 'Order must be an integer',
    'number.min': 'Order must be 0 or greater',
  }),
});

module.exports = {
  createReelSchema,
  updateReelSchema,
}; 
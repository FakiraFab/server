/**
 * Blog Validation Schema
 * Uses Joi for robust request body validation
 */

const Joi = require('joi');

/**
 * Validation schema for creating a new blog
 * @type {Object}
 */
const blogCreateSchema = Joi.object({
  title: Joi.string()
    .trim()
    .required()
    .min(5)
    .max(300)
    .messages({
      'string.empty': 'Blog title is required',
      'string.min': 'Blog title must be at least 5 characters',
      'string.max': 'Blog title cannot exceed 300 characters',
    }),

  shortDescription: Joi.string()
    .trim()
    .required()
    .min(20)
    .max(500)
    .messages({
      'string.empty': 'Short description is required',
      'string.min': 'Short description must be at least 20 characters',
      'string.max': 'Short description cannot exceed 500 characters',
    }),

  content: Joi.string()
    .trim()
    .required()
    .min(30)
    .messages({
      'string.empty': 'Blog content is required',
      'string.min': 'Blog content must be at least 100 characters',
    }),

  metaTitle: Joi.string()
    .trim()
    .max(160)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Meta title cannot exceed 160 characters',
    }),

  metaDescription: Joi.string()
    .trim()
    .max(160)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Meta description cannot exceed 160 characters',
    }),

  metaKeywords: Joi.array()
    .items(Joi.string().trim())
    .max(10)
    .optional()
    .messages({
      'array.max': 'Maximum 10 keywords allowed',
    }),

  image: Joi.string()
    .trim()
    .uri()
    .optional()
    .allow('')
    .messages({
      'string.uri': 'Image must be a valid URL',
    }),

  author: Joi.string()
    .trim()
    .max(100)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Author name cannot exceed 100 characters',
    }),

  category: Joi.string()
    .trim()
    .optional()
    .allow('')
    .valid(
      'Styling Tips',
      'Product Guides',
      'Traditions',
      'DIY',
      'Care Tips',
      'Trending',
      'Fabric Guide',
      'Design Inspiration'
    )
    .messages({
      'any.only': 'Invalid blog category',
    }),

  tags: Joi.array()
    .items(Joi.string().trim().max(50))
    .optional()
    .messages({
      'array.base': 'Tags must be an array',
    }),

  published: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'Published must be a boolean',
    }),
});

/**
 * Validation schema for updating a blog
 * Allows partial updates (all fields optional)
 * @type {Object}
 */
const blogUpdateSchema = Joi.object({
  title: Joi.string()
    .trim()
    .optional()
    .min(5)
    .max(300)
    .messages({
      'string.min': 'Blog title must be at least 5 characters',
      'string.max': 'Blog title cannot exceed 300 characters',
    }),

  shortDescription: Joi.string()
    .trim()
    .optional()
    .min(20)
    .max(500)
    .messages({
      'string.min': 'Short description must be at least 20 characters',
      'string.max': 'Short description cannot exceed 500 characters',
    }),

  content: Joi.string()
    .trim()
    .optional()
    .min(100)
    .messages({
      'string.min': 'Blog content must be at least 100 characters',
    }),

  metaTitle: Joi.string()
    .trim()
    .max(160)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Meta title cannot exceed 160 characters',
    }),

  metaDescription: Joi.string()
    .trim()
    .max(160)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Meta description cannot exceed 160 characters',
    }),

  metaKeywords: Joi.array()
    .items(Joi.string().trim())
    .max(10)
    .optional()
    .messages({
      'array.max': 'Maximum 10 keywords allowed',
    }),

  image: Joi.string()
    .trim()
    .uri()
    .optional()
    .allow('')
    .messages({
      'string.uri': 'Image must be a valid URL',
    }),

  author: Joi.string()
    .trim()
    .max(100)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Author name cannot exceed 100 characters',
    }),

  category: Joi.string()
    .trim()
    .optional()
    .allow('')
    .valid(
      'Styling Tips',
      'Product Guides',
      'Traditions',
      'DIY',
      'Care Tips',
      'Trending',
      'Fabric Guide',
      'Design Inspiration'
    )
    .messages({
      'any.only': 'Invalid blog category',
    }),

  tags: Joi.array()
    .items(Joi.string().trim().max(50))
    .optional()
    .messages({
      'array.base': 'Tags must be an array',
    }),

  published: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'Published must be a boolean',
    }),
});

/**
 * Validation schema for publish status toggle
 * @type {Object}
 */
const publishStatusSchema = Joi.object({
  published: Joi.boolean()
    .required()
    .messages({
      'any.required': 'Published status is required',
      'boolean.base': 'Published must be a boolean',
    }),
});

module.exports = {
  blogCreateSchema,
  blogUpdateSchema,
  publishStatusSchema,
};

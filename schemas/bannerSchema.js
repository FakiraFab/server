const Joi = require('joi');

const createBannerSchema = Joi.object({
  title: Joi.string().trim().required().messages({
    'string.empty': 'Title is required',
    'any.required': 'Title is required',
  }),
  image: Joi.string().trim().required().messages({
    'string.empty': 'Image URL is required',
    'any.required': 'Image URL is required',
  }),
  link: Joi.string().trim().allow('').uri().messages({
    'string.uri': 'Link must be a valid URL',
  }),
  isActive: Joi.boolean().default(true),
});

const updateBannerSchema = Joi.object({
  title: Joi.string().trim().messages({
    'string.empty': 'Title cannot be empty',
  }),
  image: Joi.string().trim().messages({
    'string.empty': 'Image URL cannot be empty',
  }),
  link: Joi.string().trim().allow('').uri().messages({
    'string.uri': 'Link must be a valid URL',
  }),
  isActive: Joi.boolean(),
});

module.exports = {
  createBannerSchema,
  updateBannerSchema,
};

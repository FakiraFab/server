const Joi = require('joi');

const createBannerSchema = Joi.object({
  title: Joi.string().trim().required().messages({
    'string.empty': 'Title is required',
    'any.required': 'Title is required',
  }),
  imageDesktop: Joi.string().trim().required().messages({
    'string.empty': 'Desktop image URL is required',
    'any.required': 'Desktop image URL is required',
  }),
  imageMobile:Joi.string().trim().allow(null,'').messages({
    'string.empty':'Mobile image URL cannot be empty if provided',
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
  imageDesktop: Joi.string().trim().messages({
    'string.empty': 'Desktop image URL cannot be empty',
  }),
  imageMobile:Joi.string().trim().allow(null,'').messages({
    'string.empty':'Mobile image URL cannot be empty if provided',
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

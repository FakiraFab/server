const Joi = require('joi');

const createAddressSchema = Joi.object({
  fullName: Joi.string()
    .max(100)
    .required()
    .messages({
      'string.max': 'Full name cannot exceed 100 characters',
      'any.required': 'Full name is required'
    }),
  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      'string.pattern.base': 'Please provide a valid 10-digit phone number',
      'any.required': 'Phone number is required'
    }),
  addressLine1: Joi.string()
    .max(200)
    .required()
    .messages({
      'string.max': 'Address line 1 cannot exceed 200 characters',
      'any.required': 'Address line 1 is required'
    }),
  addressLine2: Joi.string()
    .max(200)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Address line 2 cannot exceed 200 characters'
    }),
  city: Joi.string()
    .max(50)
    .required()
    .messages({
      'string.max': 'City name cannot exceed 50 characters',
      'any.required': 'City is required'
    }),
  state: Joi.string()
    .max(50)
    .required()
    .messages({
      'string.max': 'State name cannot exceed 50 characters',
      'any.required': 'State is required'
    }),
  country: Joi.string()
    .optional()
    .default('India'),
  postalCode: Joi.string()
    .pattern(/^[0-9]{6}$/)
    .required()
    .messages({
      'string.pattern.base': 'Please provide a valid 6-digit postal code',
      'any.required': 'Postal code is required'
    }),
  addressType: Joi.string()
    .valid('home', 'work', 'other')
    .optional()
    .default('home')
    .messages({
      'any.only': 'Address type must be one of: home, work, other'
    }),
  isDefault: Joi.boolean()
    .optional()
    .default(false)
});

const updateAddressSchema = Joi.object({
  fullName: Joi.string()
    .max(100)
    .optional()
    .messages({
      'string.max': 'Full name cannot exceed 100 characters'
    }),
  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Please provide a valid 10-digit phone number'
    }),
  addressLine1: Joi.string()
    .max(200)
    .optional()
    .messages({
      'string.max': 'Address line 1 cannot exceed 200 characters'
    }),
  addressLine2: Joi.string()
    .max(200)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Address line 2 cannot exceed 200 characters'
    }),
  city: Joi.string()
    .max(50)
    .optional()
    .messages({
      'string.max': 'City name cannot exceed 50 characters'
    }),
  state: Joi.string()
    .max(50)
    .optional()
    .messages({
      'string.max': 'State name cannot exceed 50 characters'
    }),
  country: Joi.string()
    .optional(),
  postalCode: Joi.string()
    .pattern(/^[0-9]{6}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Please provide a valid 6-digit postal code'
    }),
  addressType: Joi.string()
    .valid('home', 'work', 'other')
    .optional()
    .messages({
      'any.only': 'Address type must be one of: home, work, other'
    }),
  isDefault: Joi.boolean()
    .optional()
}).min(1).messages({
  'object.min': 'At least one field is required for update'
});

module.exports = {
  createAddressSchema,
  updateAddressSchema
};

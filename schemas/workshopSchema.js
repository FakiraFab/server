const Joi = require('joi');

const workshopSchema = Joi.object({
  name: Joi.string().trim().required().max(200).messages({
    'string.base': 'Workshop name must be a string',
    'string.empty': 'Workshop name is required',
    'string.max': 'Workshop name cannot exceed 200 characters',
    'any.required': 'Workshop name is required',
  }),
  description: Joi.string().trim().required().max(1000).messages({
    'string.base': 'Description must be a string',
    'string.empty': 'Description is required',
    'string.max': 'Description cannot exceed 1000 characters',
    'any.required': 'Description is required',
  }),
  dateTime: Joi.date().greater('now').required().messages({
    'date.base': 'Please provide a valid date and time',
    'date.greater': 'Workshop date and time must be in the future',
    'any.required': 'Workshop date and time is required',
  }),
  duration: Joi.string().trim().required().max(50).messages({
    'string.base': 'Duration must be a string',
    'string.empty': 'Duration is required',
    'string.max': 'Duration cannot exceed 50 characters',
    'any.required': 'Duration is required',
  }),
  maxParticipants: Joi.number().integer().min(1).required().messages({
    'number.base': 'Maximum participants must be a number',
    'number.integer': 'Maximum participants must be an integer',
    'number.min': 'Maximum participants must be at least 1',
    'any.required': 'Maximum participants is required',
  }),
  price: Joi.number().min(0).required().messages({
    'number.base': 'Price must be a number',
    'number.min': 'Price cannot be negative',
    'any.required': 'Price is required',
  }),
  location: Joi.string().trim().required().max(200).messages({
    'string.base': 'Location must be a string',
    'string.empty': 'Location is required',
    'string.max': 'Location cannot exceed 200 characters',
    'any.required': 'Location is required',
  }),
  requirements: Joi.string().trim().allow('').max(1000).messages({
    'string.base': 'Requirements must be a string',
    'string.max': 'Requirements cannot exceed 1000 characters',
  }),
  status: Joi.string().valid('Upcoming', 'Ongoing', 'Completed', 'Cancelled').default('Upcoming').messages({
    'string.base': 'Status must be a string',
    'any.only': 'Status must be one of Upcoming, Ongoing, Completed, or Cancelled',
  }),
});

module.exports = workshopSchema;

const Joi = require('joi');

const workshopRegistrationSchema = Joi.object({
  workshopId: Joi.string().required().messages({
    'string.base': 'Workshop ID must be a string',
    'string.empty': 'Workshop ID is required',
    'any.required': 'Workshop ID is required',
  }),
  fullName: Joi.string().trim().required().max(100).messages({
    'string.base': 'Full name must be a string',
    'string.empty': 'Full name is required',
    'string.max': 'Full name cannot exceed 100 characters',
    'any.required': 'Full name is required',
  }),
  age: Joi.number().integer().min(10).max(30).required().messages({
    'number.base': 'Age must be a number',
    'number.integer': 'Age must be an integer',
    'number.min': 'Age must be at least 10 years',
    'number.max': 'Age cannot exceed 30 years',
    'any.required': 'Age is required',
  }),
  institution: Joi.string().trim().required().max(200).messages({
    'string.base': 'Institution name must be a string',
    'string.empty': 'Institution name is required',
    'string.max': 'Institution name cannot exceed 200 characters',
    'any.required': 'Institution name is required',
  }),
  educationLevel: Joi.string().valid('High School','School', 'College', 'University','Other').required().messages({
    'string.base': 'Education level must be a string',
    'any.only': 'Education level must be one of School, College, or University',
    'any.required': 'Education level is required',
  }),
  email: Joi.string().trim().email().required().messages({
    'string.base': 'Email must be a string',
    'string.empty': 'Email is required',
    'string.email': 'Please enter a valid email address',
    'any.required': 'Email is required',
  }),
  contactNumber: Joi.string().trim().required().pattern(/^\+?[1-9]\d{1,14}$/).messages({
    'string.base': 'Contact number must be a string',
    'string.empty': 'Contact number is required',
    'string.pattern.base': 'Please enter a valid contact number',
    'any.required': 'Contact number is required',
  }),
  workshopName: Joi.string().trim().optional().messages({
    'string.base': 'Workshop name must be a string',
  }),
  status: Joi.string().valid('Pending', 'Approved', 'Rejected').optional().messages({
    'string.base': 'Status must be a string',
    'any.only': 'Status must be one of Pending, Approved ,Rejected',
  }),
  specialRequirements: Joi.string().trim().max(500).allow('').optional().messages({
    'string.base': 'Special requirements must be a string',
    'string.max': 'Special requirements cannot exceed 500 characters',
  }),
});

// Schema for updates - only validates the fields being updated
const workshopRegistrationUpdateSchema = Joi.object({
  fullName: Joi.string().trim().optional().max(100).messages({
    'string.base': 'Full name must be a string',
    'string.max': 'Full name cannot exceed 100 characters',
  }),
  age: Joi.number().integer().min(10).max(30).optional().messages({
    'number.base': 'Age must be a number',
    'number.integer': 'Age must be an integer',
    'number.min': 'Age must be at least 10 years',
    'number.max': 'Age cannot exceed 30 years',
  }),
  institution: Joi.string().trim().optional().max(200).messages({
    'string.base': 'Institution name must be a string',
    'string.max': 'Institution name cannot exceed 200 characters',
  }),
  educationLevel: Joi.string().valid('High School','School', 'College', 'University','Other').optional().messages({
    'string.base': 'Education level must be a string',
    'any.only': 'Education level must be one of School, College, or University',
  }),
  email: Joi.string().trim().email().optional().messages({
    'string.base': 'Email must be a string',
    'string.email': 'Please enter a valid email address',
  }),
  contactNumber: Joi.string().trim().optional().pattern(/^\+?[1-9]\d{1,14}$/).messages({
    'string.base': 'Contact number must be a string',
    'string.pattern.base': 'Please enter a valid contact number',
  }),
  workshopName: Joi.string().trim().optional().messages({
    'string.base': 'Workshop name must be a string',
  }),
  status: Joi.string().valid('Pending', 'Approved', 'Rejected').optional().messages({
    'string.base': 'Status must be a string',
    'any.only': 'Status must be one of Pending, Approved, Rejected',
  }),
  specialRequirements: Joi.string().trim().max(500).allow('').optional().messages({
    'string.base': 'Special requirements must be a string',
    'string.max': 'Special requirements cannot exceed 500 characters',
  }),
});

module.exports = { workshopRegistrationSchema, workshopRegistrationUpdateSchema };

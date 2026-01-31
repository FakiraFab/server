const { ErrorMessages, StatusCodes } = require('../utils/errorMessages');
const { AppError } = require('./errorHandler');

/**
 * Middleware to validate route parameters
 * @param {Object} options - Validation options
 * @returns {Function} Express middleware
 */
const validateParams = (options = {}) => {
    return (req, res, next) => {
        try {
            const params = req.params;
            
            // Check if params is empty when it shouldn't be
            if (options.requireParams && Object.keys(params).length === 0) {
                return next(new AppError(
                    'Required route parameters are missing',
                    StatusCodes.BAD_REQUEST
                ));
            }

            // Validate MongoDB ObjectId format if present
            if (params.id) {
                if (!/^[0-9a-fA-F]{24}$/.test(params.id)) {
                    return next(new AppError(
                        ErrorMessages.INVALID_ID('resource'),
                        StatusCodes.BAD_REQUEST
                    ));
                }
            }

            next();
        } catch (error) {
            // Catch any path-to-regexp or other parsing errors
            console.error('Route parameter validation error:', error);
            return next(new AppError(
                'Invalid route format',
                StatusCodes.BAD_REQUEST
            ));
        }
    };
};

module.exports = validateParams;
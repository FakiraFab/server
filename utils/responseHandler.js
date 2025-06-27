/**
 * Utility functions for standardizing API responses
 */

const { StatusCodes } = require('./errorMessages');

class ResponseHandler {
    /**
     * Send success response
     * @param {Object} res - Express response object
     * @param {number} statusCode - HTTP status code
     * @param {string} message - Success message
     * @param {Object} data - Response data
     * @param {Object} meta - Additional metadata (optional)
     */
    static success(res, { statusCode = StatusCodes.OK, message = 'Success', data = null, meta = null }) {
        const response = {
            success: true,
            message,
            data
        };

        if (meta) {
            response.meta = meta;
        }

        res.status(statusCode).json(response);
    }

    /**
     * Send paginated response
     * @param {Object} res - Express response object
     * @param {Object} data - Response data
     * @param {number} page - Current page number
     * @param {number} limit - Items per page
     * @param {number} total - Total number of items
     * @param {string} message - Success message (optional)
     */
    static paginated(res, { data, page, limit, total, message = 'Success' }) {
        res.status(StatusCodes.OK).json({
            success: true,
            message,
            data,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
                limit: parseInt(limit)
            }
        });
    }

    /**
     * Send created response
     * @param {Object} res - Express response object
     * @param {Object} data - Created resource data
     * @param {string} message - Success message (optional)
     */
    static created(res, data, message = 'Resource created successfully') {
        res.status(StatusCodes.CREATED).json({
            success: true,
            message,
            data
        });
    }

    /**
     * Send deleted response
     * @param {Object} res - Express response object
     * @param {string} message - Success message (optional)
     */
    static deleted(res, message = 'Resource deleted successfully') {
        res.status(StatusCodes.OK).json({
            success: true,
            message
        });
    }
}

module.exports = ResponseHandler;
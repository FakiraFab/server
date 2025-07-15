/**
 * Centralized error messages for consistent error handling
 */

const ErrorTypes = {
    VALIDATION: 'VALIDATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    DUPLICATE: 'DUPLICATE_ERROR',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    SERVER_ERROR: 'SERVER_ERROR'
};

const ErrorMessages = {
    // Authentication errors
    INVALID_TOKEN: 'Invalid authentication token',
    TOKEN_EXPIRED: 'Authentication token has expired',
    NOT_AUTHENTICATED: 'You are not authenticated',
    NOT_AUTHORIZED: 'You are not authorized to perform this action',

    // Resource errors
    RESOURCE_NOT_FOUND: (resource) => `${resource} not found`,
    RESOURCE_EXISTS: (resource) => `${resource} already exists`,
    INVALID_ID: (resource) => `Invalid ${resource} ID format`,
    REQUIRED_FIELD: (field) => `${field} is required`,

    // Validation errors
    INVALID_INPUT: 'Invalid input data',
    INVALID_CREDENTIALS: 'Invalid email or password',
    INVALID_FORMAT: (field) => `Invalid ${field} format`,

    // Database errors
    DB_CONNECTION_ERROR: 'Database connection error',
    DUPLICATE_KEY: (field) => `${field} already exists`,

    // Server errors
    INTERNAL_SERVER_ERROR: 'Internal server error',
    SERVICE_UNAVAILABLE: 'Service temporarily unavailable'
};

const StatusCodes = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER: 500,
    SERVICE_UNAVAILABLE: 503
};

module.exports = {
    ErrorTypes,
    ErrorMessages,
    StatusCodes
};
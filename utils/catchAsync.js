/**
 * Wrapper function to eliminate try-catch blocks in async functions
 * @param {Function} fn - Async function to be wrapped
 * @returns {Function} Express middleware function
 */
const catchAsync = fn => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

module.exports = catchAsync;
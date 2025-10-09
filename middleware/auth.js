const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
  try {
    // console.log('Auth middleware - URL:', req.originalUrl, 'Path:', req.path);
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new Error('Authentication required');
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user data to request
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

module.exports = auth;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const loginAdmin = async (req, res, next) => {
  try {
    const { password } = req.body;
    
    // Verify password against hashed password in env
    const isMatch = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid password' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return response matching frontend expectations
    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: '1',
          name: 'Andre tate',
          role: 'Admin',
          avatar: '/shape.png'
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { loginAdmin };
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Coordinator = require('../models/Coordinator');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// Verify JWT token middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Try to find user in Users collection first, then fall back to Coordinators
    let user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      // Fallback to Coordinator model for backward compatibility
      user = await Coordinator.findById(decoded.userId).select('-password');
    }

    if (!user) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid token - user not found'
      });
    }

    if (user.isActive === false) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Account is deactivated'
      });
    }

    // Normalize user object for compatibility
    req.user = {
      _id: user._id,
      username: user.email || user.username,
      email: user.email,
      firstName: user.fullName ? user.fullName.split(' ')[0] : user.firstName,
      lastName: user.fullName ? user.fullName.split(' ').slice(1).join(' ') : user.lastName,
      role: user.role,
      department: user.collegeName || user.department || 'N/A',
      phoneNumber: user.mobile || user.phoneNumber,
      isActive: user.isActive
    };
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Token expired'
      });
    }
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Error verifying token'
    });
  }
};

// Check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Access denied',
      message: 'Admin privileges required'
    });
  }
  next();
};

module.exports = authenticateToken;
module.exports.generateToken = generateToken;
module.exports.authenticateToken = authenticateToken;
module.exports.requireAdmin = requireAdmin;
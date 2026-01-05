const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Coordinator = require('../models/Coordinator');
const { generateToken, authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Validation middleware
const validateLogin = [
  body('username')
    .notEmpty()
    .withMessage('Email or mobile is required')
    .trim(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const validateRegister = [
  body('fullName')
    .notEmpty()
    .withMessage('Full name is required')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Full name cannot exceed 100 characters'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('mobile')
    .optional()
    .trim(),
  body('collegeName')
    .optional()
    .trim()
];

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', validateLogin, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      message: errors.array()[0].msg,
      errors: errors.array()
    });
  }

  const { username, password } = req.body;

  // Find user by email or mobile in users collection
  const user = await User.findOne({
    $or: [
      { email: username.toLowerCase() },
      { mobile: username }
    ]
  });

  // If user not found in Users collection, try Coordinator collection (backwards compatibility)
  let authEntity = user;
  let isCoordinator = false;

  if (!authEntity) {
    authEntity = await Coordinator.findOne({
      $or: [
        { username: username },
        { email: username.toLowerCase() }
      ]
    });
    isCoordinator = !!authEntity;
  }

  if (!authEntity) {
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid credentials'
    });
  }

  // Check if account is active
  if (authEntity.isActive === false) {
    return res.status(401).json({
      error: 'Account deactivated',
      message: 'Your account has been deactivated. Please contact admin.'
    });
  }

  // Verify password (both models implement comparePassword)
  const isPasswordValid = await authEntity.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid credentials'
    });
  }

  // Update last login
  if (typeof authEntity.updateLastLogin === 'function') {
    await authEntity.updateLastLogin();
  }

  // Generate token
  const token = generateToken(authEntity._id);

  // Normalize response to coordinator format for frontend
  const coordinatorData = isCoordinator ? {
    _id: authEntity._id,
    username: authEntity.username,
    email: authEntity.email,
    firstName: authEntity.firstName,
    lastName: authEntity.lastName,
    role: authEntity.role,
    department: authEntity.department || 'N/A',
    phoneNumber: authEntity.phoneNumber,
    isActive: authEntity.isActive
  } : {
    _id: authEntity._id,
    username: authEntity.email,
    email: authEntity.email,
    firstName: authEntity.fullName.split(' ')[0] || authEntity.fullName,
    lastName: authEntity.fullName.split(' ').slice(1).join(' ') || '',
    role: authEntity.role,
    department: authEntity.collegeName || 'N/A',
    phoneNumber: authEntity.mobile,
    isActive: authEntity.isActive
  };

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      coordinator: coordinatorData,
      token,
      expiresIn: process.env.JWT_EXPIRES_IN
    }
  });
}));

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', validateRegister, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      message: errors.array()[0].msg,
      errors: errors.array()
    });
  }

  const { fullName, email, password, mobile, collegeName, gender, dob } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [
      { email: email.toLowerCase() },
      { mobile: mobile }
    ].filter(condition => Object.values(condition)[0]) // Filter out empty values
  });

  if (existingUser) {
    return res.status(400).json({
      error: 'Registration failed',
      message: 'Email or mobile already exists'
    });
  }

  // Create new user
  const user = new User({
    fullName,
    email: email.toLowerCase(),
    password,
    mobile,
    collegeName,
    gender,
    dob,
    role: 'coordinator',
    isActive: true
  });

  await user.save();

  // Generate token
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      coordinator: {
        _id: user._id,
        username: user.email,
        email: user.email,
        firstName: user.fullName.split(' ')[0] || user.fullName,
        lastName: user.fullName.split(' ').slice(1).join(' ') || '',
        role: user.role,
        department: user.collegeName || 'N/A',
        phoneNumber: user.mobile,
        isActive: user.isActive
      },
      token,
      expiresIn: process.env.JWT_EXPIRES_IN
    }
  });
}));

// @desc    Get current coordinator profile
// @route   GET /api/auth/me
// @access  Private
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      coordinator: req.user
    }
  });
}));

// @desc    Logout coordinator
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', authenticateToken, asyncHandler(async (req, res) => {
  // In a real application, you might want to blacklist the token
  // For now, we'll just send a success response
  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
}));

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Private
router.post('/refresh', authenticateToken, asyncHandler(async (req, res) => {
  // Generate new token
  const token = generateToken(req.user._id);

  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      token,
      expiresIn: process.env.JWT_EXPIRES_IN
    }
  });
}));

module.exports = router;
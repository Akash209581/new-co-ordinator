const express = require('express');
const router = express.Router();
const Visitor = require('../models/Visitor');
const auth = require('../middleware/auth');
const asyncHandler = require('express-async-handler');

// Register a new visitor
router.post('/register', auth, asyncHandler(async (req, res) => {
  const { name, phoneNumber } = req.body;

  // Validate required fields
  if (!name || !phoneNumber) {
    return res.status(400).json({
      success: false,
      message: 'Name and phone number are required'
    });
  }

  // Check if visitor with same phone number already registered
  const existingVisitor = await Visitor.findOne({ phoneNumber });
  if (existingVisitor) {
    return res.status(400).json({
      success: false,
      message: 'A visitor with this phone number is already registered'
    });
  }

  // Create new visitor
  const visitor = new Visitor({
    name,
    phoneNumber
  });

  await visitor.save();

  res.status(201).json({
    success: true,
    message: 'Visitor registered successfully',
    visitor: {
      id: visitor._id,
      name: visitor.name,
      phoneNumber: visitor.phoneNumber,
      registeredAt: visitor.registeredAt
    }
  });
}));

// Get all visitors
router.get('/', auth, asyncHandler(async (req, res) => {
  const visitors = await Visitor.find()
    .sort({ registeredAt: -1 })
    .lean();

  res.json({
    success: true,
    count: visitors.length,
    visitors
  });
}));

// Get visitor by ID
router.get('/:id', auth, asyncHandler(async (req, res) => {
  const visitor = await Visitor.findById(req.params.id);

  if (!visitor) {
    return res.status(404).json({
      success: false,
      message: 'Visitor not found'
    });
  }

  res.json({
    success: true,
    visitor
  });
}));

// Delete visitor
router.delete('/:id', auth, asyncHandler(async (req, res) => {
  const visitor = await Visitor.findById(req.params.id);

  if (!visitor) {
    return res.status(404).json({
      success: false,
      message: 'Visitor not found'
    });
  }

  await Visitor.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Visitor deleted successfully'
  });
}));

module.exports = router;

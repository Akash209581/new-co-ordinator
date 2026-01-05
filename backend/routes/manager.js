const express = require('express');
const Participant = require('../models/Participant');

const router = express.Router();

// Basic auth middleware restricted to the manager account
const managerAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const [scheme, encoded] = authHeader.split(' ');

  if (scheme !== 'Basic' || !encoded) {
    res.set('WWW-Authenticate', 'Basic realm="Manager Portal"');
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Provide Basic credentials as Akash / Akash'
    });
  }

  const [username, password] = Buffer.from(encoded, 'base64').toString().split(':');

  if (username !== 'Akash' || password !== 'Akash') {
    res.set('WWW-Authenticate', 'Basic realm="Manager Portal"');
    return res.status(401).json({
      error: 'Invalid credentials',
      message: 'Manager access denied'
    });
  }

  req.manager = { username };
  return next();
};

// Quick helper endpoint to confirm access
router.get('/', managerAuth, (req, res) => {
  res.json({
    message: 'Manager access granted',
    endpoints: ['/manager/paid', '/manager/unpay/:participantId']
  });
});

// List all paid participants (tolerant of casing and partial payments)
router.get('/paid', managerAuth, async (req, res) => {
  try {
    const paidParticipants = await Participant.find({
      $or: [
        { paymentStatus: { $in: ['paid', 'Paid', 'PAID'] } },
        { paidAmount: { $gt: 0 } },
        { $expr: { $and: [ { $gt: ['$paidAmount', 0] }, { $gte: ['$paidAmount', '$paymentAmount'] } ] } }
      ]
    })
      .populate('eventId', 'title registrationFee')
      .sort({ paymentDate: -1, updatedAt: -1 })
      .lean();

    const formatted = paidParticipants.map((participant) => ({
      participantId: participant.participantId,
      name: participant.name,
      email: participant.email,
      phoneNumber: participant.phoneNumber,
      college: participant.college,
      department: participant.department,
      event: participant.eventId ? participant.eventId.title : 'No Event',
      paymentAmount: participant.paymentAmount,
      paidAmount: participant.paidAmount,
      paymentDate: participant.paymentDate,
      paymentMethod: participant.paymentMethod,
      paymentNotes: participant.paymentNotes || '',
      submittedAt: participant.submittedAt,
      paymentStatus: participant.paymentStatus
    }));

    return res.json({
      success: true,
      count: formatted.length,
      participants: formatted
    });
  } catch (error) {
    console.error('Error fetching paid participants (manager):', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch paid participants'
    });
  }
});

// Revert a paid participant back to unpaid
router.patch('/unpay/:participantId', managerAuth, async (req, res) => {
  try {
    const participantId = (req.params.participantId || '').toUpperCase();

    const participant = await Participant.findOne({ participantId });
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found'
      });
    }

    if (participant.paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Participant is not marked as paid'
      });
    }

    participant.paymentStatus = 'pending';
    participant.paidAmount = 0;
    participant.paymentDate = null;
    participant.paymentMethod = null;
    participant.paymentNotes = 'Reverted to unpaid by manager';
    participant.processedBy = null;

    await participant.save();

    return res.json({
      success: true,
      message: 'Payment status reverted to unpaid',
      participant: {
        participantId: participant.participantId,
        paymentStatus: participant.paymentStatus,
        paidAmount: participant.paidAmount,
        paymentDate: participant.paymentDate,
        paymentMethod: participant.paymentMethod,
        paymentNotes: participant.paymentNotes
      }
    });
  } catch (error) {
    console.error('Error reverting participant to unpaid (manager):', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to revert participant to unpaid'
    });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticateToken: auth } = require('../middleware/auth');
const Event = require('../models/Event');

// NOTE: /events route moved to coordinator.js to avoid conflicts
// This router now only handles /events/register

// @desc    Register user for selected events
// @route   POST /api/coordinator/events/register
// @access  Private
router.post('/events/register', auth, async (req, res) => {
  try {
    const { userId, eventIds } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one event must be selected'
      });
    }

    // Fetch the events to get event details
    const events = await Event.find({ 
      _id: { $in: eventIds },
      isActive: true 
    });

    if (events.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No valid events found'
      });
    }

    if (events.length !== eventIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some selected events are not valid or inactive'
      });
    }

    // Access the participants collection directly
    const db = mongoose.connection.db;
    const participantsCollection = db.collection('participants');

    // Find the participant by userId
    const participant = await participantsCollection.findOne({ userId: userId });

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found'
      });
    }

    // Prepare the registered events array
    const registeredEvents = events.map(event => ({
      eventId: event._id.toString(),
      eventName: event.title,
      eventType: 'event',
      category: event.category,
      fee: 0, // You can set fee logic here if needed
      registeredAt: new Date()
    }));

    // Check if participant already has registered events
    const existingEvents = participant.registeredEvents || [];
    
    // Filter out events that are already registered
    const newEvents = registeredEvents.filter(newEvent => 
      !existingEvents.some(existing => 
        existing.eventId === newEvent.eventId || 
        existing.eventName === newEvent.eventName
      )
    );

    if (newEvents.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'All selected events are already registered'
      });
    }

    // Merge existing and new events
    const updatedEvents = [...existingEvents, ...newEvents];

    // Update the participant with registered events
    const result = await participantsCollection.updateOne(
      { userId: userId },
      { 
        $set: { 
          registeredEvents: updatedEvents,
          updatedAt: new Date()
        } 
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update participant registration'
      });
    }

    // Get event names for response
    const eventNames = newEvents.map(e => e.eventName);

    res.json({
      success: true,
      message: `Successfully registered for ${newEvents.length} event(s)`,
      registeredCount: newEvents.length,
      eventNames: eventNames,
      allRegisteredEvents: updatedEvents
    });

  } catch (error) {
    console.error('Error registering for events:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while registering for events',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

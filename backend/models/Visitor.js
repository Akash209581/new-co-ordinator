const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[0-9]{10}$/.test(v);
      },
      message: props => `${props.value} is not a valid 10-digit phone number!`
    }
  },
  registeredAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
visitorSchema.index({ phoneNumber: 1 });
visitorSchema.index({ registeredAt: -1 });

module.exports = mongoose.model('Visitor', visitorSchema);

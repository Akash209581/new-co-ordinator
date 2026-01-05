const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  dob: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    default: 'Other'
  },
  collegeName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  mobile: {
    type: String,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  role: {
    type: String,
    enum: ['user', 'coordinator', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginAt: {
    type: Date,
    default: null
  },
  lastLogoutAt: {
    type: Date,
    default: null
  },
  loginHistory: [{
    loginAt: Date,
    logoutAt: Date,
    ipAddress: String
  }]
}, {
  timestamps: true
});

// Hash password before saving (only if password is modified)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLoginAt = new Date();
  return this.save();
};

module.exports = mongoose.model('User', userSchema);

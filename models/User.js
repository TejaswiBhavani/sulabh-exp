const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['citizen', 'admin', 'department'],
    default: 'citizen'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  },
  sessions: [{
    sessionId: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    }
  }]
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Clean expired sessions
userSchema.methods.cleanExpiredSessions = function() {
  this.sessions = this.sessions.filter(session => session.expiresAt > new Date());
  return this.save();
};

// Add session
userSchema.methods.addSession = function(sessionId) {
  this.sessions.push({
    sessionId,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
  });
  return this.save();
};

// Remove session
userSchema.methods.removeSession = function(sessionId) {
  this.sessions = this.sessions.filter(session => session.sessionId !== sessionId);
  return this.save();
};

// Touch/extend session for rolling behavior
userSchema.methods.touchSession = function(sessionId) {
  const session = this.sessions.find(session => session.sessionId === sessionId);
  if (session) {
    // Check if this is a long-term session (30 days) or short-term (5 minutes)
    const now = new Date();
    const originalExpiry = session.expiresAt;
    const timeDiff = originalExpiry.getTime() - now.getTime();
    
    // If session was set to expire in more than 1 day, it's a "remember me" session
    if (timeDiff > 24 * 60 * 60 * 1000) {
      // Extend by 30 days for remember me sessions
      session.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    } else {
      // Extend by 5 minutes for regular sessions
      session.expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    }
    return this.save();
  }
  return Promise.resolve(this);
};

module.exports = mongoose.model('User', userSchema);
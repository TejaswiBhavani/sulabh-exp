const mongoose = require('mongoose');

const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/team48db';

mongoose.connect(mongoUrl)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

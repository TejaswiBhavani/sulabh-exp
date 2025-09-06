const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/team48db';

mongoose.connect(mongoUrl)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// API routes would go here
app.get('/api', (req, res) => {
  res.json({ message: 'SULABH Grievance System API' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

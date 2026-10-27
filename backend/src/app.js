const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const receptionRoutes = require('./routes/receptionRoutes');
const nurseRoutes = require('./routes/nurseRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API v1 routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', hospitalRoutes);
app.use('/api/v1', doctorRoutes);
app.use('/api/v1', appointmentRoutes);
app.use('/api/v1/reception', receptionRoutes);
app.use('/api/v1/nurse', nurseRoutes);
app.use('/api/v1/admin', adminRoutes);

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ status: 'fail', message: `Route ${req.originalUrl} not found` });
});

// Centralized error handling
app.use(errorHandler);

module.exports = app;


import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import connectDB from './config/db.js';

// =====================================
// EXISTING APPLICATION ROUTES
// =====================================

import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import analyticsRoutes from './routes/analytics.js';
import orderRoutes from './routes/orders.js';

// =====================================
// IOT ROUTES
// =====================================

import iotRoutes from './routes/iot.js';

// =====================================
// AI CLASSIFICATION ROUTES
// =====================================

import aiRoutes from './routes/ai.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// =====================================
// MIDDLEWARE
// =====================================

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000'
  ],
  methods: [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS'
  ],
  allowedHeaders: [
    'Content-Type',
    'Authorization'
  ]
}));

// Request body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({
  extended: true,
  limit: '10mb'
}));

// =====================================
// MAIN API HEALTH CHECK
// GET /api/health
// =====================================

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Water Lily Handicrafts API is running',
    status: 'online',
    services: {
      backend: 'online',
      mongodb: 'connected',
      iot: 'registered',
      ai: 'registered'
    },
    timestamp: new Date().toISOString()
  });
});

// =====================================
// EXISTING APPLICATION API ROUTES
// =====================================

// Authentication
app.use('/api/auth', authRoutes);

// Products
app.use('/api/products', productRoutes);

// Analytics
app.use('/api/analytics', analyticsRoutes);

// Orders
app.use('/api/orders', orderRoutes);

// =====================================
// IOT API ROUTES
// =====================================

app.use('/api/iot', iotRoutes);

// =====================================
// AI CLASSIFICATION API ROUTES
// =====================================

// AI health
// GET /api/ai/health

// Manual image classification
// POST /api/ai/predict

// ESP32-CAM live image classification
// GET /api/ai/live

app.use('/api/ai', aiRoutes);

// =====================================
// 404 HANDLER
// =====================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// =====================================
// GLOBAL ERROR HANDLER
// =====================================

app.use((err, req, res, next) => {
  console.error('API Error:', err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// =====================================
// START SERVER
// =====================================

const startServer = async () => {
  try {
    // Connect to MongoDB before starting Express
    await connectDB();

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('');
      console.log('========================================');
      console.log('     WATER LILY HANDICRAFTS BACKEND');
      console.log('========================================');

      console.log('');
      console.log('SERVER INFORMATION');
      console.log(`Backend:        http://localhost:${PORT}`);
      console.log(`Health check:   http://localhost:${PORT}/api/health`);

      console.log('');
      console.log('EXISTING APPLICATION ROUTES');
      console.log(`Auth:           http://localhost:${PORT}/api/auth`);
      console.log(`Products:       http://localhost:${PORT}/api/products`);
      console.log(`Analytics:      http://localhost:${PORT}/api/analytics`);
      console.log(`Orders:         http://localhost:${PORT}/api/orders`);

      console.log('');
      console.log('IOT API ROUTES');
      console.log(`Sensors:        http://localhost:${PORT}/api/iot/sensors`);
      console.log(`Servos:         http://localhost:${PORT}/api/iot/servos`);
      console.log(`Dashboard:      http://localhost:${PORT}/api/iot/state`);
      console.log('Servo control:  POST /api/iot/servos/:servoId');
      console.log('Save settings:  PATCH /api/iot/state');
      console.log('Start:          POST /api/iot/operations/:operation/start');
      console.log('Stop:           POST /api/iot/operations/:operation/stop');

      console.log('');
      console.log('AI CLASSIFICATION ROUTES');
      console.log(`AI health:      http://localhost:${PORT}/api/ai/health`);
      console.log(`AI prediction:  POST http://localhost:${PORT}/api/ai/predict`);
      console.log(`Live AI:        http://localhost:${PORT}/api/ai/live`);

      console.log('');
      console.log('AI CONFIGURATION');
      console.log('Model:          See /api/ai/health');
      console.log('Classes:        Healthy / Moldy');
      console.log('Camera:         ESP32-CAM');
      console.log('Camera IP:      10.58.179.102');
      console.log('Python AI:      http://127.0.0.1:8000');

      console.log('');
      console.log('========================================');
      console.log('     BACKEND STARTED SUCCESSFULLY');
      console.log('========================================');
      console.log('');
    });

    server.on('error', (error) => {
      console.error('Express server error:', error);
    });

  } catch (error) {
    console.error('========================================');
    console.error('FAILED TO START BACKEND');
    console.error('Error:', error.message);
    console.error('========================================');

    process.exit(1);
  }
};

// Start application
startServer();

export default app;

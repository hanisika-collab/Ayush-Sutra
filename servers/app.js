require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

// Create express app & server (required for socket.io)
const app = express();
const server = http.createServer(app);

// ------------------- MIDDLEWARE ------------------- //
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());

// ------------------- CORS ------------------- //
const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ------------------- RATE LIMIT ------------------- //
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
});
app.use(limiter);

// ------------------- REQUEST LOGGER ------------------- //
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ------------------- MONGO CONNECTION ------------------- //
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('✅ MongoDB Connected');

    // ✅ Email config check (optional)
    try {
      const { verifyEmailConfig } = require('./services/emailService');
      verifyEmailConfig().catch(err => {
        console.log('⚠️ Email service not configured:', err.message);
      });
    } catch (err) {
      console.log('⚠️ Email service not available (optional feature)');
    }
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ------------------- SOCKET.IO ------------------- //
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log('🟢 Client connected:', socket.id);

  // Real-time updates
  socket.on('procedureUpdated', (data) => io.emit('procedureUpdated', data));
  socket.on('vitalsUpdated', (data) => io.emit('vitalsUpdated', data));
  socket.on('feedbackUpdated', (data) => io.emit('feedbackUpdated', data));

  // Notifications
  socket.on('notificationCreated', (data) => io.emit('notificationCreated', data));
  socket.on('notificationRead', (data) => io.emit('notificationRead', data));

  socket.on('disconnect', () => {
    console.log('🔴 Client disconnected:', socket.id);
  });
});

app.set('io', io); // Make io accessible in routes

// ------------------- ROUTE IMPORTS ------------------- //
let authRoutes, adminRoutes, usersRoutes, roomsRoutes, patientRoutes;
let prescriptionRoutes, therapySessionRoutes, procedureRoutes, notificationRoutes;

try {
  authRoutes = require('./routes/auth');
  adminRoutes = require('./routes/admin');
  usersRoutes = require('./routes/admin/users');
  roomsRoutes = require('./routes/rooms');
  patientRoutes = require('./routes/Patients');
  prescriptionRoutes = require('./routes/Prescriptions');
  therapySessionRoutes = require('./routes/therapySessionRoutes');
  procedureRoutes = require('./routes/procedureRoutes');

  // Optional: Notifications
  try {
    notificationRoutes = require('./routes/notificationRoutes');
    console.log('✅ Notification routes loaded');
  } catch {
    console.log('⚠️ Notification routes not available');
  }

  console.log('✅ All routes loaded successfully');
} catch (err) {
  console.error('❌ Error loading routes:', err.message);
  process.exit(1);
}

// ------------------- ROUTE SETUP ------------------- //
app.get('/', (req, res) => {
  res.json({
    message: '🪷 AyurSutra API is running...',
    endpoints: {
      auth: '/api/auth',
      admin: '/api/admin',
      patients: '/api/patients',
      therapySessions: '/api/therapy-sessions',
      procedures: '/api/procedures',
      notifications: '/api/notifications',
    },
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Core routes
if (authRoutes) app.use('/api/auth', authRoutes);
if (adminRoutes) app.use('/api/admin', adminRoutes);
if (usersRoutes) app.use('/api/admin/users', usersRoutes);
if (roomsRoutes) app.use('/api/admin/rooms', roomsRoutes);

// Optional admin subroutes
try {
  app.use('/api/admin/doctors', require('./routes/admin/doctors'));
  app.use('/api/admin/therapists', require('./routes/admin/therapists'));
} catch {
  console.log('⚠️ Admin doctor/therapist routes not found');
}

// Domain routes
if (patientRoutes) app.use('/api/patients', patientRoutes);
if (prescriptionRoutes) app.use('/api/prescriptions', prescriptionRoutes);
if (therapySessionRoutes) {
  app.use('/api/therapy-sessions', therapySessionRoutes);
  console.log('✅ Therapy sessions route mounted at /api/therapy-sessions');
}
if (procedureRoutes) app.use('/api/procedures', procedureRoutes);
if (notificationRoutes) {
  app.use('/api/notifications', notificationRoutes);
  console.log('✅ Notifications route mounted at /api/notifications');
}

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ------------------- DEBUG ROUTES ------------------- //
app.get('/api/test/therapy-sessions', async (req, res) => {
  try {
    const TherapySession = require('./models/TherapySession');
    const count = await TherapySession.countDocuments();
    res.json({
      message: 'Therapy sessions route is working!',
      totalSessions: count,
    });
  } catch (err) {
    res.status(500).json({ error: 'Model error', message: err.message });
  }
});

app.get('/api/test/models', async (req, res) => {
  try {
    const User = require('./models/User');
    const TherapySession = require('./models/TherapySession');
    const ProcedureSession = require('./models/ProcedureSession');

    const [users, sessions, procedures] = await Promise.all([
      User.countDocuments(),
      TherapySession.countDocuments(),
      ProcedureSession.countDocuments(),
    ]);

    res.json({
      models: { users, therapySessions: sessions, procedureSessions: procedures },
      status: 'All models loaded',
    });
  } catch (err) {
    res.status(500).json({ error: 'Model error', message: err.message });
  }
});

// ------------------- 404 + ERROR HANDLING ------------------- //
app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.url}`);
  res.status(404).json({
    error: 'Not Found',
    path: req.url,
    method: req.method,
    availableRoutes: [
      '/api/auth',
      '/api/admin',
      '/api/patients',
      '/api/therapy-sessions',
      '/api/procedures',
      '/api/notifications',
    ],
  });
});

app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  console.error('Stack:', err.stack);
  res.status(500).json({
    error: 'Server error',
    message: err.message,
    path: req.url,
  });
});

// ------------------- NOTIFICATION SCHEDULER ------------------- //
try {
  require('./services/notificationScheduler');
  console.log('✅ Notification scheduler started');
} catch {
  console.log('⚠️ Notification scheduler not available (optional)');
}

// ------------------- START SERVER ------------------- //
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('🚀 Server running on port', PORT);
  console.log('📍 API Base URL: http://localhost:' + PORT);
  console.log('═══════════════════════════════════════════');
  console.log('Available endpoints:');
  console.log('  GET  / - API info');
  console.log('  GET  /health - Health check');
  console.log('  POST /api/auth/login - Login');
  console.log('  GET  /api/therapy-sessions - Get sessions');
  console.log('  POST /api/therapy-sessions - Create session');
  console.log('  GET  /api/procedures - Get procedures');
  console.log('  GET  /api/notifications/user/:id - Get notifications');
  console.log('═══════════════════════════════════════════');
  console.log('');
});

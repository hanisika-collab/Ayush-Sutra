// server.js or app.js - FIXED UPLOADS PATH HANDLING
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

// ✅ Import cron jobs and email service functions
const { initializeCronJobs, manualSendDailyTips, manualSendPreTherapy, manualSendPostTherapy } = require('./services/cronJobs');
const { verifyEmailConfig } = require('./services/emailService');

// Create express app & server (required for socket.io)
const app = express();
const server = http.createServer(app);

// ------------------- MIDDLEWARE ------------------- //
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// ------------------- CORS ------------------- //
const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [process.env.CLIENT_URL || 'http://localhost:3000'];
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true); 
    if (allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}));

// ------------------- RATE LIMIT ------------------- //
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again after a minute',
});
app.use(limiter);

// ------------------- REQUEST LOGGER ------------------- //
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ✅✅✅ CRITICAL FIX: Serve static files at BOTH /uploads AND /api/uploads
// This fixes the "route does not exist" error for patient documents
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// ✅ ALSO serve at /api/uploads to handle legacy paths
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

console.log('✅ Static files served at:');
console.log('   - /uploads');
console.log('   - /api/uploads');
console.log('   Upload directory:', path.join(__dirname, 'uploads'));

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

  socket.on('procedureUpdated', (data) => io.emit('procedureUpdated', data));
  socket.on('vitalsUpdated', (data) => io.emit('vitalsUpdated', data));
  socket.on('feedbackUpdated', (data) => io.emit('feedbackUpdated', data));
  socket.on('notificationCreated', (data) => io.emit('notificationCreated', data));
  socket.on('notificationRead', (data) => io.emit('notificationRead', data));

  socket.on('disconnect', () => {
    console.log('🔴 Client disconnected:', socket.id);
  });
});

app.set('io', io);

// ------------------- ROUTE IMPORTS ------------------- //
let authRoutes, adminRoutes, usersRoutes, roomsRoutes, patientRoutes;
let prescriptionRoutes, therapySessionRoutes, procedureRoutes, notificationRoutes;
let appointmentRoutes;

try {
  authRoutes = require('./routes/auth');
  adminRoutes = require('./routes/admin');
  usersRoutes = require('./routes/admin/users');
  roomsRoutes = require('./routes/rooms');
  patientRoutes = require('./routes/Patients');
  prescriptionRoutes = require('./routes/Prescriptions');
  therapySessionRoutes = require('./routes/therapySessionRoutes');
  procedureRoutes = require('./routes/procedureRoutes');
  appointmentRoutes = require('./routes/appointmentRoutes');
  
  try {
    notificationRoutes = require('./routes/notificationRoutes');
    console.log('✅ Notification routes loaded');
  } catch {
    console.log('⚠️ Notification routes not available');
  }

  console.log('✅ All core routes loaded successfully');
} catch (err) {
  console.error('❌ Error loading routes:', err.message);
  console.error('Stack:', err.stack);
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
      prescriptions: '/api/prescriptions',
      therapySessions: '/api/therapy-sessions',
      procedures: '/api/procedures',
      notifications: '/api/notifications',
      appointments: '/api/appointments',
      uploads: '/uploads (or /api/uploads)',
    },
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString(),
    cronJobsActive: true,
    uploadsPath: path.join(__dirname, 'uploads'),
  });
});

// ✅ Manual trigger endpoints for testing notifications
app.post('/api/admin/send-daily-tips-now', async (req, res) => {
  try {
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
      await manualSendDailyTips();
      return res.json({ message: 'Daily tips sent successfully (Manual Trigger)!' });
    }
    res.status(403).json({ error: 'Forbidden', message: 'This endpoint is for development/admin use only.' });
  } catch (err) {
    console.error('Manual Daily Tips Error:', err);
    res.status(500).json({ error: 'Failed to send daily tips', details: err.message });
  }
});

app.post('/api/admin/send-pre-therapy-now', async (req, res) => {
  try {
    await manualSendPreTherapy();
    res.json({ message: 'Pre-therapy notifications sent!' });
  } catch (err) {
    console.error('Manual Pre-Therapy Error:', err);
    res.status(500).json({ error: 'Failed to send pre-therapy notifications', details: err.message });
  }
});

app.post('/api/admin/send-post-therapy-now', async (req, res) => {
  try {
    await manualSendPostTherapy();
    res.json({ message: 'Post-therapy notifications sent!' });
  } catch (err) {
    console.error('Manual Post-Therapy Error:', err);
    res.status(500).json({ error: 'Failed to send post-therapy notifications', details: err.message });
  }
});

// ✅ Mount routes in correct order
if (authRoutes) {
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes mounted at /api/auth');
}

if (patientRoutes) {
  app.use('/api/patients', patientRoutes);
  console.log('✅ Patient routes mounted at /api/patients');
}

if (prescriptionRoutes) {
  app.use('/api/prescriptions', prescriptionRoutes);
  console.log('✅ Prescription routes mounted at /api/prescriptions');
}

if (therapySessionRoutes) {
  app.use('/api/therapy-sessions', therapySessionRoutes);
  console.log('✅ Therapy sessions route mounted at /api/therapy-sessions');
}

if (procedureRoutes) {
  app.use('/api/procedures', procedureRoutes);
  console.log('✅ Procedure routes mounted at /api/procedures');
}

if (notificationRoutes) {
  app.use('/api/notifications', notificationRoutes);
  console.log('✅ Notifications route mounted at /api/notifications');
}

if (appointmentRoutes) {
  app.use('/api/appointments', appointmentRoutes);
  console.log('✅ Appointment routes mounted at /api/appointments');
}

if (adminRoutes) {
  app.use('/api/admin', adminRoutes);
  console.log('✅ Admin routes mounted at /api/admin');
}

if (usersRoutes) {
  app.use('/api/admin/users', usersRoutes);
  console.log('✅ User management routes mounted at /api/admin/users');
}

if (roomsRoutes) {
  app.use('/api/admin/rooms', roomsRoutes);
  console.log('✅ Room routes mounted at /api/admin/rooms');
}

// Optional admin subroutes
try {
  app.use('/api/admin/doctors', require('./routes/admin/doctors'));
  console.log('✅ Doctor routes mounted');
} catch {
  console.log('⚠️ Admin doctor routes not found');
}

try {
  app.use('/api/admin/therapists', require('./routes/admin/therapists'));
  console.log('✅ Therapist routes mounted');
} catch {
  console.log('⚠️ Admin therapist routes not found');
}

// ------------------- DEBUG ROUTES ------------------- //

app.get('/api/test/routes', (req, res) => {
  try {
    const routes = [];
    
    app._router.stack.forEach(middleware => {
      if (middleware.route) {
        const methods = Object.keys(middleware.route.methods);
        routes.push({
          method: methods[0].toUpperCase(),
          path: middleware.route.path
        });
      } else if (middleware.name === 'router') {
        const routerPath = middleware.regexp.source
          .replace('\\/?', '')
          .replace('(?=\\/|$)', '')
          .replace(/\\\//g, '/');
        
        if (routerPath.startsWith('/api') || routerPath.startsWith('/uploads')) { 
          middleware.handle.stack.forEach(handler => {
            if (handler.route) {
              const methods = Object.keys(handler.route.methods);
              routes.push({
                method: methods[0].toUpperCase(),
                path: routerPath + handler.route.path
              });
            }
          });
        }
      }
    });
    
    res.json({
      message: 'All registered routes',
      totalRoutes: routes.length,
      routes: routes.sort((a, b) => a.path.localeCompare(b.path)),
      staticPaths: ['/uploads', '/api/uploads'],
      prescriptionRoutes: routes.filter(r => r.path.includes('prescription'))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
    const Prescription = require('./models/Prescription');
    const Appointment = require('./models/Appointment');

    const [users, sessions, procedures, prescriptions, appointments] = await Promise.all([
      User.countDocuments(),
      TherapySession.countDocuments(),
      ProcedureSession.countDocuments(),
      Prescription.countDocuments(),
      Appointment.countDocuments(),
    ]);

    res.json({
      models: { 
        users, 
        therapySessions: sessions, 
        procedureSessions: procedures,
        prescriptions,
        appointments,
      },
      status: 'All models loaded',
    });
  } catch (err) {
    res.status(500).json({ error: 'Model error', message: err.message });
  }
});

app.get('/api/test/prescriptions', async (req, res) => {
  try {
    const Prescription = require('./models/Prescription');
    const prescriptions = await Prescription.find()
      .populate('patientId', 'name email role')
      .populate('uploadedBy', 'name email role')
      .limit(5);
    
    res.json({
      message: 'Prescription routes test',
      totalPrescriptions: await Prescription.countDocuments(),
      samplePrescriptions: prescriptions.map(p => ({
        id: p._id,
        fileName: p.fileName,
        patientName: p.patientId?.name || 'N/A',
        uploaderName: p.uploadedBy?.name || 'N/A',
        downloadUrl: `/api/prescriptions/${p._id}/download`
      }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Test error', message: err.message });
  }
});

app.get('/api/test/download/:id', async (req, res) => {
  try {
    const Prescription = require('./models/Prescription');
    const prescription = await Prescription.findById(req.params.id);
    
    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }
    
    const filePath = path.join(__dirname, prescription.filePath);
    const fs = require('fs');
    
    res.json({
      message: 'Download test (check file details)',
      prescription: {
        id: prescription._id,
        fileName: prescription.fileName,
        filePath: prescription.filePath,
        fullPath: filePath,
        fileExists: fs.existsSync(filePath)
      },
      downloadUrl: `/api/prescriptions/${prescription._id}/download`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------- 404 + ERROR HANDLING ------------------- //

// 404 Handler
app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.url}`);
  res.status(404).json({
    error: 'Not Found',
    path: req.url,
    method: req.method,
    message: 'This route does not exist',
    availableRoutes: [
      '/api/auth',
      '/api/admin',
      '/api/patients',
      '/api/prescriptions',
      '/api/therapy-sessions',
      '/api/procedures',
      '/api/notifications',
      '/api/appointments',
      '/api/test/routes',
      '/api/health',
      '/uploads/* (static files)',
      '/api/uploads/* (static files)'
    ],
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  console.error('Stack:', err.stack);
  res.status(err.status || 500).json({
    error: 'Server error',
    message: err.message,
    path: req.url,
  });
});

// ------------------- MONGO CONNECTION & STARTUP ------------------- //
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ayush-wellness', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(async () => {
    console.log('✅ MongoDB Connected');

    await verifyEmailConfig().catch(err => {
      console.log('⚠️ Email service not configured or failed to verify:', err.message);
    });

    console.log('\n⏰ Starting cron jobs initialization...');
    initializeCronJobs();
    console.log('✅ Cron jobs initialized\n');
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ------------------- START SERVER ------------------- //
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('🚀 AyurSutra API running on port', PORT);
  console.log('📍 API Base URL: http://localhost:' + PORT);
  console.log('⏰ Cron Jobs Status: Active');
  console.log('📁 Static Files: /uploads & /api/uploads');
  console.log('═══════════════════════════════════════════');
  console.log('Available endpoints:');
  console.log('  GET  / - API info');
  console.log('  GET  /health - Health check');
  console.log('  POST /api/admin/send-daily-tips-now - Manual Daily Tips 🧪');
  console.log('  POST /api/admin/send-pre-therapy-now - Manual Pre-Therapy 🧪');
  console.log('  POST /api/admin/send-post-therapy-now - Manual Post-Therapy 🧪');
  console.log('  GET  /api/test/routes - List all routes');
  console.log('  GET  /api/test/prescriptions - Test prescriptions');
  console.log('  POST /api/auth/login - Login');
  console.log('  GET  /api/prescriptions/:id/download - Download ⬇️');
  console.log('  POST /api/appointments - Book Appointment');
  console.log('  GET  /api/appointments - Get Appointments');
  console.log('  GET  /uploads/* - Static files (patient docs, prescriptions)');
  console.log('  GET  /api/uploads/* - Static files (alternative path)');
  console.log('═══════════════════════════════════════════');
  console.log('');
});
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const usersRoutes = require('./routes/admin/users');
const roomsRoutes = require('./routes/rooms'); // Therapy Rooms
const patientRoutes = require("./routes/Patients");
const prescriptionRoutes = require("./routes/Prescriptions");
const therapySessionRoutes = require("./routes/therapySessionRoutes");
const procedureRoutes = require("./routes/procedureRoutes");
const notificationRoutes = require("./routes/notificationRoutes"); // ✅ NEW: Notifications

// ✅ NEW: Email service verification
const { verifyEmailConfig } = require('./services/emailService');

// Create express app
const app = express();
const server = http.createServer(app); // ⬅️ HTTP server needed for Socket.io

// ------------------- MIDDLEWARE ------------------- //

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security headers
app.use(helmet());

// CORS setup
const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Rate limiting (100 requests per minute)
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
});
app.use(limiter);

// Logging incoming requests (for debugging)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ------------------- MONGODB CONNECTION ------------------- //
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('✅ MongoDB Connected');
    // ✅ NEW: Verify email configuration after MongoDB connects
    verifyEmailConfig();
  })
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// ------------------- SOCKET.IO CONFIG ------------------- //
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("🟢 Client connected:", socket.id);

  // Real-time events for Procedure Tracking
  socket.on("procedureUpdated", (data) => io.emit("procedureUpdated", data));
  socket.on("vitalsUpdated", (data) => io.emit("vitalsUpdated", data));
  socket.on("feedbackUpdated", (data) => io.emit("feedbackUpdated", data));

  // ✅ NEW: Real-time events for Notifications
  socket.on("notificationCreated", (data) => io.emit("notificationCreated", data));
  socket.on("notificationRead", (data) => io.emit("notificationRead", data));

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});

// Make io available to all routes
app.set("io", io);

// ------------------- ROUTES ------------------- //

// Root
app.get('/', (req, res) => {
  res.send('🪷 AyurSutra API is running...');
});

// Auth routes
app.use('/api/auth', authRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);
app.use('/api/admin/users', usersRoutes);
app.use('/api/admin/rooms', roomsRoutes);
app.use("/api/admin/doctors", require("./routes/admin/doctors"));
app.use("/api/admin/therapists", require("./routes/admin/therapists"));

// Patients, Prescriptions, Sessions, Procedures
app.use('/api/patients', patientRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/therapy-sessions", therapySessionRoutes);
app.use("/api/procedures", procedureRoutes);

// ✅ NEW: Notifications route
app.use("/api/notifications", notificationRoutes);

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Server error', message: err.message });
});

// ✅ NEW: Start notification scheduler (cron jobs)
// Uncomment this line after creating notificationScheduler.js
// require('./services/notificationScheduler');

// ------------------- START SERVER ------------------- //
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📧 Email notifications enabled`);
  console.log(`🔔 Notification system ready`);
});
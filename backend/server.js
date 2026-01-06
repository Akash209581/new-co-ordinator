const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const coordinatorRoutes = require('./routes/coordinator');
const { errorHandler } = require('./middleware/errorHandler');
const User = require('./models/User');
const Coordinator = require('./models/Coordinator');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy - required for express-rate-limit to work correctly with proxies
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(limiter);
app.use(morgan('combined'));
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Disable caching for API responses
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mahotsavvignan2025_db_user:mYzQ87sgJ3vKbh0L@events.nghtwjg.mongodb.net/?appName=Events';

mongoose.connect(MONGODB_URI)
.then(async () => {
  console.log('✅ Connected to MongoDB Atlas');
  try {
    await ensureDefaultAdmin();
  } catch (err) {
    console.error('⚠️ Error ensuring default admin:', err);
  }
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

// Ensure a default admin/coordinator user exists (id and password fixed via .env)
async function ensureDefaultAdmin() {
  const defaultUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
  const defaultEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com';
  const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';

  // Create or update User (application users collection)
  try {
    let user = await User.findOne({ email: defaultEmail.toLowerCase() });
    if (user) {
      // Update password if different
      user.password = defaultPassword;
      user.role = 'admin';
      user.isActive = true;
      await user.save();
      console.log(`🔁 Updated default User admin: ${defaultEmail}`);
    } else {
      user = new User({
        fullName: 'Administrator',
        email: defaultEmail.toLowerCase(),
        password: defaultPassword,
        role: 'admin',
        isActive: true
      });
      await user.save();
      console.log(`✅ Created default User admin: ${defaultEmail}`);
    }
  } catch (err) {
    console.error('❌ Failed to create/update default User admin:', err.message || err);
  }

  // Create or update Coordinator (legacy coordinator collection)
  try {
    let coord = await Coordinator.findOne({
      $or: [
        { username: defaultUsername },
        { email: defaultEmail.toLowerCase() }
      ]
    });

    if (coord) {
      coord.password = defaultPassword;
      coord.email = defaultEmail.toLowerCase();
      coord.firstName = coord.firstName || 'Admin';
      coord.lastName = coord.lastName || 'User';
      coord.department = coord.department || 'Administration';
      coord.role = 'admin';
      coord.isActive = true;
      await coord.save();
      console.log(`🔁 Updated default Coordinator: ${defaultUsername}`);
    } else {
      coord = new Coordinator({
        username: defaultUsername,
        email: defaultEmail.toLowerCase(),
        password: defaultPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        department: 'Administration',
        isActive: true
      });
      await coord.save();
      console.log(`✅ Created default Coordinator: ${defaultUsername}`);
    }
  } catch (err) {
    console.error('❌ Failed to create/update default Coordinator:', err.message || err);
  }
}

// Routes
const paymentRoutes = require('./routes/payments');
const participantsRoutes = require('./routes/participants');
const registrationsRoutes = require('./routes/registrations');
const teamRegistrationRoutes = require('./routes/teamRegistration');
const eventsRoutes = require('./routes/events');
const managerRoutes = require('./routes/manager');
const visitorRoutes = require('./routes/visitor');

app.use('/api/auth', authRoutes);
app.use('/api/coordinator', coordinatorRoutes);
app.use('/api/coordinator', eventsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/participants', participantsRoutes);
app.use('/api/registrations', registrationsRoutes);
app.use('/api/teams', teamRegistrationRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/manager', managerRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Mahotsav Backend Server is running',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Mahotsav Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      coordinator: '/api/coordinator'
    }
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}`);
});

module.exports = app;
// Load environment variables (only needed in local dev; Vercel injects them automatically)
require('dotenv').config();
require('express-async-errors');

const express  = require('express');
const cors     = require('cors');
const morgan   = require('morgan');

const connectDB    = require('./config/db');
const authRoutes   = require('./routes/auth');
const productRoutes= require('./routes/products');
const orderRoutes  = require('./routes/orders');
const userRoutes   = require('./routes/users');
const errorHandler = require('./middleware/errorHandler');

// Connect to MongoDB — safe to call multiple times (Mongoose caches the connection)
connectDB();

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://aasamedchem-mauve.vercel.app',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // curl / Postman / same-origin
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (process.env.VERCEL) return callback(null, true); // all Vercel requests allowed
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.use('/api/auth',     authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/users',    userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use(errorHandler);

// ─── Start server (skip in Vercel serverless) ──────────────────────────────────
// On Vercel: module.exports = app is used as the serverless handler.
// Locally:   we call listen() to start the HTTP server.
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = app;

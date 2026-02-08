import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

// Import routes
import authRoutes from './routes/auth';
import issueRoutes from './routes/issues';
import adminRoutes from './routes/admin';
import profileRoutes from './routes/profile';
import suggestionRoutes from './routes/suggestions';
import civicSpaceRoutes from './routes/civicSpace';
import appraisalRoutes from './routes/appraisals';
import trendingRoutes from './routes/trending';
import allPublicItemsRoutes from './routes/allPublicItems';
import mapRoutes from './routes/map';
import weatherRoutes from './routes/weather';
import newsRoutes from './routes/news';
import recaptchaRoutes from './routes/recaptcha';
import themeRoutes from './routes/theme';
import banRoutes from './routes/ban';
import analyticsRoutes from './routes/analytics';
import adminMessagesRoutes from './routes/adminMessages';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware - configure helmet to allow static file serving
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration - more permissive in development (must be before rate limiting)
const corsOptions: cors.CorsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // In development, allow all origins
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      return callback(null, true);
    }
    
    // In production, check against allowed origins
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200,
  preflightContinue: false
};
app.use(cors(corsOptions));

// Explicitly handle OPTIONS requests for all routes (additional safety)
app.options('*', cors(corsOptions));

// Rate limiting - more lenient for status checks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Increased limit to 200 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for ban details endpoint (status check)
    return req.path === '/api/ban/details';
  },
  handler: (req, res) => {
    // Ensure CORS headers are included in rate limit responses
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    }
    res.status(429).json({
      error: 'Too many requests, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
import path from 'path';
const uploadsPath = path.join(process.cwd(), 'server', 'uploads');

console.log('Serving static files from:', uploadsPath);
app.use('/uploads', express.static(uploadsPath));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/suggestions', suggestionRoutes);
app.use('/api/civic-space', civicSpaceRoutes);
app.use('/api/appraisals', appraisalRoutes);
app.use('/api/trending', trendingRoutes);
app.use('/api/all-public-items', allPublicItemsRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/recaptcha', recaptchaRoutes);
app.use('/api/theme', themeRoutes);
app.use('/api/ban', banRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin-messages', adminMessagesRoutes);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Start weekly summary scheduler (only in production or if enabled)
  if (process.env.ENABLE_WEEKLY_EMAILS === 'true' || process.env.NODE_ENV === 'production') {
    const { startWeeklySummaryScheduler } = require('./services/scheduler');
    startWeeklySummaryScheduler();
  } else {
    console.log('📧 Weekly email summaries disabled (set ENABLE_WEEKLY_EMAILS=true to enable)');
  }

  // Start message auto-close scheduler (always enabled)
  const { startMessageAutoCloseScheduler } = require('./services/scheduler');
  startMessageAutoCloseScheduler();
});

export default app;

// Load environment variables FIRST using ESM-friendly entry
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env located next to this file (ensures correct .env is used even if cwd differs)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '.env');
import fs from 'fs';
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// Show presence of critical secrets (do not log actual secrets)
console.log('JWT_SECRET set=', !!process.env.JWT_SECRET);
console.log('REFRESH_TOKEN_SECRET set=', !!process.env.REFRESH_TOKEN_SECRET);

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db.js';
import { ensureRolesExist, ensureRolePermissions } from './utils/roleUtils.js';
import { initializeEmbeddingModel } from './services/embeddingService.js';
import { initializeQdrantDB } from './services/qdrantService.js';
import authRoutes from './routes/authRoute.js';
import userRoutes from './routes/userRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import diseaseRoutes from './routes/diseaseRoutes.js';
import symptomRoutes from './routes/symptomRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import permissionRoutes from './routes/permissionRoutes.js';
import assessmentRoutes from './routes/assessmentRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import contentRoutes from './routes/contentRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import queryRoutes from './routes/queryRoutes.js';
import personalizedSystemRoutes from './routes/personalizedSystemRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import dietPlanRoutes from './routes/dietPlanRoutes.js';
import monthlyDietPlanRoutes from './routes/monthlyDietPlanRoutes.js';
import exercisePlanRoutes from './routes/exercisePlanRoutes.js';
import lifestyleTipsRoutes from './routes/lifestyleTipsRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import adminFeedbackRoutes from './routes/adminFeedbackRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import testSettingsRoutes from './routes/testSettingsRoutes.js';
import publicSettingsRoutes from './routes/publicSettingsRoutes.js';
import prioritiesRoutes from './routes/priorities.js';
import habitsRoutes from './routes/habitsRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import { captureAuditContext } from './middlewares/auditMiddleware.js';
import { apiLimiter } from './middlewares/rateLimitMiddleware.js';
import AuditLog from './models/AuditLog.js';
import os from 'os';
import { hasPermission } from './utils/permissionUtils.js';

const app = express();

const defaultAllowedOrigins = [
  'http://localhost:3000',
  'http://localhost:4173',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'http://localhost:8081',
  'http://127.0.0.1:8081',
];

function getAllowedOrigins() {
  const configuredOrigins = String(process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  // Expand configured origins with common variations to avoid simple mismatches
  const baseList = configuredOrigins.length > 0 ? configuredOrigins : defaultAllowedOrigins;
  const expanded = new Set(baseList);

  for (const o of baseList) {
    try {
      const url = new URL(o);
      expanded.add(url.origin);
      expanded.add(url.host);
    } catch (e) {
      // not a full URL, add common protocol variants
      expanded.add(o);
    }

    // add protocol variants and trailing-slash variants
    const noSlash = o.replace(/\/$/, '');
    expanded.add(noSlash);
    expanded.add(`https://${noSlash}`);
    expanded.add(`http://${noSlash}`);
    expanded.add(noSlash + '/');
  }

  return Array.from(expanded).filter(Boolean);
}

const allowedOrigins = new Set(getAllowedOrigins());

// Helper function to get local IP address
function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (i.e. 127.0.0.1) and non-ipv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (no Origin header)
    if (!origin) return callback(null, true);

    let normalized;
    try {
      normalized = new URL(origin).origin.replace(/\/$/, '');
    } catch (e) {
      normalized = origin.replace(/\/$/, '');
    }

    // Allow any localhost or 127.0.0.1 origin on any port in local/dev scenarios.
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalized)) {
      return callback(null, true);
    }

    // Accept if exact match, host-only match, or canonical origin
    try {
      const host = new URL(origin).host;
      if (allowedOrigins.has(normalized) || allowedOrigins.has(host) || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
    } catch (e) {
      if (allowedOrigins.has(normalized) || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
    }

    console.warn('CORS blocked origin:', origin);
    return callback(null, false);
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
}));

// Ensure OPTIONS preflight always returns proper CORS headers for allowed origins
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  if (!origin) return res.sendStatus(204);
  try {
    const normalized = new URL(origin).origin.replace(/\/$/, '');
    const host = new URL(origin).host;
    if (allowedOrigins.has(normalized) || allowedOrigins.has(host) || allowedOrigins.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
      return res.sendStatus(204);
    }
  } catch (e) {
    // fallthrough
  }
  return res.sendStatus(403);
});

// Global API rate limiter (100 requests/min per IP)
app.use('/api/', apiLimiter);

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Add audit context capture middleware globally
app.use(captureAuditContext);

// Public healthcheck + landing route (useful for Hugging Face Space iframe)
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Diavise backend is running',
    apiBase: '/api/v1',
    endpoints: {
      publicSettings: '/api/v1/public/settings',
      queryStats: '/api/v1/query/stats',
      serverInfo: '/api/v1/server-info',
      healthz: '/api/healthz',
    },
    rag: {
      enabled: process.env.RAG_ENABLED === 'true',
    },
  });
});

app.get('/api/healthz', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    rag_enabled: process.env.RAG_ENABLED === 'true',
  });
});

// Server info endpoint for mobile app auto-discovery
app.get('/api/v1/server-info', (req, res) => {
  const localIP = getLocalIPAddress();
  const port = process.env.PORT || 5000;
  res.json({
    success: true,
    data: {
      ip: localIP,
      port: port,
      apiUrl: `http://${localIP}:${port}/api/v1`,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  });
});

// Connect to database and ensure roles exist
const startServer = async () => {
    // Bind port FIRST so HuggingFace sees a healthy process immediately
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`✅ Server listening on port ${PORT}`);
    });

    // Connect to DB in background — never call process.exit so the server stays alive
    try {
        await connectDB();
        console.log('✅ Database connected successfully');
        
        // Ensure all required roles exist and have the right permissions
        await ensureRolesExist();
        await ensureRolePermissions();
        
        // **Initialize RAG services**
        if (process.env.RAG_ENABLED === 'true') {
            try {
                console.log('🔧 Initializing RAG services...');
                await initializeEmbeddingModel();
                console.log('✅ Embedding model (Jina AI) initialized');
                
                await initializeQdrantDB();
                console.log('✅ Qdrant Cloud initialized');
                console.log('🎯 RAG system ready');
            } catch (ragError) {
                console.error('❌ RAG initialization failed:', ragError.message);
                console.log('⚠️  Server will continue without RAG - chat will use basic prompts only');
            }
        } else {
            console.log('ℹ️  RAG is disabled (RAG_ENABLED=false)');
        }

        // Run startup pre-generation by default so users see ready plans without opening screens.
        // Set SCHEDULER_STARTUP_RUN=false to disable.
        if (process.env.SCHEDULER_STARTUP_RUN !== 'false') {
          triggerDailyPlansForAllUsers('startup').catch((err) => {
            console.error('❌ [Scheduler] startup run error:', err.message);
          });
        } else {
          console.log('ℹ️ [Scheduler] Startup run skipped (set SCHEDULER_STARTUP_RUN=true or unset to enable)');
        }

        console.log('✅ Server fully initialized');
    } catch (error) {
        // Log the full error but DO NOT exit — keeps the process alive so logs are visible
        console.error('❌ Initialization error (server still running):', error.message);
        console.error(error.stack);
    }
};

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/questions', questionRoutes);
app.use('/api/v1/diseases', diseaseRoutes);
app.use('/api/v1/symptoms', symptomRoutes);
app.use('/api/v1/roles', roleRoutes);
app.use('/api/v1/permissions', permissionRoutes);
app.use('/api/v1/assessment', assessmentRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/content', contentRoutes);
app.use('/api/v1/admin/docs', documentRoutes);
app.use('/api/v1/query', queryRoutes);
app.use('/api/v1/personalized-system', personalizedSystemRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/diet-plan', dietPlanRoutes);
app.use('/api/v1/monthly-diet-plan', monthlyDietPlanRoutes);
app.use('/api/v1/exercise-plan', exercisePlanRoutes);
app.use('/api/v1/lifestyle-tips', lifestyleTipsRoutes);
app.use('/api/v1/feedback', feedbackRoutes);
app.use('/api/v1/admin/feedback', adminFeedbackRoutes);
app.use('/api/v1/admin/audit-logs', auditRoutes);
app.use('/api/v1/admin/settings', settingsRoutes);
app.use('/api/v1/public/settings', publicSettingsRoutes);
app.use('/api/v1', testSettingsRoutes); // Public test endpoint

// Development/Testing route for clearing plans
if (process.env.NODE_ENV !== 'production') {
  const devRoutes = (await import('./routes/devRoutes.js')).default;
  app.use('/api/v1/dev', devRoutes);
  console.log('🔧 Dev routes enabled');
}
app.use('/api/v1/priorities', prioritiesRoutes);
app.use('/api/v1/habits', habitsRoutes);
app.use('/api/v1/health', healthRoutes);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Catch-all for all unsupported routes
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Cannot ${req.method} ${req.originalUrl}` });
});



// ─── Start the server ────────────────────────────────────────────────────────
startServer();

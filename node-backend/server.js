import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { Server } from 'socket.io';

import apiRoutes from './src/routes/index.js';
import { errorHandler, notFound, requestLogger } from './src/middleware/errorHandler.js';
import { setIo } from './src/realtime/io.js';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// ─── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:4000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

const isDev = process.env.NODE_ENV !== 'production';

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
  // Development: 2 000 req/window (approx. one per second) so normal usage never triggers 429.
  // Production: respect the env var or fall back to 100.
  max: isDev ? 2000 : (parseInt(process.env.RATE_LIMIT_MAX) || 100),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  // Skip the limiter entirely for local development traffic.
  skip: (req) => {
    if (!isDev) return false;
    const ip = req.ip || req.connection?.remoteAddress || '';
    return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
  },
});

app.use('/api', limiter);

// ─── Body / Compression ────────────────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Logging ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(requestLogger);
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'kalinga-node-api',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── API Routes ────────────────────────────────────────────────────────────────
app.use('/api', apiRoutes);

// ─── Error Handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ──────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:4000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

setIo(io);

io.on('connection', (socket) => {
  socket.on('pcr:subscribe', ({ caseNo, patientUuid } = {}) => {
    if (caseNo) {
      socket.join(`pcr:case:${caseNo}`);
    }
    if (patientUuid) {
      socket.join(`pcr:patient:${patientUuid}`);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`[Kalinga API] Server running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  console.log(`[Kalinga API] Health: http://localhost:${PORT}/health`);
});

export default app;

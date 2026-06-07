// server/index.js — EventZed Express Backend
require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const path       = require('path');

const authRouter      = require('./routes/auth');
const eventsRouter    = require('./routes/events');
const attendeesRouter = require('./routes/attendees');
const filesRouter     = require('./routes/files');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── API Routes ──────────────────────────────────────────────
app.use('/api/auth',      authRouter);
app.use('/api/events',    eventsRouter);
app.use('/api/attendees', attendeesRouter);
app.use('/api/files',     filesRouter);

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ── Start ───────────────────────────────────────────────────
app.listen(PORT, () => console.log(`EventZed server running on port ${PORT}`));

// server/routes/files.js — File Upload & Management
const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const pool    = require('../db/pool');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Multer disk storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },   // 10 MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf','.doc','.docx','.ppt','.pptx','.jpg','.jpeg','.png','.xlsx','.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('File type not allowed'));
  },
});

// GET /api/files?eventId=X — list files
router.get('/', authenticate, async (req, res) => {
  const { eventId } = req.query;
  try {
    let result;
    if (eventId) {
      result = await pool.query(
        'SELECT f.*, e.title AS event_title FROM event_files f JOIN events e ON f.event_id = e.id WHERE f.event_id = $1 ORDER BY f.uploaded_at DESC',
        [eventId]
      );
    } else {
      result = await pool.query(
        'SELECT f.*, e.title AS event_title FROM event_files f JOIN events e ON f.event_id = e.id ORDER BY f.uploaded_at DESC'
      );
    }
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/files/upload — upload file (admin only)
router.post('/upload', authenticate, requireAdmin, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const { event_id } = req.body;
  if (!event_id) return res.status(400).json({ error: 'event_id is required' });

  try {
    const result = await pool.query(
      `INSERT INTO event_files (event_id, file_name, file_path, file_size, mime_type, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [event_id, req.file.originalname, req.file.filename, req.file.size, req.file.mimetype, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/files/:id — delete file (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM event_files WHERE id = $1 RETURNING *', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'File not found' });

    // Remove from disk
    const filePath = path.join(__dirname, '../../uploads', result.rows[0].file_path);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({ message: 'File deleted', id: req.params.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

// server/routes/events.js — Full CRUD for Events with image upload support
const express = require('express');
const pool    = require('../db/pool');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/events — list all events (optionally filter by status/category)
router.get('/', authenticate, async (req, res) => {
  const { status, category, search } = req.query;
  let query  = 'SELECT e.*, u.name AS creator_name FROM events e LEFT JOIN users u ON e.created_by = u.id WHERE 1=1';
  const params = [];

  if (status)   { params.push(status);   query += ` AND e.status = $${params.length}`; }
  if (category) { params.push(category); query += ` AND e.category = $${params.length}`; }
  if (search)   { params.push(`%${search}%`); query += ` AND (e.title ILIKE $${params.length} OR e.venue ILIKE $${params.length})`; }

  query += ' ORDER BY e.date ASC';

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/events/:id — single event with attendee count
router.get('/:id', authenticate, async (req, res) => {
  try {
    const evResult  = await pool.query(
      'SELECT e.*, u.name AS creator_name FROM events e LEFT JOIN users u ON e.created_by = u.id WHERE e.id = $1',
      [req.params.id]
    );
    if (!evResult.rows.length) return res.status(404).json({ error: 'Event not found' });

    const countResult = await pool.query('SELECT COUNT(*) FROM attendees WHERE event_id = $1', [req.params.id]);
    const event = evResult.rows[0];
    event.attendee_count = parseInt(countResult.rows[0].count);
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/events — create event (admin only) WITH image_url support
router.post('/', authenticate, requireAdmin, async (req, res) => {
  const { title, category, description, date, time, venue, organizer, max_attendees, status, image_url } = req.body;
  console.log('Creating event with image_url:', image_url); // Debug log
  
  if (!title || !category || !date || !time || !venue)
    return res.status(400).json({ error: 'title, category, date, time and venue are required' });

  try {
    const result = await pool.query(
      `INSERT INTO events (title, category, description, date, time, venue, organizer, max_attendees, status, created_by, image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [title, category, description || null, date, time, venue, organizer || null,
       max_attendees || 100, status || 'upcoming', req.user.id, image_url || null]
    );
    console.log('Event created with image_url:', result.rows[0].image_url); // Debug log
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/events/:id — update event (admin only) WITH image_url support
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  const { title, category, description, date, time, venue, organizer, max_attendees, status, image_url } = req.body;
  console.log('Updating event with image_url:', image_url); // Debug log
  
  try {
    const result = await pool.query(
      `UPDATE events SET title=$1, category=$2, description=$3, date=$4, time=$5,
       venue=$6, organizer=$7, max_attendees=$8, status=$9, image_url=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [title, category, description, date, time, venue, organizer, max_attendees, status, image_url || null, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Event not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/events/:id — delete event (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM events WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Event not found' });
    res.json({ message: 'Event deleted', id: req.params.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

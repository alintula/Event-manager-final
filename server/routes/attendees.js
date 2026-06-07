// server/routes/attendees.js — Event Registrations
const express = require('express');
const pool    = require('../db/pool');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/attendees?eventId=X — list attendees (optionally by event)
router.get('/', authenticate, async (req, res) => {
  const { eventId } = req.query;
  try {
    let result;
    if (eventId) {
      result = await pool.query(
        'SELECT a.*, e.title AS event_title FROM attendees a JOIN events e ON a.event_id = e.id WHERE a.event_id = $1 ORDER BY a.registered_at DESC',
        [eventId]
      );
    } else {
      result = await pool.query(
        'SELECT a.*, e.title AS event_title FROM attendees a JOIN events e ON a.event_id = e.id ORDER BY a.registered_at DESC'
      );
    }
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/attendees — register for an event
router.post('/', authenticate, async (req, res) => {
  const { event_id, name, student_id, email } = req.body;
  if (!event_id || !name || !student_id || !email)
    return res.status(400).json({ error: 'event_id, name, student_id and email are required' });

  try {
    // Check event exists and has capacity
    const evRes = await pool.query('SELECT * FROM events WHERE id = $1', [event_id]);
    if (!evRes.rows.length) return res.status(404).json({ error: 'Event not found' });

    const event = evRes.rows[0];
    const countRes = await pool.query('SELECT COUNT(*) FROM attendees WHERE event_id = $1', [event_id]);
    if (parseInt(countRes.rows[0].count) >= event.max_attendees)
      return res.status(409).json({ error: 'Event is fully booked' });

    const result = await pool.query(
      `INSERT INTO attendees (event_id, user_id, name, student_id, email)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [event_id, req.user.id, name, student_id, email]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ error: 'Already registered for this event' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/attendees/:id — remove a registration (admin only)
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM attendees WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Registration not found' });
    res.json({ message: 'Registration removed', id: req.params.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

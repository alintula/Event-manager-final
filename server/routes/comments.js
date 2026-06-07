const express = require('express');
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET comments for an event
router.get('/event/:eventId', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.name as user_name, u.email as user_email 
       FROM comments c 
       LEFT JOIN users u ON c.user_id = u.id 
       WHERE c.event_id = $1 
       ORDER BY c.created_at DESC`,
      [req.params.eventId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST a comment
router.post('/', authenticate, async (req, res) => {
  const { event_id, comment } = req.body;
  
  if (!event_id || !comment) {
    return res.status(400).json({ error: 'event_id and comment are required' });
  }
  
  try {
    const result = await pool.query(
      `INSERT INTO comments (event_id, user_id, comment) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [event_id, req.user.id, comment]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE a comment (only the comment owner or admin)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const comment = await pool.query('SELECT user_id FROM comments WHERE id = $1', [req.params.id]);
    if (comment.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    if (req.user.role !== 'admin' && comment.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }
    
    await pool.query('DELETE FROM comments WHERE id = $1', [req.params.id]);
    res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    console.error('Error deleting comment:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

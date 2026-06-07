// server/routes/auth.js — Login & Registration with role control
const express = require('express');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const pool    = require('../db/pool');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'eventzed_secret';
const JWT_EXPIRES = '7d';

// Public registration - only for students
router.post('/register', async (req, res) => {
  const { name, email, password, student_id } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email and password are required' });
  }

  try {
    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    // Public registration always creates student role
    const result = await pool.query(
      `INSERT INTO users (name, email, password, student_id, role)
       VALUES ($1, $2, $3, $4, 'student')
       RETURNING id, name, email, role, student_id, created_at`,
      [name, email, hash, student_id || null]
    );
    
    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: JWT_EXPIRES }
    );
    
    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin-only registration (only existing admins can create new admins)
router.post('/register-admin', authenticate, requireAdmin, async (req, res) => {
  const { name, email, password, student_id } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email and password are required' });
  }

  try {
    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    // Admin registration creates admin role
    const result = await pool.query(
      `INSERT INTO users (name, email, password, student_id, role)
       VALUES ($1, $2, $3, $4, 'admin')
       RETURNING id, name, email, role, student_id, created_at`,
      [name, email, hash, student_id || null]
    );
    
    const user = result.rows[0];
    res.status(201).json({ 
      message: 'Admin user created successfully',
      user: user 
    });
  } catch (err) {
    console.error('Admin registration error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login - for all users
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: JWT_EXPIRES }
    );
    
    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, student_id, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

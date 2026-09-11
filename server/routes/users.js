import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router();

// Get all users for directory tabs & cards
router.get('/', async (req, res) => {
  try {
    const search = req.query.q ? `%${req.query.q.trim().toLowerCase()}%` : null;

    let query = `
      SELECT 
        u.id, 
        u.username, 
        u.display_name, 
        u.avatar_url, 
        u.bio, 
        u.prompt, 
        u.is_available,
        COUNT(m.id)::int as received_count
      FROM users u
      LEFT JOIN messages m ON u.id = m.recipient_id
    `;

    const params = [];
    if (search) {
      query += ` WHERE LOWER(u.username) LIKE $1 OR LOWER(u.display_name) LIKE $1 OR LOWER(u.bio) LIKE $1 `;
      params.push(search);
    }

    query += ` GROUP BY u.id ORDER BY received_count DESC, u.id ASC`;

    const result = await pool.query(query, params);
    res.json({ users: result.rows });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Server error retrieving users.' });
  }
});

// Get specific user by username
router.get('/:username', async (req, res) => {
  try {
    const username = req.params.username.toLowerCase();
    const query = `
      SELECT 
        u.id, 
        u.username, 
        u.display_name, 
        u.avatar_url, 
        u.bio, 
        u.prompt, 
        u.is_available,
        COUNT(m.id)::int as received_count
      FROM users u
      LEFT JOIN messages m ON u.id = m.recipient_id
      WHERE LOWER(u.username) = $1
      GROUP BY u.id
    `;

    const result = await pool.query(query, [username]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching user.' });
  }
});

function sanitizeText(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>?/gm, '').trim();
}

// Update profile prompt or bio
router.patch('/profile', requireAuth, async (req, res) => {
  try {
    const { prompt, bio, is_available } = req.body;
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (prompt !== undefined) {
      const cleanPrompt = sanitizeText(prompt);
      if (cleanPrompt.length > 120) {
        return res.status(400).json({ error: 'Prompt cannot exceed 120 characters.' });
      }
      updates.push(`prompt = $${paramIndex++}`);
      params.push(cleanPrompt);
    }
    if (bio !== undefined) {
      const cleanBio = sanitizeText(bio);
      if (cleanBio.length > 200) {
        return res.status(400).json({ error: 'Bio cannot exceed 200 characters.' });
      }
      updates.push(`bio = $${paramIndex++}`);
      params.push(cleanBio);
    }
    if (is_available !== undefined) {
      updates.push(`is_available = $${paramIndex++}`);
      params.push(Boolean(is_available));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields provided to update.' });
    }

    params.push(req.user.id);
    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      params
    );

    const updated = await pool.query(
      `SELECT id, username, display_name, avatar_url, bio, prompt, is_available
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    res.json({ user: updated.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error updating profile.' });
  }
});

export default router;

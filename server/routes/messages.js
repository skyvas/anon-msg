import { Router } from 'express';
import crypto from 'crypto';
import pool from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router();

// In-memory sliding rate limiter (20 messages per 60 seconds per IP, 200 in test mode)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_MESSAGES_PER_WINDOW = process.env.NODE_ENV === 'test' ? 200 : 20;

function checkRateLimit(ip) {
  const now = Date.now();
  const history = rateLimitMap.get(ip) || [];
  const recent = history.filter(ts => now - ts < RATE_LIMIT_WINDOW);

  if (recent.length >= MAX_MESSAGES_PER_WINDOW) {
    return false;
  }

  recent.push(now);
  rateLimitMap.set(ip, recent);
  return true;
}

// Clean up stale rate limit entries
setInterval(() => {
  const now = Date.now();
  for (const [ip, history] of rateLimitMap.entries()) {
    const recent = history.filter(ts => now - ts < RATE_LIMIT_WINDOW);
    if (recent.length === 0) {
      rateLimitMap.delete(ip);
    } else {
      rateLimitMap.set(ip, recent);
    }
  }
}, 5 * 60 * 1000);

function sanitizeText(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>?/gm, '').trim();
}

// POST /api/messages - Send a message to a recipient
router.post('/', async (req, res) => {
  try {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const ipHash = crypto.createHash('sha256').update(String(clientIp)).digest('hex').substring(0, 16);

    if (!checkRateLimit(ipHash)) {
      return res.status(429).json({
        error: 'Rate limit reached. Please wait a minute before sending another note.'
      });
    }

    const { recipient_id, content, is_anonymous, sender_name } = req.body;

    if (!recipient_id) {
      return res.status(400).json({ error: 'Recipient is required.' });
    }

    // Verify recipient exists
    const recipientRes = await pool.query('SELECT id, is_available FROM users WHERE id = $1', [recipient_id]);
    if (recipientRes.rows.length === 0) {
      return res.status(404).json({ error: 'Recipient user does not exist.' });
    }

    if (!recipientRes.rows[0].is_available) {
      return res.status(403).json({ error: 'This member is currently not accepting new messages.' });
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content cannot be empty.' });
    }

    // Security Hardening: Sanitize HTML to prevent Stored XSS
    const sanitizedContent = sanitizeText(content);
    if (sanitizedContent.length === 0) {
      return res.status(400).json({ error: 'Message content cannot be empty.' });
    }
    if (sanitizedContent.length > 500) {
      return res.status(400).json({ error: 'Message cannot exceed 500 characters.' });
    }

    // Default to anonymous
    let finalIsAnonymous = true;
    let finalSenderName = null;

    if (is_anonymous === false) {
      finalIsAnonymous = false;
      if (sender_name && typeof sender_name === 'string' && sender_name.trim().length > 0) {
        const cleanName = sanitizeText(sender_name);
        finalSenderName = cleanName.length > 0 ? cleanName.substring(0, 50) : 'Anonymous';
      } else {
        finalSenderName = 'Anonymous';
      }
    }

    const insertRes = await pool.query(
      `INSERT INTO messages (recipient_id, content, is_anonymous, sender_name, ip_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, is_anonymous, sender_name`,
      [recipient_id, sanitizedContent, finalIsAnonymous, finalSenderName, ipHash]
    );

    res.status(201).json({
      success: true,
      message_id: insertRes.rows[0].id,
      is_anonymous: insertRes.rows[0].is_anonymous,
      sender_name: insertRes.rows[0].sender_name
    });
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

// GET /api/inbox - Recipient messages
router.get('/inbox', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch messages addressed to this user only (ip_hash is stripped for privacy)
    const result = await pool.query(
      `SELECT id, content, is_anonymous, sender_name, is_read, is_favorite, created_at
       FROM messages
       WHERE recipient_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    const messages = result.rows;
    const total = messages.length;
    const unread = messages.filter(m => !m.is_read).length;
    const anonymous_count = messages.filter(m => m.is_anonymous).length;
    const named_count = total - anonymous_count;

    const stats = {
      total,
      unread,
      anonymous_count,
      named_count,
      anonymous_ratio: total > 0 ? Math.round((anonymous_count / total) * 100) : 0
    };

    res.json({
      messages,
      stats
    });
  } catch (err) {
    console.error('Error fetching inbox:', err);
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

// PATCH /api/inbox/:id/read - Toggle or set read status with strict IDOR prevention
router.patch('/inbox/:id/read', requireAuth, async (req, res) => {
  try {
    const messageId = parseInt(req.params.id, 10);
    if (isNaN(messageId)) {
      return res.status(400).json({ error: 'Invalid message ID.' });
    }

    const check = await pool.query('SELECT is_read FROM messages WHERE id = $1 AND recipient_id = $2', [messageId, req.user.id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found.' });
    }

    const currentRead = check.rows[0].is_read;
    const newRead = req.body.is_read !== undefined ? Boolean(req.body.is_read) : !currentRead;

    const updateRes = await pool.query(
      'UPDATE messages SET is_read = $1 WHERE id = $2 AND recipient_id = $3 RETURNING id, is_read',
      [newRead, messageId, req.user.id]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found.' });
    }

    res.json({ success: true, is_read: newRead });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update message.' });
  }
});

// PATCH /api/inbox/:id/favorite - Toggle favorite status with strict IDOR prevention
router.patch('/inbox/:id/favorite', requireAuth, async (req, res) => {
  try {
    const messageId = parseInt(req.params.id, 10);
    if (isNaN(messageId)) {
      return res.status(400).json({ error: 'Invalid message ID.' });
    }

    const check = await pool.query('SELECT is_favorite FROM messages WHERE id = $1 AND recipient_id = $2', [messageId, req.user.id]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found.' });
    }

    const newFavorite = !check.rows[0].is_favorite;
    const updateRes = await pool.query(
      'UPDATE messages SET is_favorite = $1 WHERE id = $2 AND recipient_id = $3 RETURNING id, is_favorite',
      [newFavorite, messageId, req.user.id]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found.' });
    }

    res.json({ success: true, is_favorite: newFavorite });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update message.' });
  }
});

// DELETE /api/inbox/:id - Delete a message with strict IDOR prevention
router.delete('/inbox/:id', requireAuth, async (req, res) => {
  try {
    const messageId = parseInt(req.params.id, 10);
    if (isNaN(messageId)) {
      return res.status(400).json({ error: 'Invalid message ID.' });
    }

    const deleteRes = await pool.query(
      'DELETE FROM messages WHERE id = $1 AND recipient_id = $2 RETURNING id',
      [messageId, req.user.id]
    );

    if (deleteRes.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found.' });
    }

    res.json({ success: true, message: 'Message deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete message.' });
  }
});

export default router;

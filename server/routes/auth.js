import { Router } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import { signToken, requireAuth } from '../auth.js';

const router = Router();

// In-memory rate limiting for brute-force protection
const failedAttempts = new Map(); // ip -> { count: number, resetTime: number }
const MAX_ATTEMPTS = process.env.NODE_ENV === 'test' ? 200 : 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip) {
  const now = Date.now();
  const record = failedAttempts.get(ip);
  if (!record) return { allowed: true };

  if (now > record.resetTime) {
    failedAttempts.delete(ip);
    return { allowed: true };
  }

  if (record.count >= MAX_ATTEMPTS) {
    const remainingMins = Math.ceil((record.resetTime - now) / 60000);
    return { allowed: false, remainingMins };
  }

  return { allowed: true };
}

function recordFailedAttempt(ip) {
  const now = Date.now();
  const record = failedAttempts.get(ip) || { count: 0, resetTime: now + LOCKOUT_WINDOW_MS };
  record.count += 1;
  record.resetTime = now + LOCKOUT_WINDOW_MS;
  failedAttempts.set(ip, record);
}

function resetFailedAttempts(ip) {
  failedAttempts.delete(ip);
}

// Dummy hash for constant-time comparison on non-existent users (prevents timing attacks)
const DUMMY_HASH = '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01234';

// Register new user
router.post('/register', async (req, res) => {
  const clientIp = req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress || 'unknown';
  const rateLimit = checkRateLimit(clientIp);
  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: `Too many attempts. Account creation temporarily locked for ${rateLimit.remainingMins} minutes.`
    });
  }

  try {
    const { username, display_name, password, bio, prompt, avatar_url } = req.body;

    if (!username || !display_name || !password) {
      return res.status(400).json({ error: 'Username, display name, and password are required.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
      return res.status(400).json({
        error: 'Username must be 3-20 characters long and contain only letters, numbers, and underscores.'
      });
    }

    // Security Hardening: Enforce 8+ characters, max 128 chars (DoS prevention)
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }
    if (password.length > 128) {
      return res.status(400).json({ error: 'Password cannot exceed 128 characters.' });
    }
    if (/^\s+$/.test(password)) {
      return res.status(400).json({ error: 'Password cannot consist solely of whitespace.' });
    }

    // Check if username exists
    const existing = await pool.query('SELECT id FROM users WHERE LOWER(username) = $1', [cleanUsername]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'That username is already taken. Please pick another.' });
    }

    const salt = bcrypt.genSaltSync(12);
    const password_hash = bcrypt.hashSync(password, salt);

    const defaultAvatar = avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`;
    const defaultPrompt = prompt && prompt.trim().length > 0 ? prompt.trim() : 'Send me an anonymous note';

    const insertRes = await pool.query(
      `INSERT INTO users (username, display_name, password_hash, avatar_url, bio, prompt, is_available)
       VALUES ($1, $2, $3, $4, $5, $6, true)
       RETURNING id, username, display_name, avatar_url, bio, prompt, is_available, created_at`,
      [cleanUsername, display_name.trim(), password_hash, defaultAvatar, bio ? bio.trim() : '', defaultPrompt]
    );

    const user = insertRes.rows[0];
    const token = signToken(user);
    resetFailedAttempts(clientIp);
    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error registering user.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const clientIp = req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress || 'unknown';
  const rateLimit = checkRateLimit(clientIp);
  if (!rateLimit.allowed) {
    return res.status(429).json({
      error: `Too many failed login attempts. Please try again in ${rateLimit.remainingMins} minutes.`
    });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Please enter both username and password.' });
    }

    if (typeof password !== 'string' || password.length > 128) {
      recordFailedAttempt(clientIp);
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const result = await pool.query('SELECT * FROM users WHERE LOWER(username) = $1', [cleanUsername]);

    // Constant-time execution against timing attacks when user does not exist
    if (result.rows.length === 0) {
      bcrypt.compareSync(password, DUMMY_HASH);
      recordFailedAttempt(clientIp);
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const user = result.rows[0];
    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      recordFailedAttempt(clientIp);
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Reset rate limiter on successful auth
    resetFailedAttempts(clientIp);

    const safeUser = {
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      bio: user.bio,
      prompt: user.prompt,
      is_available: user.is_available,
      created_at: user.created_at
    };

    const token = signToken(safeUser);
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// Get current session user
router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, display_name, avatar_url, bio, prompt, is_available, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching user profile.' });
  }
});

export default router;

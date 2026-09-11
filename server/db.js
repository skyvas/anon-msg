import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/anon_msg';

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' && !connectionString.includes('localhost') 
    ? { rejectUnauthorized: false } 
    : false
});

// Initialize PostgreSQL Tables
export async function initDb() {
  const client = await pool.connect();
  try {
    console.log('[PostgreSQL] Initializing database schema...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        avatar_url TEXT,
        bio TEXT,
        prompt TEXT DEFAULT 'Send me an anonymous note',
        is_available BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        is_anonymous BOOLEAN DEFAULT TRUE,
        sender_name VARCHAR(100),
        is_read BOOLEAN DEFAULT FALSE,
        is_favorite BOOLEAN DEFAULT FALSE,
        ip_hash VARCHAR(64),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_users_username ON users(LOWER(username));
      CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id, created_at DESC);
    `);

    // Check if initial users need to be seeded
    const countRes = await client.query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(countRes.rows[0].count, 10);

    if (userCount === 0) {
      console.log('[PostgreSQL] Seeding demo users and messages...');
      const salt = bcrypt.genSaltSync(12);
      const defaultPasswordHash = bcrypt.hashSync('Password123!', salt);

      const users = [
        {
          username: 'alex_dev',
          display_name: 'Alex Rivers',
          avatar_url: null,
          bio: 'Fullstack engineer and open-source tinkerer. Building modern web experiences.',
          prompt: 'Ask me anything about tech, career pivots, or what I really think of AI',
          is_available: true
        },
        {
          username: 'maya_design',
          display_name: 'Maya Chen',
          avatar_url: null,
          bio: 'Product Designer and design systems enthusiast. Typography and clean UI.',
          prompt: 'Send me honest portfolio critiques or design thoughts',
          is_available: true
        },
        {
          username: 'sam_founder',
          display_name: 'Samir Patel',
          avatar_url: null,
          bio: 'Founder and Angel Investor. Looking for wild ideas and fearless builders.',
          prompt: 'Pitch me an unhinged startup idea or ask for founder advice',
          is_available: true
        },
        {
          username: 'elena_music',
          display_name: 'Elena Rostova',
          avatar_url: null,
          bio: 'Indie producer and songwriter. Exploring synthwave and ambient soundscapes.',
          prompt: 'What song secretly moves you? Share your musical memories',
          is_available: true
        },
        {
          username: 'kai_photo',
          display_name: 'Kai Tanaka',
          avatar_url: null,
          bio: 'Street and portrait photographer based in Tokyo. Leica M shooter.',
          prompt: 'Tell me your favorite city street or an unforgettable visual memory',
          is_available: true
        }
      ];

      const userIds = {};
      for (const u of users) {
        const ins = await client.query(
          `INSERT INTO users (username, display_name, password_hash, avatar_url, bio, prompt, is_available)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
          [u.username, u.display_name, defaultPasswordHash, u.avatar_url, u.bio, u.prompt, u.is_available]
        );
        userIds[u.username] = ins.rows[0].id;
      }

      // Pre-seed demo messages without any Unicode emojis
      await client.query(
        `INSERT INTO messages (recipient_id, content, is_anonymous, sender_name, is_read, is_favorite, created_at)
         VALUES 
         ($1, 'I love how intuitive your open-source libraries are. Which stack do you predict will dominate 2027?', true, NULL, false, true, NOW() - INTERVAL '2 hours'),
         ($1, 'Honestly, that refactor you pushed yesterday saved our entire staging sprint! Huge thanks.', false, 'Jordan T.', true, true, NOW() - INTERVAL '1 day'),
         ($1, 'Secret confession: I still prefer simple SQL and relational models over distributed clusters for most apps.', true, NULL, false, false, NOW() - INTERVAL '3 days'),
         ($2, 'Your dark theme color palette is genuinely stunning. What inspired the cyber violet tones?', false, 'Liam Vance', false, true, NOW() - INTERVAL '5 hours'),
         ($2, 'I have a confession: I still copy button padding values from your public Figma files haha!', true, NULL, true, false, NOW() - INTERVAL '2 days')`,
        [userIds['alex_dev'], userIds['maya_design']]
      );

      console.log('[PostgreSQL] Database seeding complete.');
    }
  } catch (err) {
    console.error('[PostgreSQL] Database initialization error:', err);
    throw err;
  } finally {
    client.release();
  }
}

export default pool;

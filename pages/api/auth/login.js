import pool from '../../../lib/db.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    let client;
    try {
      client = await pool.connect();

      const users = await client.query(
        'SELECT id, password_hash FROM users WHERE username = $1',
        [username]
      );

      if (users.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      const user = users.rows[0];
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);

      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }

      const sessionId = uuidv4();
      await client.query(
        'INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES ($1, $2, NOW(), NOW() + INTERVAL \'30 days\')',
        [sessionId, user.id]
      );

      res.setHeader('Set-Cookie', `sessionId=${sessionId}; Path=/; HttpOnly; Max-Age=2592000`);
      return res.status(200).json({ message: 'Login successful', userId: user.id });
    } catch (error) {
      console.error('Login Error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    } finally {
      if (client) client.release();
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

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

      const existingUser = await client.query(
        'SELECT id FROM users WHERE username = $1',
        [username]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = uuidv4();

      await client.query(
        'INSERT INTO users (id, username, password_hash, created_at) VALUES ($1, $2, $3, NOW())',
        [userId, username, hashedPassword]
      );

      const checkin1Id = uuidv4();
      const checkin2Id = uuidv4();
      const checkin3Id = uuidv4();

      await client.query(
        'INSERT INTO checkins (id, user_id, checkin_number, is_completed, unlocked_at, completed_at) VALUES ($1, $2, $3, $4, NOW(), NULL)',
        [checkin1Id, userId, 1, false]
      );
      await client.query(
        'INSERT INTO checkins (id, user_id, checkin_number, is_completed, unlocked_at, completed_at) VALUES ($1, $2, $3, $4, NOW() + INTERVAL \'100 years\', NULL)',
        [checkin2Id, userId, 2, false]
      );
      await client.query(
        'INSERT INTO checkins (id, user_id, checkin_number, is_completed, unlocked_at, completed_at) VALUES ($1, $2, $3, $4, NOW() + INTERVAL \'100 years\', NULL)',
        [checkin3Id, userId, 3, false]
      );

      console.log('signup created user and checkins', {
        userId,
        username,
        checkins: [
          { id: checkin1Id, number: 1, unlocked_at: 'NOW()' },
          { id: checkin2Id, number: 2, unlocked_at: 'NOW()+100 years' },
          { id: checkin3Id, number: 3, unlocked_at: 'NOW()+100 years' }
        ]
      });

      const sessionId = uuidv4();
      await client.query(
        'INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES ($1, $2, NOW(), NOW() + INTERVAL \'30 days\')',
        [sessionId, userId]
      );

      res.setHeader('Set-Cookie', `sessionId=${sessionId}; Path=/; HttpOnly; Max-Age=2592000`);
      return res.status(201).json({ message: 'User created successfully', userId });
    } catch (error) {
      console.error('Signup Error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    } finally {
      if (client) client.release();
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

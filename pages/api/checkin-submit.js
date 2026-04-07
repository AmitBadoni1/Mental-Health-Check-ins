import pool from '../../lib/db.js';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { sessionId } = req.cookies;
    const { checkinId, data } = req.body;

    if (!sessionId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    let client;
    try {
      client = await pool.connect();

      const sessions = await client.query(
        'SELECT user_id FROM sessions WHERE id = $1 AND expires_at > NOW()',
        [sessionId]
      );

      if (sessions.rows.length === 0) {
        return res.status(401).json({ error: 'Session expired' });
      }

      const userId = sessions.rows[0].user_id;
      const checkins = await client.query(
        'SELECT checkin_number, unlocked_at FROM checkins WHERE id = $1 AND user_id = $2',
        [checkinId, userId]
      );

      if (checkins.rows.length === 0) {
        return res.status(404).json({ error: 'Check-in not found' });
      }

      const checkin = checkins.rows[0];
      if (new Date(checkin.unlocked_at) > new Date()) {
        return res.status(403).json({ error: 'This check-in is not yet unlocked' });
      }

      await client.query(
        'UPDATE checkins SET is_completed = true, completed_at = NOW() WHERE id = $1',
        [checkinId]
      );

      const dataId = uuidv4();
      await client.query(
        'INSERT INTO checkins_data (id, checkin_id, user_id, data, created_at) VALUES ($1, $2, $3, $4, NOW())',
        [dataId, checkinId, userId, JSON.stringify(data)]
      );

      const nextCheckinNumber = checkin.checkin_number + 1;
      const nextCheckins = await client.query(
        'SELECT id FROM checkins WHERE user_id = $1 AND checkin_number = $2',
        [userId, nextCheckinNumber]
      );

      if (nextCheckins.rows.length > 0) {
        await client.query(
          'UPDATE checkins SET unlocked_at = NOW() + INTERVAL \'3 days\' WHERE id = $1',
          [nextCheckins.rows[0].id]
        );
      }

      return res.status(200).json({ message: 'Check-in submitted successfully', dataId });
    } catch (error) {
      console.error('Submit Checkin Error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    } finally {
      if (client) client.release();
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

import pool from '../../lib/db.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { sessionId } = req.cookies;

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
        'SELECT id, checkin_number, is_completed, unlocked_at, completed_at FROM checkins WHERE user_id = $1 ORDER BY checkin_number',
        [userId]
      );

      const transformedCheckins = checkins.rows.map(c => ({
        id: c.id,
        number: c.checkin_number,
        isCompleted: c.is_completed,
        isUnlocked: c.checkin_number === 1 || new Date(c.unlocked_at) <= new Date(),
        completedAt: c.completed_at,
        unlocked_at: c.unlocked_at,
      }));

      return res.status(200).json({ checkins: transformedCheckins });
    } catch (error) {
      console.error('Get Checkins Error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    } finally {
      if (client) client.release();
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

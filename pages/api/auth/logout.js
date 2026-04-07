import pool from '../../../lib/db.js';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { sessionId } = req.body;

    let client;
    try {
      client = await pool.connect();
      await client.query('DELETE FROM sessions WHERE id = $1', [sessionId]);

      res.setHeader('Set-Cookie', 'sessionId=; Path=/; HttpOnly; Max-Age=0');
      return res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
      console.error('Logout Error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    } finally {
      if (client) client.release();
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export async function getAuthenticatedUser(req) {
  const { sessionId } = req.cookies;

  if (!sessionId) {
    return null;
  }

  const pool = require('./db');
  try {
    const connection = await pool.getConnection();
    const [sessions] = await connection.execute(
      'SELECT user_id FROM sessions WHERE id = ? AND expires_at > NOW()',
      [sessionId]
    );
    connection.release();

    if (sessions.length === 0) {
      return null;
    }

    return sessions[0].user_id;
  } catch (error) {
    console.error('Auth check error:', error);
    return null;
  }
}

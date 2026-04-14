import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { Pool } from 'pg';
import { uploadToS3 } from './lib/s3.js';
import { randomUUID } from 'crypto';

console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('S3_BUCKET_NAME:', process.env.S3_BUCKET_NAME);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 10,
});

async function testInsert() {
  try {
    // First, insert into users
    const userQuery = `
      INSERT INTO users (id, username, password_hash)
      VALUES ($1, $2, $3)
    `;
    const userValues = ['660e8400-e29b-41d4-a716-446655440001', 'testuser', 'dummyhash'];
    await pool.query(userQuery, userValues);
    console.log('User inserted');

    // First, insert into checkins
    const checkinQuery = `
      INSERT INTO checkins (id, user_id, checkin_number, is_completed, unlocked_at)
      VALUES ($1, $2, $3, $4, $5)
    `;
    const checkinValues = ['550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440001', 1, false, new Date()];
    await pool.query(checkinQuery, checkinValues);
    console.log('Checkin inserted');

    // Test data
    const testData = {
      baseline: { rating: 5, notes: 'Test baseline' },
      stroop: { rating: 4, notes: 'Test stroop' },
      deadline: { rating: 3, notes: 'Test deadline' },
      reading: { rating: 2, notes: 'Test reading' }
    };

    // Skip S3 upload for now, use dummy URL
    const audioUrl = 'https://example.com/test-audio.mp3';

    // Insert into database
    const query = `
      INSERT INTO checkins_data (id, checkin_id, user_id, data, audio_url, username, checkin_number)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
    `;
    const values = ['550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440001', JSON.stringify(testData), audioUrl, 'testuser', 1]; // Test data

    const result = await pool.query(query, values);
    console.log('Test insert successful:', result);

    // Verify by querying
    const verifyQuery = 'SELECT * FROM checkins_data WHERE checkin_id = $1';
    const verifyResult = await pool.query(verifyQuery, ['550e8400-e29b-41d4-a716-446655440000']);
    console.log('Verification result:', verifyResult.rows);

  } catch (error) {
    console.error('Test insert failed:', error);
  } finally {
    pool.end();
  }
}

testInsert();
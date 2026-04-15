import pool from '../../lib/db.js';
import { v4 as uuidv4 } from 'uuid';
import { uploadToS3 } from '../../lib/s3.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
  },
};

const base64ToBuffer = (base64) => Buffer.from(base64, 'base64');

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { sessionId } = req.cookies;
    const { checkinId, surveyResponses, audioData, audioUrls, submittedAt } = req.body;

    console.log('checkin-submit request', {
      method: req.method,
      checkinId,
      surveyResponses,
      audioDataKeys: audioData ? Object.keys(audioData) : [],
      submittedAt,
      contentLength: req.headers['content-length'],
    });

    if (!sessionId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!checkinId) {
      return res.status(400).json({ error: 'Missing checkinId' });
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
        'SELECT checkin_number, unlocked_at, is_completed FROM checkins WHERE id = $1 AND user_id = $2',
        [checkinId, userId]
      );

      if (checkins.rows.length === 0) {
        return res.status(404).json({ error: 'Check-in not found' });
      }

      const checkin = checkins.rows[0];
      console.log('checkin record', {
        checkinId,
        checkinNumber: checkin.checkin_number,
        unlocked_at: checkin.unlocked_at,
        is_completed: checkin.is_completed,
      });

      if (checkin.is_completed) {
        return res.status(400).json({ error: 'This check-in has already been completed' });
      }

      if (new Date(checkin.unlocked_at) > new Date()) {
        return res.status(403).json({ error: 'This check-in is not yet unlocked' });
      }

      const userResult = await client.query(
        'SELECT username FROM users WHERE id = $1',
        [userId]
      );

      const username = userResult.rows[0]?.username ?? 'unknown';
      const audioLinks = {};

      if (!audioData || Object.keys(audioData).length === 0) {
        console.warn('checkin-submit: no audioData received');
      }

      if (audioUrls?.baseline) {
        audioLinks.baseline = audioUrls.baseline;
      } else if (audioData?.baseline) {
        audioLinks.baseline = await uploadToS3(
          `${username}-checkin-${checkin.checkin_number}-baseline.wav`,
          base64ToBuffer(audioData.baseline),
          'audio/wav'
        );
        console.log('uploaded baseline', { url: audioLinks.baseline });
      }

      if (audioUrls?.stroop) {
        audioLinks.stroop = audioUrls.stroop;
      } else if (audioData?.stroop) {
        audioLinks.stroop = await uploadToS3(
          `${username}-checkin-${checkin.checkin_number}-stroop.wav`,
          base64ToBuffer(audioData.stroop),
          'audio/wav'
        );
        console.log('uploaded stroop', { url: audioLinks.stroop });
      }

      if (audioUrls?.deadline) {
        audioLinks.deadline = audioUrls.deadline;
      } else if (audioData?.deadline) {
        audioLinks.deadline = await uploadToS3(
          `${username}-checkin-${checkin.checkin_number}-deadline.wav`,
          base64ToBuffer(audioData.deadline),
          'audio/wav'
        );
        console.log('uploaded deadline', { url: audioLinks.deadline });
      }

      if (audioUrls?.reading) {
        audioLinks.reading = audioUrls.reading;
      } else if (audioData?.reading) {
        audioLinks.reading = await uploadToS3(
          `${username}-checkin-${checkin.checkin_number}-reading.wav`,
          base64ToBuffer(audioData.reading),
          'audio/wav'
        );
        console.log('uploaded reading', { url: audioLinks.reading });
      }

      await client.query(
        'UPDATE checkins SET is_completed = true, completed_at = NOW() WHERE id = $1',
        [checkinId]
      );

      const payload = {
        username,
        checkinNumber: checkin.checkin_number,
        survey1: surveyResponses?.pre ?? null,
        survey2a: surveyResponses?.reaction ?? null,
        survey2b: surveyResponses?.deadline ?? null,
        survey3: surveyResponses?.post ?? null,
        audioTask1Baseline: audioLinks.baseline ?? null,
        audioTask2Stroop: audioLinks.stroop ?? null,
        audioTask3Deadline: audioLinks.deadline ?? null,
        audioTask4Reading: audioLinks.reading ?? null,
        submittedAt,
      };

      const dataId = uuidv4();
      await client.query(
        `INSERT INTO checkins_data (
          id, checkin_id, user_id, data, username, checkin_number,
          survey1, survey2a, survey2b, survey3,
          audio_task1_baseline, audio_task2_stroop, audio_task3_deadline, audio_task4_reading,
          submitted_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          dataId,
          checkinId,
          userId,
          JSON.stringify(payload),
          username,
          checkin.checkin_number,
          surveyResponses?.pre ?? null,
          surveyResponses?.reaction ?? null,
          surveyResponses?.deadline ?? null,
          surveyResponses?.post ?? null,
          audioLinks.baseline ?? null,
          audioLinks.stroop ?? null,
          audioLinks.deadline ?? null,
          audioLinks.reading ?? null,
          submittedAt,
        ]
      );

      const nextCheckinNumber = checkin.checkin_number + 1;
      const nextCheckins = await client.query(
        'SELECT id FROM checkins WHERE user_id = $1 AND checkin_number = $2',
        [userId, nextCheckinNumber]
      );

      if (nextCheckins.rows.length > 0) {
        await client.query(
          'UPDATE checkins SET unlocked_at = NOW() WHERE id = $1',
          [nextCheckins.rows[0].id]
        );
        console.log('unlocked next checkin', { nextCheckinId: nextCheckins.rows[0].id });
      }

      console.log('checkin-submit success', { dataId, audioLinks });
      return res.status(200).json({ message: 'Check-in submitted successfully', dataId });
    } catch (error) {
      console.error('Submit Checkin Error:', error);
      return res.status(500).json({ error: error.message || 'Internal server error' });
    } finally {
      if (client) client.release();
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

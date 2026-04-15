import { uploadToS3 } from '../../lib/s3.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

const base64ToBuffer = (base64) => Buffer.from(base64, 'base64');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { fileName, base64Audio, fileType } = req.body;

  if (!fileName || !base64Audio || !fileType) {
    return res.status(400).json({ error: 'Missing fileName, base64Audio, or fileType' });
  }

  try {
    const url = await uploadToS3(
      fileName,
      base64ToBuffer(base64Audio),
      fileType
    );

    return res.status(200).json({ url });
  } catch (error) {
    console.error('checkin-upload error', error);
    return res.status(500).json({ error: error.message || 'Failed to upload audio' });
  }
}

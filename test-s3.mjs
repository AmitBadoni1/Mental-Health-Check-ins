import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { uploadToS3 } from './lib/s3.js';
import { randomUUID } from 'crypto';

async function testS3() {
  try {
    const dummyAudio = Buffer.from('This is a test audio file', 'utf8');
    const audioUrl = await uploadToS3(dummyAudio, `test-${randomUUID()}.txt`);
    console.log('S3 upload successful:', audioUrl);
  } catch (error) {
    console.error('S3 upload failed:', error);
  }
}

testS3();
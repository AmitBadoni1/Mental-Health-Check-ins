const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const uploadToS3 = async (fileName, fileBuffer, fileType) => {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `checkins/${Date.now()}-${fileName}`,
    Body: fileBuffer,
    ContentType: fileType,
  };

  try {
    const data = await s3.upload(params).promise();
    return data.Location; // Return the S3 URL
  } catch (error) {
    console.error('S3 Upload Error:', error);
    throw error;
  }
};

module.exports = { uploadToS3 };

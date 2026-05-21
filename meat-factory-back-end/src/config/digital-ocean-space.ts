import { S3Client } from '@aws-sdk/client-s3';
import config from '../config';
const { SPACE_ACCESS_KEY, SPACE_ENDPOINT, SPACE_REGION, SPACE_SECRET_KEY } =
  config;

export const client: S3Client = new S3Client({
  forcePathStyle: false,
  endpoint: SPACE_ENDPOINT,
  region: SPACE_REGION,
  credentials: {
    accessKeyId: SPACE_ACCESS_KEY,
    secretAccessKey: SPACE_SECRET_KEY
  }
});

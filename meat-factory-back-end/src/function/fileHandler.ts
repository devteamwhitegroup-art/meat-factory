import { client } from '../config/digital-ocean-space';
import {
  DeleteObjectCommand,
  DeleteObjectCommandInput,
  DeleteObjectCommandOutput,
  PutObjectCommand,
  PutObjectCommandInput,
  PutObjectCommandOutput
} from '@aws-sdk/client-s3';
import config from '../config';
import { ALLOWED_FILE_EXT, FILE_FOLDER } from '../types/global/file.type';
const { SPACE_BUCKET_NAME } = config;

// `file-type` is ESM-only. With tsconfig `module: commonjs` a normal dynamic
// `import()` is downleveled to `require()`, which throws ERR_REQUIRE_ESM at
// runtime. `new Function` preserves a genuine ESM `import()` through TS
// transpilation, without `eval`'s surrounding-scope capture.
const importEsm = new Function(
  'specifier',
  'return import(specifier)'
) as <T>(specifier: string) => Promise<T>;

// Build a storage key foldered by upload purpose:
//   <folder>/<yyyy>/<mm>/<timestamp>_<sanitized-name>
export const buildFileKey = (
  folder: FILE_FOLDER,
  originalName: string
): string => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const safe = (originalName || 'file')
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(-80);
  return `${folder}/${yyyy}/${mm}/${now.getTime()}_${safe}`;
};

export const removeObject = async (
  key: string
): Promise<DeleteObjectCommandOutput> => {
  const params: DeleteObjectCommandInput = {
    Bucket: SPACE_BUCKET_NAME,
    Key: key
  };

  try {
    return await client.send(new DeleteObjectCommand(params));
  } catch (error) {
    console.error('Error removing object:', error);
    throw error;
  }
};

export const putObject = async ({
  key,
  file,
  meta = {},
  contentType
}: {
  key: string;
  file: PutObjectCommandInput['Body'];
  meta?: Record<string, string>;
  contentType?: string;
}): Promise<PutObjectCommandOutput> => {
  const params: PutObjectCommandInput = {
    Bucket: SPACE_BUCKET_NAME,
    Key: key,
    Body: file,
    ACL: 'public-read',
    Metadata: Object.keys(meta).length > 0 ? meta : undefined,
    ContentType: contentType
  };

  try {
    return await client.send(new PutObjectCommand(params));
  } catch (error) {
    console.error('Error putting object:', error);
    throw error;
  }
};

export const checkFile = async (buffer: Buffer): Promise<string> => {
  const { fileTypeFromBuffer } = await importEsm<typeof import('file-type')>(
    'file-type'
  );

  const file_type = await fileTypeFromBuffer(buffer);
  if (!file_type) throw new Error('Unable to determine file type');
  if (!file_type?.ext) throw new Error('Unknown or unsupported file extension');

  if (!ALLOWED_FILE_EXT.includes(file_type?.ext))
    throw new Error('Unsupported file type');

  return file_type?.ext;
};

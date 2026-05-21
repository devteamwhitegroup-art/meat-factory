import { Request, Response, Router } from 'express';
import Multer from 'multer';

import { putObject, checkFile, buildFileKey } from '../function/fileHandler';
import { FileController } from '../controller/global/file.controller';
import { AdminController } from '../controller/user/admin.controller';
import { FILE_FOLDER } from '../types/global/file.type';
import config from '../config';

const { SPACE_BUCKET_NAME } = config;
const upload = Multer();
const router = Router();

const asyncHandler =
  (fn: Function) =>
  (req: Request, res: Response, next: (err?: any) => void) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Best-effort: decode the bare Authorization token to stamp who uploaded.
// Does not block the upload if absent/invalid (auth hardening is separate).
const resolveUploaderId = async (
  authorization?: string
): Promise<string | undefined> => {
  if (!authorization) return undefined;
  try {
    const info = await AdminController.getTokenInfo(authorization);
    return info?.id;
  } catch {
    return undefined;
  }
};

router.post(
  '/upload',
  upload.single('file'),
  asyncHandler(async (req: any, res: Response) => {
    const authorization = req.headers['authorization'];
    const file = req.file;
    const folder = req.body?.type as FILE_FOLDER | undefined;

    if (!file) {
      return res
        .status(400)
        .json({ success: false, message: 'Файл оруулаагүй байна' });
    }
    if (!folder) {
      return res
        .status(400)
        .json({ success: false, message: 'Файлын төрөл оруулаагүй байна' });
    }
    if (!Object.values(FILE_FOLDER).includes(folder)) {
      return res.status(400).json({
        success: false,
        message: `Файлын төрөл буруу байна. Зөвшөөрөгдсөн: ${Object.values(
          FILE_FOLDER
        ).join(', ')}`
      });
    }

    const ext = await checkFile(file.buffer);
    const key = buildFileKey(folder, file.originalname);
    const url = `https://${SPACE_BUCKET_NAME}.sgp1.digitaloceanspaces.com/${key}`;

    const uploadedBy = await resolveUploaderId(authorization);

    const fileDb = await FileController.createFile({
      key,
      size: file.buffer.byteLength,
      url,
      mimetype: ext
    });

    await putObject({
      key,
      file: file.buffer,
      contentType: file.mimetype,
      // Stamp the object for clarity / audit.
      meta: {
        folder,
        originalName: file.originalname ?? '',
        uploadedAt: new Date().toISOString(),
        ...(uploadedBy ? { uploadedBy } : {})
      }
    });

    res.status(200).json({
      success: true,
      message: 'Амжилттай',
      id: fileDb.id
    });
  })
);

router.use((error: Error, _: Request, res: Response, __: Function) => {
  console.error('Upload router error:', error);
  res.status(500).json({
    success: false,
    message: error.message || 'Internal server error'
  });
});

export default router;

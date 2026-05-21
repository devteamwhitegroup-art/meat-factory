import fs from 'node:fs';
import path from 'node:path';

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export const pagination = (
  doc: PaginationParams
): { offset: number; limit: number } => {
  const page = doc.page ?? 1;
  const limit = doc.limit ?? 10;

  const data = {
    offset: (page - 1) * limit,
    limit
  };
  return data;
};

export const getAppRootDir = () => {
  let currentDir = __dirname;
  while (!fs.existsSync(path.join(currentDir, 'package.json'))) {
    currentDir = path.join(currentDir, '..');
  }
  return currentDir;
};

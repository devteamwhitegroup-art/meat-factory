export type TFile = {
  id: string;

  key: string;
  size: number;
  url: string | null;
  mimetype: string;

  createdAt: Date;
  updatedAt: Date;
};

export type TCreateFile = Omit<TFile, 'id' | 'createdAt' | 'updatedAt'>;

// Upload folders — each upload purpose gets its own path prefix in storage
// (e.g. `scale/2026/05/...`). Short names per the meat-factory workflow.
export enum FILE_FOLDER {
  REGISTER = 'register', // intake / herder photo
  HERD = 'herd', // herder docs
  SCALE = 'scale', // weighing photos
  BYPRODUCT = 'byproduct', // дайвар photos
  VERIFY = 'verify', // verification photos
  SETTLEMENT = 'settlement', // тооцоо / receipts
  SHIPMENT = 'shipment', // ачилт / loading photos
  STAFF = 'staff', // staff avatars
  OTHER = 'other'
}

export const ALLOWED_FILE_EXT = ['mp4', 'jpg', 'jpeg', 'png', 'gif'];

"use client";

import { useState } from "react";

export type UploadFolder =
  | "register"
  | "herd"
  | "scale"
  | "byproduct"
  | "verify"
  | "settlement"
  | "shipment"
  | "staff"
  | "other";

type UploadResult = { success: boolean; message?: string; id?: string };

// Centralises the multipart POST to /api/file-upload shared by PhotoUpload,
// PhotoCaptureButton and SignaturePad. Returns the new fileId on success;
// throws with the server/network message on failure so each caller decides
// how to surface it (toast, inline, reset preview, …).
export function useFileUpload(type: UploadFolder) {
  const [uploading, setUploading] = useState(false);

  async function upload(file: File): Promise<string> {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", type);
      const res = await fetch("/api/file-upload", { method: "POST", body: fd });
      const data = (await res.json()) as UploadResult;
      if (!data.success || !data.id) {
        throw new Error(data.message ?? "Файл ачаалах амжилтгүй");
      }
      return data.id;
    } finally {
      setUploading(false);
    }
  }

  return { upload, uploading };
}

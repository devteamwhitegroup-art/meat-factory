import { cookies } from 'next/headers';
import { env } from '@/lib/env';

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'video/mp4',
]);
const ALLOWED_TYPE = new Set([
  'register',
  'herd',
  'scale',
  'byproduct',
  'verify',
  'settlement',
  'shipment',
  'staff',
  'other',
]);

// Multipart proxy to the back-end POST /file/upload. The back-end returns
// { success, message, id } — we forward that verbatim. The browser caller
// then passes `id` as `photoFileId` to the createRegistration mutation.
export async function POST(request: Request) {
  const jar = await cookies();
  const token = jar.get(env.AUTH_COOKIE_NAME)?.value ?? '';
  if (!token) {
    return Response.json(
      { success: false, message: 'Not authenticated' },
      { status: 401 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json(
      { success: false, message: 'Хүсэлт буруу байна' },
      { status: 400 },
    );
  }

  const file = form.get('file');
  const type = String(form.get('type') ?? '');

  if (!(file instanceof File)) {
    return Response.json(
      { success: false, message: 'Файл оруулаагүй байна' },
      { status: 400 },
    );
  }
  if (!ALLOWED_TYPE.has(type)) {
    return Response.json(
      { success: false, message: 'Файлын төрөл буруу байна' },
      { status: 400 },
    );
  }
  if (file.type && !ALLOWED_MIME.has(file.type)) {
    return Response.json(
      { success: false, message: `Дэмжигдэхгүй файлын төрөл: ${file.type}` },
      { status: 400 },
    );
  }

  const fd = new FormData();
  fd.append('file', file, file.name);
  fd.append('type', type);

  const upstream = await fetch(env.FILE_UPLOAD_UPSTREAM_URL, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` }, // fetch sets multipart boundary itself
    body: fd,
    cache: 'no-store',
  });

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      'content-type':
        upstream.headers.get('content-type') ?? 'application/json',
    },
  });
}

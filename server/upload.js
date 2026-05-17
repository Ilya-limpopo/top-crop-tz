// File-upload endpoint. Stores files under /uploads/<sha256-slice>.<ext>
// — content-hashed filenames give deduplication and immutability for free.
//
// Limits per README §3.3:
//   - JPG/PNG/WebP up to 10 MB
//   - MP4/WebM up to 25 MB

import express from 'express';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { existsSync, renameSync, mkdirSync } from 'node:fs';
import { requireApiAuth } from './auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, '..');
// In production we point UPLOADS_DIR at a persistent volume
// (e.g. Railway mounts a volume at /data and we set UPLOADS_DIR=/data/uploads).
// Locally we keep the prototype's uploads/ folder so existing references work.
export const UPLOADS = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(ROOT, 'uploads');
mkdirSync(UPLOADS, { recursive: true });

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm']);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 25 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: UPLOADS,
  filename: (_req, file, cb) => {
    // Temporary name; we rename to the content hash after the bytes land.
    cb(null, `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_VIDEO_BYTES }, // multer enforces upper bound only
  fileFilter: (_req, file, cb) => {
    if (IMAGE_TYPES.has(file.mimetype) || VIDEO_TYPES.has(file.mimetype)) cb(null, true);
    else cb(new Error('unsupported_type'));
  },
});

function extFor(mime) {
  switch (mime) {
    case 'image/jpeg': return '.jpg';
    case 'image/png':  return '.png';
    case 'image/webp': return '.webp';
    case 'video/mp4':  return '.mp4';
    case 'video/webm': return '.webm';
    default: return '';
  }
}

export const uploadRouter = express.Router();
uploadRouter.use(requireApiAuth);

uploadRouter.post('/upload', upload.single('file'), async (req, res) => {
  const f = req.file;
  if (!f) return res.status(400).json({ ok: false, error: 'no_file' });

  // Manual size check by category (multer's single limit is the videogib max).
  const isImage = IMAGE_TYPES.has(f.mimetype);
  const isVideo = VIDEO_TYPES.has(f.mimetype);
  const max = isImage ? MAX_IMAGE_BYTES : (isVideo ? MAX_VIDEO_BYTES : 0);
  if (!max || f.size > max) {
    return res.status(413).json({ ok: false, error: 'file_too_large', max });
  }

  // Hash the bytes to derive the permanent name.
  const fs = await import('node:fs/promises');
  const buf = await fs.readFile(f.path);
  const sha = createHash('sha256').update(buf).digest('hex').slice(0, 16);
  const finalName = `${sha}${extFor(f.mimetype)}`;
  const finalPath = path.join(UPLOADS, finalName);

  if (existsSync(finalPath)) {
    // Same bytes already on disk; drop the temp.
    await fs.unlink(f.path).catch(() => {});
  } else {
    renameSync(f.path, finalPath);
  }

  res.json({
    ok: true,
    url: `uploads/${finalName}`,   // relative path matches the prototype's convention
    bytes: f.size,
    mime: f.mimetype,
  });
});

// Multer's own errors hit the global error handler; surface them as JSON.
export function uploadErrorHandler(err, _req, res, next) {
  if (!err) return next();
  if (err instanceof multer.MulterError) {
    return res.status(413).json({ ok: false, error: err.code });
  }
  if (err.message === 'unsupported_type') {
    return res.status(415).json({ ok: false, error: 'unsupported_type' });
  }
  next(err);
}

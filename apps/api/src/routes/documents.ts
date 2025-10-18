import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import axios from "axios";
import FormData from "form-data";
import { requireAuth } from "../middleware/auth.js";
import { cfg } from "../config.js";
import { logger } from "../services/logger.js";

const uploadDir = "/data/docs";
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    try {
      fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (err) {
      cb(err as Error, uploadDir);
    }
  },
  filename: (_req, file, cb) => {
    const sanitized = file.originalname.replace(/[^\w.\-.]+/g, "_");
    cb(null, `${Date.now()}_${sanitized}`);
  },
});

const upload = multer({ storage });
const router = Router();

router.post("/upload", requireAuth, upload.single("file"), async (req, res) => {
  const startTime = Date.now();
  const user = (req as any).user as { uid: string; roles: string[]; email: string };
  const requestId = (req as any).requestId;
  const { roles } = req.body as { roles?: string };
  const file = req.file;
  
  if (!file) {
    logger.warn('No file provided in upload', { requestId, userId: user.uid });
    return res.status(400).json({ error: "missing file" });
  }

  // File validation
  const allowedTypes = ['.pdf', '.docx', '.md', '.txt', '.markdown'];
  const fileExt = path.extname(file.originalname).toLowerCase();
  if (!allowedTypes.includes(fileExt)) {
    logger.warn('Invalid file type uploaded', { 
      requestId, 
      userId: user.uid, 
      filename: file.originalname, 
      fileType: fileExt 
    });
    return res.status(400).json({ error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}` });
  }

  // File size validation (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    logger.warn('File too large', { 
      requestId, 
      userId: user.uid, 
      filename: file.originalname, 
      fileSize: file.size 
    });
    return res.status(400).json({ error: "File too large (max 10MB)" });
  }

  const form = new FormData();
  const roleList = roles ? roles.split(',').map(r => r.trim()).filter(Boolean) : ['all'];
  form.append("roles", roleList.join(','));
  form.append("file", fs.createReadStream(file.path), file.originalname);

  logger.info('Document upload started', { 
    requestId, 
    userId: user.uid, 
    filename: file.originalname, 
    fileSize: file.size,
    roles: roleList 
  });

  try {
    const r = await axios.post(`${cfg.inferenceBase}/rag/ingest`, form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
      timeout: 120000,
    });
    
    const duration = Date.now() - startTime;
    logger.documentUpload(user.uid, file.originalname, roleList, r.data.chunks);
    logger.info('Document upload completed', { 
      requestId, 
      userId: user.uid, 
      filename: file.originalname, 
      duration,
      chunks: r.data.chunks 
    });
    
    res.json({ ok: true, index: r.data });
  } catch (err: any) {
    const duration = Date.now() - startTime;
    const status = err?.response?.status || 500;
    const message =
      err?.response?.data?.error ||
      err?.message ||
      "Failed to forward document to inference service";
    
    logger.error('Document upload failed', { 
      requestId, 
      userId: user.uid, 
      filename: file.originalname, 
      duration,
      error: message,
      status 
    });
    
    res.status(status).json({ error: message });
  } finally {
    // remove temp file once proxied
    fs.promises.unlink(file.path).catch((cleanupErr) => {
      logger.warn('Failed to cleanup temp file', { 
        requestId, 
        userId: user.uid, 
        filename: file.originalname,
        error: cleanupErr.message 
      });
    });
  }
});

export default router;

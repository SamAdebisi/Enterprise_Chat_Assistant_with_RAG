import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth.js";
import axios from "axios";
import { cfg } from "../config.js";
import FormData from "form-data";
import fs from "fs";

const upload = multer({ dest: "/data/docs" });
const router = Router();

router.post("/upload", requireAuth, upload.single("file"), async (req, res) => {
  const { roles } = req.body as { roles?: string };
  const file = req.file;
  if (!file) return res.status(400).json({ error: "missing file" });

  const form = new FormData();
  form.append("roles", roles || "all");
  form.append("file", fs.createReadStream(file.path), file.originalname);

  // cfg.inferenceBase resolves to:
  // - docker-compose: http://inference:8000 (set via compose env)
  // - k8s: http://enterprise-chat-assistant-with-rag-inference:8000 (set via Deployment env)
  const r = await axios.post(`${cfg.inferenceBase}/rag/ingest`, form, {
    headers: form.getHeaders(),
    maxBodyLength: Infinity,
  });
  res.json({ ok: true, index: r.data });
});

export default router;

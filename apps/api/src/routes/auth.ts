import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cfg } from "../config.js";
import { findUserByEmail, upsertUser } from "../services/firestore.js";
import type { JwtUser, Role } from "../types.js";
const router = Router();

router.post("/seed", async (_req, res) => {
  const users = [
    { uid: "u1", email: "alice@company.com", roles: ["sales"], password: await bcrypt.hash("pass1234", 10) },
    { uid: "u2", email: "bob@company.com", roles: ["engineering"], password: await bcrypt.hash("pass1234", 10) }
  ];
  for (const u of users) await upsertUser(u.uid, u);
  res.json({ ok: true });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  const user = await findUserByEmail(email);
  if (!user) return res.status(401).json({ error: "invalid credentials" });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: "invalid credentials" });
  const payload: JwtUser = { uid: user.id, email, roles: (user.roles || ["all"]) as Role[] };
  const token = jwt.sign(payload, cfg.jwtSecret, { expiresIn: "12h" });
  res.json({ token, user: payload });
});

export default router;

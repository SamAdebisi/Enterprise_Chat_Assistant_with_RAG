import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { cfg } from "../config.js";
import { JwtUser } from "../types.js";

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const h = req.headers.authorization;
  if (!h) return res.status(401).json({ error: "missing auth" });
  const token = h.replace("Bearer ", "");
  try {
    const user = jwt.verify(token, cfg.jwtSecret) as JwtUser;
    (req as any).user = user;
    return next();
  } catch {
    return res.status(401).json({ error: "invalid token" });
  }
};

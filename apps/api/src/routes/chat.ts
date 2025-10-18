import { Router } from "express";
import { Server } from "socket.io";
import { requireAuth } from "../middleware/auth.js";
import { ragQuery } from "../services/inference.js";
import { saveChatTurn } from "../services/firestore.js";
import { logger } from "../services/logger.js";

export default (io: Server) => {
  const router = Router();

  router.post("/ask", requireAuth, async (req, res) => {
    const startTime = Date.now();
    const user = (req as any).user as { uid: string; roles: string[]; email: string };
    const requestId = (req as any).requestId;
    const body = req.body as { question?: unknown; chatId?: unknown };
    
    // Input validation
    const question = typeof body.question === "string" ? body.question.trim() : "";
    if (!question) {
      logger.warn('Empty question provided', { requestId, userId: user.uid });
      return res.status(400).json({ error: "question is required" });
    }
    
    if (question.length > 1000) {
      logger.warn('Question too long', { requestId, userId: user.uid, questionLength: question.length });
      return res.status(400).json({ error: "question too long (max 1000 characters)" });
    }
    
    const chatId = typeof body.chatId === "string" && body.chatId.trim() ? body.chatId : undefined;
    const chat_id = chatId || `chat_${user.uid}_${Date.now()}`;
    
    logger.chatStart(user.uid, chat_id, question);
    io.to(user.uid).emit("typing", { chatId: chat_id });
    
    try {
      const result = await ragQuery({ question, roles: user.roles, chat_id, user_id: user.uid });
      
      // Save chat turns
      await Promise.all([
        saveChatTurn(chat_id, { role: "user", content: question, uid: user.uid, roles: user.roles }),
        saveChatTurn(chat_id, { role: "assistant", content: result.answer, sources: result.sources })
      ]);
      
      const duration = Date.now() - startTime;
      logger.chatEnd(user.uid, chat_id, true, duration);
      
      io.to(user.uid).emit("answer", { chatId: chat_id, ...result });
      res.json({ chatId: chat_id, ...result });
    } catch (err: any) {
      const duration = Date.now() - startTime;
      const message = err?.message || "Failed to fetch answer from inference service";
      
      logger.chatEnd(user.uid, chat_id, false, duration, err);
      io.to(user.uid).emit("error", { chatId: chat_id, error: message });
      res.status(502).json({ error: message });
    }
  });

  return router;
};

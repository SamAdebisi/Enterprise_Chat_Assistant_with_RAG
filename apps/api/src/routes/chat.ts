import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { ragQuery } from "../services/inference.js";
import { saveChatTurn } from "../services/firestore.js";
import { Server } from "socket.io";
const router = Router();

export default (io: Server) => {
  router.post("/ask", requireAuth, async (req, res) => {
    const user = (req as any).user as { uid: string; roles: string[]; email: string };
    const { question, chatId } = req.body as { question: string; chatId?: string };
    const chat_id = chatId || `chat_${user.uid}_${Date.now()}`;
    io.to(user.uid).emit("typing", { chatId: chat_id });
    const result = await ragQuery({ question, roles: user.roles, chat_id, user_id: user.uid });
    await saveChatTurn(chat_id, { role: "user", content: question, uid: user.uid, roles: user.roles });
    await saveChatTurn(chat_id, { role: "assistant", content: result.answer, sources: result.sources });
    io.to(user.uid).emit("answer", { chatId: chat_id, ...result });
    res.json({ chatId: chat_id, ...result });
  });
  return router;
};

import axios from "axios";
import { cfg } from "../config.js";
export const ragQuery = async (payload: {
  question: string; roles: string[]; top_k?: number; stream?: boolean; chat_id?: string; user_id?: string;
}) => axios.post(`${cfg.inferenceBase}/rag/query`, payload, { timeout: 60000 }).then(r => r.data);

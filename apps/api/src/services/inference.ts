import axios from "axios";
import { cfg } from "../config.js";

interface RagPayload {
  question: string;
  roles: string[];
  top_k?: number;
  stream?: boolean;
  chat_id?: string;
  user_id?: string;
}

export const ragQuery = async (payload: RagPayload) => {
  try {
    const response = await axios.post(`${cfg.inferenceBase}/rag/query`, payload, {
      timeout: 60000,
    });
    return response.data;
  } catch (err: any) {
    const message =
      err?.response?.data?.error || err?.message || "Inference service unavailable";
    throw new Error(message);
  }
};

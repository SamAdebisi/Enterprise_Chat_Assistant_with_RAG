import type { LoginResponse, UploadResponse } from "../types";
import { API } from "../api";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AskPayload {
  token: string;
  question: string;
  chatId?: string;
}

export interface AskResponse {
  chatId: string;
  answer: string;
  sources: Array<{ title: string; score?: number; path?: string; roles?: string[] }>;
}

export interface UploadPayload {
  token: string;
  file: File;
  roles: string[];
}

const authHeaders = (token: string) => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const AuthClient = {
  async seedDemo() {
    await API.post("/auth/seed");
  },

  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await API.post<LoginResponse>("/auth/login", payload);
    return data;
  },
};

export const ChatClient = {
  async ask({ token, question, chatId }: AskPayload): Promise<AskResponse> {
    const { data } = await API.post<{ chatId: string; answer: string; sources: AskResponse["sources"] }>(
      "/chat/ask",
      { question, chatId },
      authHeaders(token),
    );
    return data;
  },
};

export const DocumentsClient = {
  async upload({ token, file, roles }: UploadPayload): Promise<UploadResponse> {
    const form = new FormData();
    form.append("file", file);
    form.append("roles", roles.join(","));
    const auth = authHeaders(token).headers;
    const { data } = await API.post<UploadResponse>("/documents/upload", form, {
      headers: {
        ...auth,
        // let the browser set multipart boundary automatically
      },
    });
    return data;
  },
};

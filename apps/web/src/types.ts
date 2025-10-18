export interface UserProfile {
  uid: string;
  email: string;
  roles: string[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: Array<{ title: string; score?: number; path?: string; roles?: string[] }>;
}

export interface LoginResponse {
  token: string;
  user: UserProfile;
}

export interface UploadResponse {
  ok: boolean;
  index: { ok: boolean; chunks?: number } | any;
}

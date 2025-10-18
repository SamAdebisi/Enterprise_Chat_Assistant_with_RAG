import React, { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { io } from "socket.io-client";
import Message from "../components/Message";
import ChatInput from "../components/ChatInput";
import { API } from "../api";
import { ChatClient, DocumentsClient, type AskResponse } from "../api/client";
import type { ChatMessage, UserProfile } from "../types";

interface ChatProps {
  token: string;
  user: UserProfile;
  onLogout: () => void;
}

export default function Chat({ token, user, onLogout }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typing, setTyping] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState("all");
  const [uploading, setUploading] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(API.defaults.baseURL ?? "http://localhost:8080", {
      transports: ["websocket"],
    });
    socketRef.current = socket;
    socket.on("connect", () => socket.emit("join", user.uid));
    socket.on("typing", () => setTyping(true));
    socket.on("answer", (payload: AskResponse) => {
      setTyping(false);
      setChatId(payload.chatId);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: payload.answer, sources: payload.sources },
      ]);
    });
    socket.on("error", (payload: { error: string }) => {
      setTyping(false);
      setError(payload.error);
    });
    return () => {
      socket.disconnect();
    };
  }, [token, user.uid]);

  const appendMessage = (message: ChatMessage) => {
    setMessages((m) => [...m, message]);
  };

  const ask = async (rawQuestion: string) => {
    const question = rawQuestion.trim();
    if (!question) return;
    setError(null);
    appendMessage({ role: "user", content: question });
    setTyping(true);
    try {
      const resp = await ChatClient.ask({
        token,
        question,
        chatId: chatId ?? undefined,
      });
      setChatId(resp.chatId);
      const socketConnected = socketRef.current?.connected;
      if (!socketConnected) {
        appendMessage({ role: "assistant", content: resp.answer, sources: resp.sources });
        setTyping(false);
      }
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || "Unable to retrieve answer";
      setTyping(false);
      setError(message);
      appendMessage({ role: "assistant", content: `⚠️ ${message}` });
    }
  };

  const handleUpload: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const roleList = roles
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);
      const effectiveRoles = roleList.length ? roleList : ["all"];
      await DocumentsClient.upload({
        token,
        file,
        roles: effectiveRoles,
      });
      appendMessage({
        role: "assistant",
        content: `📄 Indexed ${file.name} for roles [${effectiveRoles.join(", ")}].`,
      });
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || "Upload failed";
      setError(message);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="chat">
      <div className="topbar">
        <div>
          <div>{user.email}</div>
          <small>roles: {user.roles.join(", ")}</small>
        </div>
        <div className="topbar-actions">
          <label className="roles">
            roles
            <input value={roles} onChange={(e) => setRoles(e.target.value)} />
          </label>
          <label className={`upload ${uploading ? "is-uploading" : ""}`}>
            <input
              type="file"
              onChange={handleUpload}
              disabled={uploading}
              accept=".pdf,.doc,.docx,.md,.markdown,.txt"
            />
            <span>{uploading ? "Uploading…" : "Upload Doc"}</span>
          </label>
          <button onClick={onLogout}>Logout</button>
        </div>
      </div>
      <div className="history">
        {messages.map((m, i) => (
          <Message key={i} {...m} />
        ))}
        {typing && <div className="typing">assistant is typing…</div>}
      </div>
      {error && <div className="error-banner">{error}</div>}
      <ChatInput onSend={ask} />
    </div>
  );
}

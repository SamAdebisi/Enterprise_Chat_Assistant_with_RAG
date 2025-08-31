import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API } from "../api";
import Message from "../components/Message";
import ChatInput from "../components/ChatInput";

export default function Chat({ token, user, onLogout }: any) {
  const [messages, setMessages] = useState<any[]>([]);
  const [typing, setTyping] = useState(false);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    const s = io(API.defaults.baseURL!, { transports: ["websocket"] });
    socketRef.current = s;
    s.on("connect", () => s.emit("join", user.uid));
    s.on("typing", () => setTyping(true));
    s.on("answer", (msg:any) => {
      setTyping(false);
      setMessages(m => [...m, { role: "assistant", content: msg.answer, sources: msg.sources }]);
    });
    return () => s.disconnect();
  }, [user]);

  const ask = async (q: string) => {
    setMessages(m => [...m, { role: "user", content: q }]);
    await API.post("/chat/ask", { question: q }, { headers: { Authorization: `Bearer ${token}` } });
  };

  return (
    <div className="chat">
      <div className="topbar">
        <div>{user.email} [{user.roles.join(", ")}]</div>
        <button onClick={onLogout}>Logout</button>
      </div>
      <div className="history">
        {messages.map((m,i)=><Message key={i} {...m} />)}
        {typing && <div className="typing">assistant is typing…</div>}
      </div>
      <ChatInput onSend={ask} />
    </div>
  );
}

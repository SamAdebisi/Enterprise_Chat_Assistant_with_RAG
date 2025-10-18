import React, { useState } from "react";

export default function ChatInput({ onSend }: { onSend: (t: string) => Promise<void> | void }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    const payload = text.trim();
    if (!payload || sending) return;
    setSending(true);
    try {
      await onSend(payload);
      setText("");
    } finally {
      setSending(false);
    }
  };
  return (
    <div className="inputbar">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void send();
          }
        }}
        placeholder="Ask a question…"
        disabled={sending}
      />
      <button onClick={send} disabled={sending}>{sending ? "Sending…" : "Send"}</button>
    </div>
  );
}

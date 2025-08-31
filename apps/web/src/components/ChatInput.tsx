import React, { useState } from "react";
export default function ChatInput({ onSend }: { onSend: (t:string)=>void }) {
  const [text, setText] = useState("");
  const send = () => { if (!text.trim()) return; onSend(text.trim()); setText(""); };
  return (
    <div className="inputbar">
      <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{ if (e.key==="Enter") send(); }} placeholder="Ask a question…" />
      <button onClick={send}>Send</button>
    </div>
  );
}

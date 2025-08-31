import React from "react";
export default function Message({ role, content, sources }: any) {
  return (
    <div className={`msg ${role}`}>
      <div className="content">{content}</div>
      {sources && sources.length > 0 && (
        <div className="sources">
          Sources: {sources.map((s:any, i:number)=>(<span key={i}>[{s.title}] </span>))}
        </div>
      )}
    </div>
  );
}

import React from "react";
import type { ChatMessage } from "../types";

export default function Message({ role, content, sources }: ChatMessage) {
  return (
    <div className={`msg ${role}`}>
      <div className="content">{content}</div>
      {sources && sources.length > 0 && (
        <div className="sources">
          Sources:
          {sources.map((s, i) => (
            <span key={`${s.title}-${i}`}>
              {" "}
              [{s.title}
              {typeof s.score === "number" ? ` · ${(s.score * 100).toFixed(0)}%` : ""}]
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

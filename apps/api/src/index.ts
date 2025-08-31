import express from "express";
import cors from "cors";
import http from "http";
import { cfg } from "./config.js";
import { initWs } from "./ws.js";
import health from "./routes/health.js";
import auth from "./routes/auth.js";
import chatRoute from "./routes/chat.js";
import docs from "./routes/documents.js";

const app = express();
app.use(cors({ origin: cfg.corsOrigin }));
app.use(express.json({ limit: "2mb" }));

app.use("/health", health);
app.use("/auth", auth);

const server = http.createServer(app);
const io = initWs(server);

app.use("/chat", chatRoute(io));
app.use("/documents", docs);

server.listen(cfg.port, () => {
  console.log(`api on :${cfg.port}`);
});

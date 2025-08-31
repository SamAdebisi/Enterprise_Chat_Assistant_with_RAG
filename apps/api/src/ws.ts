import { Server } from "socket.io";
import { cfg } from "./config.js";
export const initWs = (httpServer: any) => {
  const io = new Server(httpServer, { cors: { origin: cfg.corsOrigin } });
  io.on("connection", socket => {
    socket.on("join", (uid: string) => socket.join(uid));
  });
  return io;
};

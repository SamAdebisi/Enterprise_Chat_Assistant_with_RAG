import cors from "cors";
import express, { type Express, Request, Response, NextFunction } from "express";
import http, { type Server as HttpServer } from "http";
import { type Server as SocketServer } from "socket.io";
import { cfg } from "./config.js";
import { logger } from "./services/logger.js";
import health from "./routes/health.js";
import auth from "./routes/auth.js";
import documents from "./routes/documents.js";
import chatRoute from "./routes/chat.js";
import { initWs } from "./ws.js";
import { v4 as uuidv4 } from "uuid";

export interface ApiServer {
  app: Express;
  server: HttpServer;
  io: SocketServer;
}

// Request ID middleware
const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = uuidv4();
  (req as any).requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};

// Request logging middleware
const requestLoggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const requestId = (req as any).requestId;
  
  logger.requestStart(req.method, req.url, requestId);
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.requestEnd(req.method, req.url, requestId, res.statusCode, duration);
  });
  
  next();
};

// Error handling middleware
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  const requestId = (req as any).requestId;
  logger.logError(err, { requestId, url: req.url, method: req.method });
  
  if (res.headersSent) {
    return next(err);
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    requestId,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// 404 handler
const notFoundHandler = (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  logger.warn('Route not found', { requestId, url: req.url, method: req.method });
  res.status(404).json({ error: 'Route not found', requestId });
};

export const createApp = (): Express => {
  const app = express();
  app.set("trust proxy", true);
  
  // Middleware
  app.use(requestIdMiddleware);
  app.use(requestLoggingMiddleware);
  app.use(cors({ origin: cfg.corsOrigin, credentials: true }));
  app.use(express.json({ limit: "2mb" }));
  
  // Routes
  app.use("/health", health);
  app.use("/auth", auth);
  
  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);
  
  return app;
};

export const createServer = (): ApiServer => {
  const app = createApp();
  const server = http.createServer(app);
  const io = initWs(server);

  app.use("/chat", chatRoute(io));
  app.use("/documents", documents);

  return { app, server, io };
};

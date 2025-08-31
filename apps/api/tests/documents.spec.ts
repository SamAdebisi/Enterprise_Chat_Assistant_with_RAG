import request from "supertest";
import express from "express";
import http from "http";
import fs from "fs";
import path from "path";
import multer from "multer";
import health from "../src/routes/health";
import docs from "../src/routes/documents";
import { initWs } from "../src/ws";

// mock auth to bypass JWT
jest.mock("../src/middleware/auth", () => ({
  requireAuth: (_req: any, _res: any, next: any) => next()
}));

// mock axios POST to inference
jest.mock("axios", () => ({
  __esModule: true,
  default: { post: jest.fn(async () => ({ data: { ok: true, chunks: 1 } })) }
}));

describe("Documents API", () => {
  function makeApp(){
    const app = express();
    app.use("/health", health);
    const server = http.createServer(app);
    initWs(server); // not used but keeps parity
    app.use("/documents", docs);
    return { app, server };
  }

  it("uploads a file and proxies to inference", async () => {
    const { app } = makeApp();
    const tmp = path.join(__dirname, "tmp.txt");
    fs.writeFileSync(tmp, "hello world");
    const r = await request(app)
      .post("/documents/upload")
      .field("roles", "all")
      .attach("file", tmp);
    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(true);
    fs.unlinkSync(tmp);
  });

  it("rejects when file missing", async () => {
    const { app } = makeApp();
    const r = await request(app).post("/documents/upload").field("roles","all");
    expect(r.status).toBe(400);
  });
});

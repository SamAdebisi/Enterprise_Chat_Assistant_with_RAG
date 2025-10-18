import request from "supertest";
import express from "express";
import health from "../src/routes/health";

it("GET /health", async () => {
  const app = express();
  app.use("/health", health);
  const r = await request(app).get("/health");
  expect(r.status).toBe(200);
  expect(r.body.ok).toBe(true);
});

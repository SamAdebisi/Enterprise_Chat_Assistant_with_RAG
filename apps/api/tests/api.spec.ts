import request from "supertest";
import express from "express";
import http from "http";
import jwt from "jsonwebtoken";
import { initWs } from "../src/ws.js";
import auth from "../src/routes/auth.js";
import chatRoute from "../src/routes/chat.js";
import health from "../src/routes/health.js";

jest.mock("../src/services/firestore.js", () => ({
  saveChatTurn: jest.fn(),
  upsertUser: jest.fn(),
  findUserByEmail: jest.fn(async (email:string)=>
    email==="alice@company.com" ? ({ id:"u1", email, roles:["sales"], password:"hash" }) : null),
}));
jest.mock("bcryptjs", () => ({ compare: async ()=> true }));
jest.mock("../src/services/inference.js", () => ({
  ragQuery: async ()=> ({ answer: "hello [doc]", sources:[{title:"doc"}] })
}));

function makeApp(){
  const app = express();
  app.use(express.json());
  app.use("/health", health);
  const server = http.createServer(app);
  const io = initWs(server);
  app.use("/auth", auth);
  app.use("/chat", chatRoute(io));
  return { app, server };
}

describe("API", ()=>{
  it("health", async ()=>{
    const { app } = makeApp();
    const r = await request(app).get("/health");
    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(true);
  });

  it("ask requires auth", async ()=>{
    const { app } = makeApp();
    const r = await request(app).post("/chat/ask").send({question:"hi"});
    expect(r.status).toBe(401);
  });

  it("ask returns answer", async ()=>{
    const { app } = makeApp();
    const token = jwt.sign({ uid:"u1", email:"alice@company.com", roles:["sales"] }, "dev");
    const r = await request(app).post("/chat/ask")
      .set("Authorization", `Bearer ${token}`)
      .send({question:"hi"});
    expect(r.status).toBe(200);
    expect(r.body.answer).toContain("hello");
  });
});

import request from "supertest";
import jwt from "jsonwebtoken";
import { createServer } from "../src/server.js";
import { cfg } from "../src/config.js";

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

describe("API", ()=>{
  it("health", async ()=>{
    const { app } = createServer();
    const r = await request(app).get("/health");
    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(true);
  });

  it("ask requires auth", async ()=>{
    const { app } = createServer();
    const r = await request(app).post("/chat/ask").send({question:"hi"});
    expect(r.status).toBe(401);
  });

  it("ask validates payload", async ()=>{
    const { app } = createServer();
    const token = jwt.sign({ uid:"u1", email:"alice@company.com", roles:["sales"] }, cfg.jwtSecret);
    const r = await request(app).post("/chat/ask")
      .set("Authorization", `Bearer ${token}`)
      .send({ question: "" });
    expect(r.status).toBe(400);
  });

  it("ask returns answer", async ()=>{
    const { app } = createServer();
    const token = jwt.sign({ uid:"u1", email:"alice@company.com", roles:["sales"] }, cfg.jwtSecret);
    const r = await request(app).post("/chat/ask")
      .set("Authorization", `Bearer ${token}`)
      .send({question:"hi"});
    expect(r.status).toBe(200);
    expect(r.body.answer).toContain("hello");
  });
});

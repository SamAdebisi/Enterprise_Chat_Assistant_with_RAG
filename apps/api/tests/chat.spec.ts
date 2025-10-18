import request from "supertest";
import jwt from "jsonwebtoken";
import { createServer } from "../src/server.js";
import { cfg } from "../src/config.js";

// Mock dependencies
jest.mock("../src/services/firestore.js", () => ({
  saveChatTurn: jest.fn(),
  upsertUser: jest.fn(),
  findUserByEmail: jest.fn(async (email: string) =>
    email === "alice@company.com" ? ({ id: "u1", email, roles: ["sales"], password: "hash" }) : null),
}));

jest.mock("bcryptjs", () => ({ compare: async () => true }));

jest.mock("../src/services/inference.js", () => ({
  ragQuery: jest.fn(),
}));

const { ragQuery } = require("../src/services/inference.js");

describe("Chat API", () => {
  let app: any;
  let token: string;
  let mockIo: any;

  beforeEach(() => {
    jest.clearAllMocks();
    const { app: serverApp, io } = createServer();
    app = serverApp;
    mockIo = io;
    
    token = jwt.sign(
      { uid: "u1", email: "alice@company.com", roles: ["sales"] },
      cfg.jwtSecret
    );
  });

  describe("POST /chat/ask", () => {
    it("should require authentication", async () => {
      const response = await request(app)
        .post("/chat/ask")
        .send({ question: "What is AI?" });
      
      expect(response.status).toBe(401);
    });

    it("should validate question is provided", async () => {
      const response = await request(app)
        .post("/chat/ask")
        .set("Authorization", `Bearer ${token}`)
        .send({ question: "" });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("question is required");
    });

    it("should validate question is not too long", async () => {
      const longQuestion = "a".repeat(1001);
      const response = await request(app)
        .post("/chat/ask")
        .set("Authorization", `Bearer ${token}`)
        .send({ question: longQuestion });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("question too long (max 1000 characters)");
    });

    it("should successfully process valid question", async () => {
      const mockResult = {
        answer: "AI is artificial intelligence",
        sources: [{ title: "AI Guide", score: 0.9, path: "/docs/ai.md", roles: ["sales"] }]
      };
      ragQuery.mockResolvedValue(mockResult);

      const response = await request(app)
        .post("/chat/ask")
        .set("Authorization", `Bearer ${token}`)
        .send({ question: "What is AI?" });
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        chatId: expect.stringMatching(/^chat_u1_\d+$/),
        answer: mockResult.answer,
        sources: mockResult.sources
      });
      expect(ragQuery).toHaveBeenCalledWith({
        question: "What is AI?",
        roles: ["sales"],
        chat_id: expect.stringMatching(/^chat_u1_\d+$/),
        user_id: "u1"
      });
    });

    it("should use provided chatId", async () => {
      const mockResult = {
        answer: "AI is artificial intelligence",
        sources: []
      };
      ragQuery.mockResolvedValue(mockResult);

      const response = await request(app)
        .post("/chat/ask")
        .set("Authorization", `Bearer ${token}`)
        .send({ question: "What is AI?", chatId: "existing-chat-123" });
      
      expect(response.status).toBe(200);
      expect(response.body.chatId).toBe("existing-chat-123");
      expect(ragQuery).toHaveBeenCalledWith({
        question: "What is AI?",
        roles: ["sales"],
        chat_id: "existing-chat-123",
        user_id: "u1"
      });
    });

    it("should handle inference service errors", async () => {
      ragQuery.mockRejectedValue(new Error("Inference service unavailable"));

      const response = await request(app)
        .post("/chat/ask")
        .set("Authorization", `Bearer ${token}`)
        .send({ question: "What is AI?" });
      
      expect(response.status).toBe(502);
      expect(response.body.error).toBe("Inference service unavailable");
    });

    it("should emit typing event", async () => {
      const mockResult = {
        answer: "AI is artificial intelligence",
        sources: []
      };
      ragQuery.mockResolvedValue(mockResult);

      const emitSpy = jest.spyOn(mockIo, 'to').mockReturnValue({
        emit: jest.fn()
      });

      await request(app)
        .post("/chat/ask")
        .set("Authorization", `Bearer ${token}`)
        .send({ question: "What is AI?" });
      
      expect(emitSpy).toHaveBeenCalledWith("u1");
    });

    it("should emit answer event on success", async () => {
      const mockResult = {
        answer: "AI is artificial intelligence",
        sources: []
      };
      ragQuery.mockResolvedValue(mockResult);

      const emitSpy = jest.spyOn(mockIo, 'to').mockReturnValue({
        emit: jest.fn()
      });

      await request(app)
        .post("/chat/ask")
        .set("Authorization", `Bearer ${token}`)
        .send({ question: "What is AI?" });
      
      expect(emitSpy).toHaveBeenCalledWith("u1");
    });

    it("should emit error event on failure", async () => {
      ragQuery.mockRejectedValue(new Error("Inference service unavailable"));

      const emitSpy = jest.spyOn(mockIo, 'to').mockReturnValue({
        emit: jest.fn()
      });

      await request(app)
        .post("/chat/ask")
        .set("Authorization", `Bearer ${token}`)
        .send({ question: "What is AI?" });
      
      expect(emitSpy).toHaveBeenCalledWith("u1");
    });

    it("should save chat turns to Firestore", async () => {
      const { saveChatTurn } = require("../src/services/firestore.js");
      const mockResult = {
        answer: "AI is artificial intelligence",
        sources: []
      };
      ragQuery.mockResolvedValue(mockResult);

      await request(app)
        .post("/chat/ask")
        .set("Authorization", `Bearer ${token}`)
        .send({ question: "What is AI?" });
      
      expect(saveChatTurn).toHaveBeenCalledTimes(2);
      expect(saveChatTurn).toHaveBeenCalledWith(
        expect.stringMatching(/^chat_u1_\d+$/),
        expect.objectContaining({
          role: "user",
          content: "What is AI?",
          uid: "u1",
          roles: ["sales"]
        })
      );
      expect(saveChatTurn).toHaveBeenCalledWith(
        expect.stringMatching(/^chat_u1_\d+$/),
        expect.objectContaining({
          role: "assistant",
          content: mockResult.answer,
          sources: mockResult.sources
        })
      );
    });

    it("should handle different user roles", async () => {
      const engineeringToken = jwt.sign(
        { uid: "u2", email: "bob@company.com", roles: ["engineering"] },
        cfg.jwtSecret
      );

      const mockResult = {
        answer: "Engineering best practices",
        sources: []
      };
      ragQuery.mockResolvedValue(mockResult);

      const response = await request(app)
        .post("/chat/ask")
        .set("Authorization", `Bearer ${engineeringToken}`)
        .send({ question: "What are best practices?" });
      
      expect(response.status).toBe(200);
      expect(ragQuery).toHaveBeenCalledWith({
        question: "What are best practices?",
        roles: ["engineering"],
        chat_id: expect.stringMatching(/^chat_u2_\d+$/),
        user_id: "u2"
      });
    });
  });
});

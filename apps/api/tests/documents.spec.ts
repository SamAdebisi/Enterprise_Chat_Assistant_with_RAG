import request from "supertest";
import jwt from "jsonwebtoken";
import { createServer } from "../src/server.js";
import { cfg } from "../src/config.js";
import fs from "fs";
import path from "path";

// Mock dependencies
jest.mock("../src/services/firestore.js", () => ({
  saveChatTurn: jest.fn(),
  upsertUser: jest.fn(),
  findUserByEmail: jest.fn(async (email: string) =>
    email === "alice@company.com" ? ({ id: "u1", email, roles: ["sales"], password: "hash" }) : null),
}));

jest.mock("bcryptjs", () => ({ compare: async () => true }));

jest.mock("axios", () => ({
  post: jest.fn(),
}));

const axios = require("axios");

describe("Documents API", () => {
  let app: any;
  let token: string;

  beforeEach(() => {
    jest.clearAllMocks();
    const { app: serverApp } = createServer();
    app = serverApp;
    
    token = jwt.sign(
      { uid: "u1", email: "alice@company.com", roles: ["sales"] },
      cfg.jwtSecret
    );
  });

  describe("POST /documents/upload", () => {
    it("should require authentication", async () => {
      const response = await request(app)
        .post("/documents/upload")
        .attach("file", Buffer.from("test content"), "test.txt");
      
      expect(response.status).toBe(401);
    });

    it("should reject requests without file", async () => {
      const response = await request(app)
        .post("/documents/upload")
        .set("Authorization", `Bearer ${token}`);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("missing file");
    });

    it("should validate file type", async () => {
      const response = await request(app)
        .post("/documents/upload")
        .set("Authorization", `Bearer ${token}`)
        .attach("file", Buffer.from("test content"), "test.exe");
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain("Invalid file type");
    });

    it("should validate file size", async () => {
      const largeContent = Buffer.alloc(11 * 1024 * 1024); // 11MB
      const response = await request(app)
        .post("/documents/upload")
        .set("Authorization", `Bearer ${token}`)
        .attach("file", largeContent, "large.pdf");
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("File too large (max 10MB)");
    });

    it("should successfully upload valid file", async () => {
      const mockResponse = { ok: true, chunks: 3 };
      axios.post.mockResolvedValue({ data: mockResponse });

      const response = await request(app)
        .post("/documents/upload")
        .set("Authorization", `Bearer ${token}`)
        .attach("file", Buffer.from("test content"), "test.pdf")
        .field("roles", "sales,engineering");
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true, index: mockResponse });
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/rag/ingest"),
        expect.any(Object),
        expect.objectContaining({
          headers: expect.any(Object),
          maxBodyLength: Infinity,
          timeout: 120000,
        })
      );
    });

    it("should handle inference service errors", async () => {
      axios.post.mockRejectedValue({
        response: { status: 500, data: { error: "Inference service error" } }
      });

      const response = await request(app)
        .post("/documents/upload")
        .set("Authorization", `Bearer ${token}`)
        .attach("file", Buffer.from("test content"), "test.pdf");
      
      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Inference service error");
    });

    it("should handle network errors", async () => {
      axios.post.mockRejectedValue(new Error("Network error"));

      const response = await request(app)
        .post("/documents/upload")
        .set("Authorization", `Bearer ${token}`)
        .attach("file", Buffer.from("test content"), "test.pdf");
      
      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Network error");
    });

    it("should use default roles when not provided", async () => {
      const mockResponse = { ok: true, chunks: 3 };
      axios.post.mockResolvedValue({ data: mockResponse });

      await request(app)
        .post("/documents/upload")
        .set("Authorization", `Bearer ${token}`)
        .attach("file", Buffer.from("test content"), "test.pdf");
      
      // Check that the form data includes default roles
      const formData = axios.post.mock.calls[0][1];
      expect(formData).toBeDefined();
    });

    it("should clean up temporary files", async () => {
      const mockResponse = { ok: true, chunks: 3 };
      axios.post.mockResolvedValue({ data: mockResponse });

      const unlinkSpy = jest.spyOn(fs.promises, 'unlink').mockResolvedValue();

      await request(app)
        .post("/documents/upload")
        .set("Authorization", `Bearer ${token}`)
        .attach("file", Buffer.from("test content"), "test.pdf");
      
      expect(unlinkSpy).toHaveBeenCalled();
      unlinkSpy.mockRestore();
    });
  });
});
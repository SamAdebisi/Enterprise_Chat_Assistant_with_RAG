import dotenv from "dotenv";
dotenv.config();
export const cfg = {
  port: parseInt(process.env.PORT || "8080", 10),
  jwtSecret: process.env.JWT_SECRET || "dev",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  inferenceBase: process.env.INFERENCE_BASE_URL || "http://localhost:8000",
};

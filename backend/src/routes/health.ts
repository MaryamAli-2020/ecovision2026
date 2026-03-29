import { Router } from "express";
import type { HealthResponse } from "@ecovision/shared";

export const healthRouter = Router();

healthRouter.get(
  "/",
  (_request, response) => {
    const payload: HealthResponse = {
      status: "ok",
      service: "EcoVision UAE 2026 API",
      timestamp: new Date().toISOString(),
      capabilities: {
        gemini: Boolean(process.env.GEMINI_API_KEY),
        mongo: true
      }
    };

    response.json(payload);
  }
);

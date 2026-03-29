import "dotenv/config";
import cors from "cors";
import express from "express";

import { dashboardRouter } from "./routes/dashboard.js";
import { dataRouter } from "./routes/data.js";
import { healthRouter } from "./routes/health.js";
import { insightsRouter } from "./routes/insights.js";

export const createApp = () => {
  const app = express();
  const allowedOrigins = process.env.FRONTEND_ORIGIN
    ? process.env.FRONTEND_ORIGIN.split(",").map((origin) => origin.trim())
    : true;

  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true
    })
  );
  app.use(express.json({ limit: "6mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use("/api/health", healthRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/data", dataRouter);
  app.use("/api", insightsRouter);

  app.use((error: Error, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    response.status(500).json({
      success: false,
      error: error.message || "Unexpected server error"
    });
  });

  return app;
};

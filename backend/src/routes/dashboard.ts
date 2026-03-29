import { Router } from "express";
import { createDemoSnapshot } from "@ecovision/shared";

export const dashboardRouter = Router();

dashboardRouter.get("/demo", (_request, response) => {
  response.json({
    success: true,
    snapshot: createDemoSnapshot()
  });
});

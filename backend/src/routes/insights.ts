import { Router } from "express";
import { z } from "zod";
import { AVAILABLE_METRICS } from "@ecovision/shared";

import { asyncHandler } from "../lib/asyncHandler.js";
import { generateBriefing, generateChatResponse } from "../services/chatService.js";
import { createPdfReport } from "../services/reportService.js";

const sourceTypeSchema = z.enum(["demo", "upload", "mongo", "gee"]);
const climateMetricSchema = z.enum(
  AVAILABLE_METRICS as [typeof AVAILABLE_METRICS[number], ...typeof AVAILABLE_METRICS[number][]]
);

const dashboardSnapshotSchema = z.object({
  mode: z.enum(["demo", "live"]),
  sourceType: sourceTypeSchema,
  datasetLabel: z.string(),
  sourceLabel: z.string(),
  generatedAt: z.string(),
  lastUpdated: z.string(),
  selectedCityId: z.string(),
  timeline: z.array(z.string()),
  cities: z.array(z.any()),
  availableMetrics: z.array(climateMetricSchema),
  sampleQuestions: z.record(z.array(z.string())),
  seedMessages: z.array(z.any()),
  audioWaveform: z.array(z.number()),
  profile: z.any(),
  warnings: z.array(z.any())
});

const chatSchema = z.object({
  question: z.string().min(1),
  language: z.enum(["en", "ar"]),
  metric: climateMetricSchema,
  selectedCityId: z.string().min(1),
  timelineIndex: z.number().int().nonnegative(),
  snapshot: dashboardSnapshotSchema
});

const audioSchema = z.object({
  language: z.enum(["en", "ar"]),
  metric: climateMetricSchema,
  selectedCityId: z.string().min(1),
  timelineIndex: z.number().int().nonnegative(),
  snapshot: dashboardSnapshotSchema
});

const reportSchema = z.object({
  language: z.enum(["en", "ar"]),
  selectedCityId: z.string().min(1),
  question: z.string().default(""),
  assistantMessage: z.string().min(1),
  snapshot: dashboardSnapshotSchema
});

export const insightsRouter = Router();

insightsRouter.post(
  "/chat",
  asyncHandler(async (request, response) => {
    const payload = chatSchema.parse(request.body);
    response.json(await generateChatResponse(payload));
  })
);

insightsRouter.post(
  "/audio-brief",
  asyncHandler(async (request, response) => {
    const payload = audioSchema.parse(request.body);
    const result = await generateBriefing(payload);
    response.json({
      success: true,
      briefing: result.briefing,
      usedFallback: result.usedFallback
    });
  })
);

insightsRouter.post(
  "/report/pdf",
  asyncHandler(async (request, response) => {
    const payload = reportSchema.parse(request.body);
    const pdf = await createPdfReport(payload);

    response.setHeader("Content-Type", "application/pdf");
    response.setHeader("Content-Disposition", `attachment; filename=\"ecovision-${payload.selectedCityId}.pdf\"`);
    response.send(pdf);
  })
);

import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import type { MongoCollectionsRequest, MongoIngestRequest } from "@ecovision/shared";

import { asyncHandler } from "../lib/asyncHandler";
import {
  createUploadResponse,
  ingestMongoDataset,
  listMongoCollections,
  parseFieldMapping
} from "../services/dataService";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 12 * 1024 * 1024
  }
});

const mongoCollectionsSchema = z.object({
  uri: z.string().min(1),
  database: z.string().min(1)
});

const mongoIngestSchema = mongoCollectionsSchema.extend({
  collection: z.string().min(1),
  fieldMapping: z.record(z.string()).optional()
});

export const dataRouter = Router();

dataRouter.post(
  "/upload",
  upload.single("file"),
  asyncHandler(async (request, response) => {
    if (!request.file) {
      response.status(400).json({
        success: false,
        error: "No file was uploaded."
      });
      return;
    }

    const fieldMapping = parseFieldMapping(request.body.fieldMapping);
    response.json(createUploadResponse(request.file, fieldMapping));
  })
);

dataRouter.post(
  "/mongo/collections",
  asyncHandler(async (request, response) => {
    const parsed = mongoCollectionsSchema.parse(request.body);
    const payload: MongoCollectionsRequest = {
      uri: parsed.uri,
      database: parsed.database
    };

    response.json(await listMongoCollections(payload));
  })
);

dataRouter.post(
  "/mongo/ingest",
  asyncHandler(async (request, response) => {
    const parsedBody = {
      ...request.body,
      fieldMapping: parseFieldMapping(request.body.fieldMapping)
    };
    const parsed = mongoIngestSchema.parse(parsedBody);
    const payload: MongoIngestRequest = {
      uri: parsed.uri,
      database: parsed.database,
      collection: parsed.collection,
      fieldMapping: parsed.fieldMapping
    };

    response.json(await ingestMongoDataset(payload));
  })
);

import { createDemoSnapshot, normalizeDataset } from "@ecovision/shared";
import type {
  FieldMapping,
  MongoCollectionsRequest,
  MongoCollectionsResponse,
  MongoIngestRequest,
  UploadResponse
} from "@ecovision/shared";
import { parse as parseCsv } from "csv-parse/sync";
import type { Express } from "express";
import { MongoClient } from "mongodb";
import XLSX from "xlsx";

const mongoOptions = {
  serverSelectionTimeoutMS: 8000,
  connectTimeoutMS: 8000
};

const parseJsonRows = (buffer: Buffer): Record<string, unknown>[] => {
  const raw = JSON.parse(buffer.toString("utf8"));

  if (Array.isArray(raw)) {
    return raw as Record<string, unknown>[];
  }

  if (Array.isArray(raw.records)) {
    return raw.records as Record<string, unknown>[];
  }

  if (Array.isArray(raw.data)) {
    return raw.data as Record<string, unknown>[];
  }

  return [raw as Record<string, unknown>];
};

const parseSpreadsheetRows = (buffer: Buffer): Record<string, unknown>[] => {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheet = workbook.SheetNames[0];
  const sheet = workbook.Sheets[firstSheet];

  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: ""
  });
};

const parseCsvRows = (buffer: Buffer): Record<string, unknown>[] =>
  parseCsv(buffer, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    relax_column_count: true,
    trim: true
  });

const flattenDocument = (
  input: Record<string, unknown>,
  prefix = "",
  output: Record<string, unknown> = {}
): Record<string, unknown> => {
  Object.entries(input).forEach(([key, value]) => {
    const flatKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
      flattenDocument(value as Record<string, unknown>, flatKey, output);
      return;
    }

    output[flatKey] = value;

    if (!output[key]) {
      output[key] = value;
    }
  });

  return output;
};

export const parseFieldMapping = (payload: unknown): FieldMapping | undefined => {
  if (!payload) {
    return undefined;
  }

  if (typeof payload === "string") {
    return JSON.parse(payload) as FieldMapping;
  }

  return payload as FieldMapping;
};

export const parseUploadedRows = (file: Express.Multer.File): Record<string, unknown>[] => {
  const lowerName = file.originalname.toLowerCase();

  if (lowerName.endsWith(".csv")) {
    return parseCsvRows(file.buffer);
  }

  if (lowerName.endsWith(".json")) {
    return parseJsonRows(file.buffer);
  }

  if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
    return parseSpreadsheetRows(file.buffer);
  }

  throw new Error("Unsupported file type. Please upload CSV, JSON, or Excel.");
};

export const createUploadResponse = (
  file: Express.Multer.File,
  fieldMapping?: FieldMapping
): UploadResponse => {
  try {
    const rows = parseUploadedRows(file);
    const normalized = normalizeDataset(rows, {
      fieldMapping,
      datasetName: file.originalname,
      sourceType: "upload",
      mode: "live"
    });

    return {
      success: true,
      snapshot: normalized.snapshot,
      previewRows: normalized.previewRows,
      availableFields: normalized.availableFields,
      inferredMapping: normalized.inferredMapping,
      warnings: normalized.warnings,
      needsMapping: normalized.needsMapping,
      usedDemoFallback: normalized.usedDemoFallback
    };
  } catch (error) {
    const snapshot = createDemoSnapshot();
    return {
      success: true,
      snapshot: {
        ...snapshot,
        warnings: [
          {
            code: "upload_failed",
            message: error instanceof Error ? error.message : "Upload parsing failed. Demo data was loaded instead.",
            severity: "warning"
          }
        ]
      },
      previewRows: [],
      availableFields: [],
      inferredMapping: {},
      warnings: [
        {
          code: "upload_failed",
          message: error instanceof Error ? error.message : "Upload parsing failed. Demo data was loaded instead.",
          severity: "warning"
        }
      ],
      needsMapping: false,
      usedDemoFallback: true
    };
  }
};

const withMongoClient = async <T>(uri: string, runner: (client: MongoClient) => Promise<T>): Promise<T> => {
  const client = new MongoClient(uri, mongoOptions);
  await client.connect();

  try {
    return await runner(client);
  } finally {
    await client.close();
  }
};

export const listMongoCollections = async (
  payload: MongoCollectionsRequest
): Promise<MongoCollectionsResponse> => {
  const collections = await withMongoClient(payload.uri, async (client) => {
    const database = client.db(payload.database);
    const entries = await database.listCollections().toArray();
    return entries.map((entry) => entry.name);
  });

  return {
    success: true,
    collections
  };
};

export const ingestMongoDataset = async (payload: MongoIngestRequest): Promise<UploadResponse> => {
  try {
    const rows = await withMongoClient(payload.uri, async (client) => {
      const database = client.db(payload.database);
      const documents = await database.collection(payload.collection).find({}).limit(500).toArray();
      return documents.map((document) => flattenDocument(document as unknown as Record<string, unknown>));
    });

    const normalized = normalizeDataset(rows, {
      datasetName: `${payload.database}.${payload.collection}`,
      fieldMapping: payload.fieldMapping,
      sourceType: "mongo",
      mode: "live"
    });

    return {
      success: true,
      snapshot: normalized.snapshot,
      previewRows: normalized.previewRows,
      availableFields: normalized.availableFields,
      inferredMapping: normalized.inferredMapping,
      warnings: normalized.warnings,
      needsMapping: normalized.needsMapping,
      usedDemoFallback: normalized.usedDemoFallback
    };
  } catch (error) {
    const snapshot = createDemoSnapshot();
    return {
      success: true,
      snapshot: {
        ...snapshot,
        warnings: [
          {
            code: "mongo_ingest_failed",
            message: error instanceof Error ? error.message : "MongoDB ingestion failed. Demo data was loaded instead.",
            severity: "warning"
          }
        ]
      },
      previewRows: [],
      availableFields: [],
      inferredMapping: {},
      warnings: [
        {
          code: "mongo_ingest_failed",
          message: error instanceof Error ? error.message : "MongoDB ingestion failed. Demo data was loaded instead.",
          severity: "warning"
        }
      ],
      needsMapping: false,
      usedDemoFallback: true
    };
  }
};

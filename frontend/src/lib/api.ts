import type {
  AudioBriefRequest,
  ChatRequest,
  ChatResponse,
  HealthResponse,
  MongoCollectionsRequest,
  MongoCollectionsResponse,
  MongoIngestRequest,
  ReportRequest,
  UploadResponse
} from "@ecovision/shared";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }

  return response.json() as Promise<T>;
};

export const fetchHealth = () => request<HealthResponse>("/api/health");

export const fetchDemoSnapshot = () =>
  request<{ success: boolean; snapshot: UploadResponse["snapshot"] }>("/api/dashboard/demo");

export const uploadDataset = async (file: File, fieldMapping?: Record<string, string>) => {
  const formData = new FormData();
  formData.append("file", file);

  if (fieldMapping) {
    formData.append("fieldMapping", JSON.stringify(fieldMapping));
  }

  const response = await fetch(`${API_BASE}/api/data/upload`, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json() as Promise<UploadResponse>;
};

export const fetchMongoCollections = (payload: MongoCollectionsRequest) =>
  request<MongoCollectionsResponse>("/api/data/mongo/collections", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

export const ingestMongoDataset = (payload: MongoIngestRequest) =>
  request<UploadResponse>("/api/data/mongo/ingest", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

export const sendChatMessage = (payload: ChatRequest) =>
  request<ChatResponse>("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

export const generateAudioBrief = (payload: AudioBriefRequest) =>
  request<{ success: boolean; briefing: ChatResponse["briefing"]; usedFallback: boolean }>("/api/audio-brief", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

export const downloadPdfReport = async (payload: ReportRequest) => {
  const response = await fetch(`${API_BASE}/api/report/pdf`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.blob();
};

export type DataMode = "demo" | "live";
export type DataSourceType = "demo" | "upload" | "mongo";
export type ClimateMetric = "drought" | "heat" | "ndvi" | "satellite";
export type Language = "en" | "ar";
export type RiskLevel = "low" | "moderate" | "high" | "critical";

export type ExpectedField =
  | "city"
  | "latitude"
  | "longitude"
  | "timestamp"
  | "spi"
  | "ndvi"
  | "lst"
  | "forecast"
  | "forecast_accuracy"
  | "risk_level"
  | "policy_note"
  | "summary_text";

export interface ClimatePoint {
  timestamp: string;
  spi?: number | null;
  ndvi?: number | null;
  lst?: number | null;
  forecast?: number | null;
  forecastAccuracy?: number | null;
  riskLevel: RiskLevel;
  summaryText?: string;
}

export interface DerivedCityMetrics {
  currentSpi: number | null;
  currentNdvi: number | null;
  currentLst: number | null;
  currentForecast: number | null;
  currentForecastAccuracy: number | null;
  previousSpi: number | null;
  riskScore: number;
  trendDirection: "up" | "down" | "stable";
}

export interface CityClimateSeries {
  id: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
  riskLevel: RiskLevel;
  summaryText: string;
  policyNote: string;
  audioBriefs: Record<Language, string>;
  highlights: string[];
  timeSeries: ClimatePoint[];
  derived: DerivedCityMetrics;
}

export interface DatasetProfile {
  datasetName: string;
  sourceType: DataSourceType;
  recordCount: number;
  cityCount: number;
  fields: string[];
  mappedFields: Partial<Record<ExpectedField, string>>;
  missingFields: ExpectedField[];
  completenessScore: number;
}

export interface AssistantAction {
  type: "download-pdf" | "audio-brief";
  label: string;
  language?: Language;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  language: Language;
  timestamp: string;
  title?: string;
  content: string;
  chips?: string[];
  actions?: AssistantAction[];
}

export interface AudioBrief {
  language: Language;
  generatedAt: string;
  text: string;
  waveform: number[];
  voiceHint: string;
}

export interface NormalizationWarning {
  code: string;
  message: string;
  severity: "info" | "warning" | "error";
}

export interface DashboardSnapshot {
  mode: DataMode;
  sourceType: DataSourceType;
  datasetLabel: string;
  sourceLabel: string;
  generatedAt: string;
  lastUpdated: string;
  selectedCityId: string;
  timeline: string[];
  cities: CityClimateSeries[];
  availableMetrics: ClimateMetric[];
  sampleQuestions: Record<Language, string[]>;
  seedMessages: ChatMessage[];
  audioWaveform: number[];
  profile: DatasetProfile;
  warnings: NormalizationWarning[];
}

export interface NormalizedClimateRecord {
  city: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  spi?: number | null;
  ndvi?: number | null;
  lst?: number | null;
  forecast?: number | null;
  forecastAccuracy?: number | null;
  riskLevel: RiskLevel;
  policyNote: string;
  summaryText: string;
}

export type FieldMapping = Partial<Record<ExpectedField, string>>;

export interface NormalizationResult {
  snapshot: DashboardSnapshot;
  previewRows: Record<string, unknown>[];
  availableFields: string[];
  inferredMapping: FieldMapping;
  warnings: NormalizationWarning[];
  needsMapping: boolean;
  usedDemoFallback: boolean;
}

export interface HealthResponse {
  status: "ok";
  service: string;
  timestamp: string;
  capabilities: {
    gemini: boolean;
    mongo: boolean;
  };
}

export interface UploadResponse {
  success: boolean;
  snapshot: DashboardSnapshot;
  previewRows: Record<string, unknown>[];
  availableFields: string[];
  inferredMapping: FieldMapping;
  warnings: NormalizationWarning[];
  needsMapping: boolean;
  usedDemoFallback: boolean;
}

export interface MongoCollectionsRequest {
  uri: string;
  database: string;
}

export interface MongoCollectionsResponse {
  success: boolean;
  collections: string[];
  error?: string;
}

export interface MongoIngestRequest extends MongoCollectionsRequest {
  collection: string;
  fieldMapping?: FieldMapping;
}

export interface ChatRequest {
  question: string;
  language: Language;
  metric: ClimateMetric;
  selectedCityId: string;
  timelineIndex: number;
  snapshot: DashboardSnapshot;
}

export interface ChatResponse {
  success: boolean;
  message: ChatMessage;
  briefing: AudioBrief;
  warnings: NormalizationWarning[];
  usedFallback: boolean;
}

export interface AudioBriefRequest {
  language: Language;
  metric: ClimateMetric;
  selectedCityId: string;
  timelineIndex: number;
  snapshot: DashboardSnapshot;
}

export interface ReportRequest {
  language: Language;
  selectedCityId: string;
  question: string;
  assistantMessage: string;
  snapshot: DashboardSnapshot;
}

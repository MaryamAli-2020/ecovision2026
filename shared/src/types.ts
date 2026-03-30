export type DataMode = "demo" | "live";
export type DataSourceType = "demo" | "upload" | "mongo" | "gee";
export type ClimateMetric = "drought" | "heat" | "ndvi" | "soil_moisture" | "satellite";
export type Language = "en" | "ar";
export type RiskLevel = "low" | "moderate" | "high" | "critical";
export type DashboardTab = "overview" | "forecasting" | "ai-tools" | "alerts";
export type DateRangeKey = "full-archive" | "recent-decade" | "operations-window" | "forecast-window";
export type SeverityFilter = "all" | RiskLevel;
export type SourceStatus = "demo" | "live-ready" | "connected";

export type ExpectedField =
  | "city"
  | "latitude"
  | "longitude"
  | "timestamp"
  | "spi"
  | "ndvi"
  | "lst"
  | "soil_moisture"
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
  soilMoisture?: number | null;
  forecast?: number | null;
  forecastAccuracy?: number | null;
  lowerBound?: number | null;
  upperBound?: number | null;
  anomaly?: number | null;
  rainfallDeficit?: number | null;
  riskLevel: RiskLevel;
  summaryText?: string;
}

export interface HistoricalClimatePoint {
  timestamp: string;
  spi: number | null;
  ndvi: number | null;
  lst: number | null;
  soilMoisture: number | null;
  predictedSpi: number | null;
  residual: number | null;
  confidence: number | null;
  rainfallDeficit: number | null;
  anomaly: number | null;
}

export interface DerivedCityMetrics {
  currentSpi: number | null;
  currentNdvi: number | null;
  currentLst: number | null;
  currentSoilMoisture: number | null;
  currentForecast: number | null;
  currentForecastAccuracy: number | null;
  previousSpi: number | null;
  rainfallDeficit: number | null;
  anomaly: number | null;
  riskScore: number;
  trendDirection: "up" | "down" | "stable";
}

export interface FeatureInfluence {
  feature: string;
  weight: number;
  narrative: string;
}

export interface CityRecommendation {
  title: string;
  summary: string;
  domain: "water" | "agriculture" | "urban-cooling" | "risk-mitigation";
}

export interface CityClimateSeries {
  id: string;
  city: string;
  emirate: string;
  region: string;
  latitude: number;
  longitude: number;
  riskLevel: RiskLevel;
  summaryText: string;
  policyNote: string;
  audioBriefs: Record<Language, string>;
  highlights: string[];
  recommendations: CityRecommendation[];
  featureInfluence: FeatureInfluence[];
  timeSeries: ClimatePoint[];
  historicalSeries: HistoricalClimatePoint[];
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
  temporalScale: string;
  spatialResolution: string;
  harmonizedResolution: string;
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

export interface RemoteDataSource {
  id: string;
  title: string;
  variable: string;
  geeId: string;
  cadence: string;
  nativeResolution: string;
  harmonizedResolution: string;
  preprocessing: string[];
  status: SourceStatus;
  summary: string;
}

export interface PipelineStage {
  title: string;
  details: string[];
}

export interface ForecastModelConfig {
  name: string;
  paperReference: string;
  targetVariable: string;
  inputVariables: string[];
  embeddingDimension: number;
  transformerLayers: number;
  attentionHeads: number;
  dropoutRate: number;
  batchSize: number;
  maxEpochs: number;
  earlyStoppingPatience: number;
  optimizer: string;
  learningRate: number;
  lossFunction: string;
  scheduler: string;
  regularization: string[];
  pipeline: PipelineStage[];
  evaluationMetrics: string[];
}

export interface ModelBenchmark {
  modelName: "MSTT" | "LSTM" | "GRU";
  rmse: number;
  mae: number;
  r2: number;
  note: string;
}

export interface RegionalPerformance {
  emirateId: string;
  emirate: string;
  rmse: number;
  mae: number;
  r2: number;
  confidence: number;
  note: string;
}

export interface SpatialForecastCell {
  id: string;
  emirateId: string;
  label: string;
  latitude: number;
  longitude: number;
  predictedSpi: number;
  droughtSeverity: RiskLevel;
  confidence: number;
  rmse: number;
  r2: number;
  anomaly: number;
}

export interface AnomalySignal {
  label: string;
  value: number;
  change: number;
  note: string;
}

export interface DateRangeOption {
  id: DateRangeKey;
  label: string;
  start: string;
  end: string;
  description: string;
}

export interface CurrentConditionRow {
  emirateId: string;
  emirate: string;
  riskLevel: RiskLevel;
  spi: number | null;
  ndvi: number | null;
  lst: number | null;
  soilMoisture: number | null;
  forecastConfidence: number | null;
  rainfallDeficit: number | null;
}

export interface DashboardAnalytics {
  dateRanges: DateRangeOption[];
  dataSources: RemoteDataSource[];
  model: ForecastModelConfig;
  modelBenchmarks: ModelBenchmark[];
  regionalPerformance: RegionalPerformance[];
  spatialForecast: SpatialForecastCell[];
  anomalySignals: AnomalySignal[];
  recommendations: string[];
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
  currentConditions: CurrentConditionRow[];
  availableMetrics: ClimateMetric[];
  sampleQuestions: Record<Language, string[]>;
  seedMessages: ChatMessage[];
  audioWaveform: number[];
  profile: DatasetProfile;
  analytics: DashboardAnalytics;
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
  soilMoisture?: number | null;
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

import type { ClimateMetric, ExpectedField, Language, RiskLevel } from "./types";

export const EXPECTED_FIELDS: ExpectedField[] = [
  "city",
  "latitude",
  "longitude",
  "timestamp",
  "spi",
  "ndvi",
  "lst",
  "forecast",
  "forecast_accuracy",
  "risk_level",
  "policy_note",
  "summary_text"
];

export const FIELD_ALIASES: Record<ExpectedField, string[]> = {
  city: ["city", "location", "site", "station", "city_name", "emirate"],
  latitude: ["latitude", "lat", "y"],
  longitude: ["longitude", "lon", "lng", "long", "x"],
  timestamp: ["timestamp", "date", "datetime", "observed_at", "month"],
  spi: ["spi", "spi_index", "drought_index", "standardized_precipitation_index"],
  ndvi: ["ndvi", "vegetation", "vegetation_index", "greenness"],
  lst: ["lst", "land_surface_temperature", "surface_temperature", "temperature", "temp_c"],
  forecast: ["forecast", "prediction", "projected_spi", "forecast_spi"],
  forecast_accuracy: ["forecast_accuracy", "accuracy", "confidence", "model_accuracy"],
  risk_level: ["risk_level", "risk", "severity", "alert_level"],
  policy_note: ["policy_note", "policy", "action_note", "recommended_action"],
  summary_text: ["summary_text", "summary", "brief", "narrative"]
};

export const KNOWN_UAE_CITIES: Record<string, { latitude: number; longitude: number; region: string }> = {
  "abu dhabi": { latitude: 24.4539, longitude: 54.3773, region: "Abu Dhabi Emirate" },
  "dubai": { latitude: 25.2048, longitude: 55.2708, region: "Dubai Emirate" },
  "sharjah": { latitude: 25.3463, longitude: 55.4209, region: "Sharjah Emirate" },
  "al ain": { latitude: 24.1302, longitude: 55.8023, region: "Abu Dhabi Oasis Belt" },
  "fujairah": { latitude: 25.1288, longitude: 56.3265, region: "Fujairah Coast" }
};

export const DEFAULT_TIMELINE = [
  "2026-01-01",
  "2026-02-01",
  "2026-03-01",
  "2026-04-01",
  "2026-05-01",
  "2026-06-01",
  "2026-07-01",
  "2026-08-01",
  "2026-09-01",
  "2026-10-01"
];

export const AVAILABLE_METRICS: ClimateMetric[] = ["drought", "heat", "ndvi", "satellite"];

export const DEMO_AUDIO_WAVEFORM = [4, 8, 11, 7, 13, 16, 9, 12, 18, 10, 6, 9, 14, 8, 5];

export const SAMPLE_QUESTIONS: Record<Language, string[]> = {
  en: [
    "What is the current drought risk level for Sharjah?",
    "Simulate planting 5,000 Ghaf trees in the risk zone.",
    "Generate a policy brief in Arabic."
  ],
  ar: [
    "ما مستوى خطر الجفاف الحالي في الشارقة؟",
    "حاكي زراعة 5000 شجرة غاف في منطقة الخطر.",
    "أنشئ موجز سياسات باللغة العربية."
  ]
};

export const RISK_COLORS: Record<RiskLevel, string> = {
  low: "#25d0b2",
  moderate: "#eab308",
  high: "#f97316",
  critical: "#ef4444"
};

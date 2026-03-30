import type {
  ClimateMetric,
  DateRangeKey,
  DateRangeOption,
  ExpectedField,
  Language,
  RemoteDataSource,
  RiskLevel
} from "./types.js";

export const EXPECTED_FIELDS: ExpectedField[] = [
  "city",
  "latitude",
  "longitude",
  "timestamp",
  "spi",
  "ndvi",
  "lst",
  "soil_moisture",
  "forecast",
  "forecast_accuracy",
  "risk_level",
  "policy_note",
  "summary_text"
];

export const FIELD_ALIASES: Record<ExpectedField, string[]> = {
  city: ["city", "location", "site", "station", "city_name", "emirate", "region_name"],
  latitude: ["latitude", "lat", "y"],
  longitude: ["longitude", "lon", "lng", "long", "x"],
  timestamp: ["timestamp", "date", "datetime", "observed_at", "month"],
  spi: ["spi", "spi_index", "drought_index", "standardized_precipitation_index"],
  ndvi: ["ndvi", "vegetation", "vegetation_index", "greenness"],
  lst: ["lst", "land_surface_temperature", "surface_temperature", "temperature", "temp_c"],
  soil_moisture: ["soil_moisture", "soilmoisture", "sm", "gldas_sm", "surface_soil_moisture"],
  forecast: ["forecast", "prediction", "projected_spi", "forecast_spi", "predicted_spi"],
  forecast_accuracy: ["forecast_accuracy", "accuracy", "confidence", "model_accuracy"],
  risk_level: ["risk_level", "risk", "severity", "alert_level"],
  policy_note: ["policy_note", "policy", "action_note", "recommended_action"],
  summary_text: ["summary_text", "summary", "brief", "narrative"]
};

export const KNOWN_UAE_CITIES: Record<string, { latitude: number; longitude: number; region: string; emirate: string }> = {
  "abu dhabi": { latitude: 24.4539, longitude: 54.3773, region: "Capital district", emirate: "Abu Dhabi" },
  "dubai": { latitude: 25.2048, longitude: 55.2708, region: "Coastal urban corridor", emirate: "Dubai" },
  "sharjah": { latitude: 25.3463, longitude: 55.4209, region: "Northern urban-agricultural belt", emirate: "Sharjah" },
  "ajman": { latitude: 25.4052, longitude: 55.5136, region: "Compact coastal district", emirate: "Ajman" },
  "umm al quwain": { latitude: 25.5647, longitude: 55.5552, region: "Lagoon and wetland fringe", emirate: "Umm Al Quwain" },
  "ras al khaimah": { latitude: 25.7895, longitude: 55.9432, region: "Mountain-to-coast transition", emirate: "Ras Al Khaimah" },
  "fujairah": { latitude: 25.1288, longitude: 56.3265, region: "Eastern coastal resilience zone", emirate: "Fujairah" }
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
  "2026-10-01",
  "2026-11-01",
  "2026-12-01"
];

export const AVAILABLE_METRICS: ClimateMetric[] = [
  "drought",
  "heat",
  "ndvi",
  "soil_moisture",
  "satellite"
];

export const DEFAULT_DATE_RANGE: DateRangeKey = "full-archive";

export const DATE_RANGE_OPTIONS: DateRangeOption[] = [
  {
    id: "full-archive",
    label: "2000-2023 Archive",
    start: "2000-01-01",
    end: "2023-12-01",
    description: "Full historical archive for climate baseline, seasonal patterns, and benchmark evaluation."
  },
  {
    id: "recent-decade",
    label: "2014-2023 Decade",
    start: "2014-01-01",
    end: "2023-12-01",
    description: "Recent decade for resilience planning, warming signals, and anomaly tracking."
  },
  {
    id: "operations-window",
    label: "2022-2026 Operations",
    start: "2022-01-01",
    end: "2026-12-01",
    description: "Operational window linking recent observations with current planning and forecast context."
  },
  {
    id: "forecast-window",
    label: "2025-2026 Forecast",
    start: "2025-01-01",
    end: "2026-12-01",
    description: "Short-range outlook for decision support, forward projections, and alerting."
  }
];

export const DEMO_AUDIO_WAVEFORM = [4, 7, 10, 8, 13, 16, 12, 9, 14, 18, 12, 7, 11, 15, 9];

export const SAMPLE_QUESTIONS: Record<Language, string[]> = {
  en: [
    "Explain the MSTT SPI forecast for Sharjah in simple language.",
    "Which emirates show the highest drought risk over the next season?",
    "Generate an Arabic policy brief for water management in Ajman."
  ],
  ar: [
    "اشرح توقعات مؤشر الجفاف في الشارقة بلغة بسيطة.",
    "ما الإمارات الأعلى خطرا خلال الموسم القادم؟",
    "أنشئ موجزا سياسيا بالعربية لإدارة المياه في عجمان."
  ]
};

export const REMOTE_DATA_SOURCES: RemoteDataSource[] = [
  {
    id: "chirps-spi",
    title: "CHIRPS SPI",
    variable: "SPI from CHIRPS precipitation",
    geeId: "UCSB-CHG/CHIRPS/DAILY",
    cadence: "Daily aggregated to monthly SPI",
    nativeResolution: "0.05° (~5 km)",
    harmonizedResolution: "1 km monthly grid",
    preprocessing: ["Monthly precipitation aggregation", "SPI derivation", "Reprojection to 1 km", "Min-max normalization"],
    status: "live-ready",
    summary: "Precipitation-driven drought signal used as the target SPI variable for the MSTT forecasting workflow."
  },
  {
    id: "modis-ndvi",
    title: "MODIS NDVI",
    variable: "Vegetation condition",
    geeId: "MODIS/061/MOD13A3",
    cadence: "Monthly composites",
    nativeResolution: "1 km",
    harmonizedResolution: "1 km monthly grid",
    preprocessing: ["Cloud-aware compositing", "Monthly harmonization", "Gap filling", "Min-max normalization"],
    status: "live-ready",
    summary: "Vegetation response signal used as a core predictor for drought stress and resilience monitoring."
  },
  {
    id: "modis-lst",
    title: "MODIS LST",
    variable: "Land Surface Temperature",
    geeId: "MODIS/061/MOD11A1",
    cadence: "Daily aggregated to monthly means",
    nativeResolution: "1 km",
    harmonizedResolution: "1 km monthly grid",
    preprocessing: ["Daily to monthly aggregation", "Thermal outlier smoothing", "Reprojection", "Min-max normalization"],
    status: "live-ready",
    summary: "Thermal stress driver that captures heat accumulation and urban hotspot amplification."
  },
  {
    id: "gldas-sm",
    title: "NASA GLDAS NOAH Soil Moisture",
    variable: "Surface soil moisture",
    geeId: "NASA/GLDAS/V021/NOAH/G025/T3H",
    cadence: "3-hourly aggregated to monthly values",
    nativeResolution: "0.25°",
    harmonizedResolution: "Interpolated to 1 km monthly grid",
    preprocessing: ["3-hourly to monthly aggregation", "Interpolation to 1 km", "Missing value fill", "Min-max normalization"],
    status: "live-ready",
    summary: "Hydrologic memory signal feeding the MSTT model to improve SPI forecast skill and drought persistence tracking."
  }
];

export const RISK_COLORS: Record<RiskLevel, string> = {
  low: "#25d0b2",
  moderate: "#eab308",
  high: "#f97316",
  critical: "#ef4444"
};

import {
  AVAILABLE_METRICS,
  DEFAULT_TIMELINE,
  DEMO_AUDIO_WAVEFORM,
  SAMPLE_QUESTIONS
} from "./constants.js";
import type {
  AudioBrief,
  ChatMessage,
  CityClimateSeries,
  ClimatePoint,
  DashboardSnapshot,
  DataMode,
  DataSourceType,
  DatasetProfile,
  Language,
  RiskLevel
} from "./types.js";

const buildBrief = (city: string, summary: string, language: Language): string => {
  if (language === "ar") {
    return `إحاطة ${city}: ${summary} الأولوية الحالية هي خفض الإجهاد الحراري وتحسين الغطاء النباتي مع تنفيذ تدخلات موجهة خلال الأسابيع الأربعة القادمة.`;
  }

  return `${city} climate briefing: ${summary} The current priority is reducing thermal stress while restoring vegetation cover through focused interventions over the next four weeks.`;
};

const inferRisk = (spi: number, lst: number, ndvi: number): RiskLevel => {
  const riskScore = Math.abs(Math.min(spi, 0)) * 28 + Math.max(0, lst - 39) * 6 + Math.max(0, 0.34 - ndvi) * 120;

  if (riskScore >= 60) {
    return "critical";
  }

  if (riskScore >= 43) {
    return "high";
  }

  if (riskScore >= 25) {
    return "moderate";
  }

  return "low";
};

const trendDirection = (series: number[]): "up" | "down" | "stable" => {
  const delta = series[series.length - 1] - series[Math.max(0, series.length - 2)];

  if (delta > 0.08) {
    return "up";
  }

  if (delta < -0.08) {
    return "down";
  }

  return "stable";
};

const buildSeries = (
  city: string,
  region: string,
  latitude: number,
  longitude: number,
  spiValues: number[],
  ndviValues: number[],
  lstValues: number[],
  forecastValues: number[],
  forecastAccuracyValues: number[],
  summaryText: string,
  policyNote: string,
  highlights: string[]
): CityClimateSeries => {
  const timeSeries: ClimatePoint[] = DEFAULT_TIMELINE.map((timestamp, index) => {
    const spi = spiValues[index];
    const ndvi = ndviValues[index];
    const lst = lstValues[index];

    return {
      timestamp,
      spi,
      ndvi,
      lst,
      forecast: forecastValues[index],
      forecastAccuracy: forecastAccuracyValues[index],
      riskLevel: inferRisk(spi, lst, ndvi),
      summaryText
    };
  });

  const latest = timeSeries[timeSeries.length - 1];
  const previous = timeSeries[timeSeries.length - 2];

  return {
    id: city.toLowerCase().replace(/\s+/g, "-"),
    city,
    region,
    latitude,
    longitude,
    riskLevel: latest.riskLevel,
    summaryText,
    policyNote,
    audioBriefs: {
      en: buildBrief(city, summaryText, "en"),
      ar: buildBrief(city, summaryText, "ar")
    },
    highlights,
    timeSeries,
    derived: {
      currentSpi: latest.spi ?? null,
      currentNdvi: latest.ndvi ?? null,
      currentLst: latest.lst ?? null,
      currentForecast: latest.forecast ?? null,
      currentForecastAccuracy: latest.forecastAccuracy ?? null,
      previousSpi: previous.spi ?? null,
      riskScore:
        Math.abs(Math.min(latest.spi ?? 0, 0)) * 28 +
        Math.max(0, (latest.lst ?? 0) - 39) * 6 +
        Math.max(0, 0.34 - (latest.ndvi ?? 0)) * 120,
      trendDirection: trendDirection(spiValues)
    }
  };
};

export const createDemoCities = (): CityClimateSeries[] => [
  buildSeries(
    "Abu Dhabi",
    "Abu Dhabi Emirate",
    24.4539,
    54.3773,
    [-1.5, -1.6, -1.4, -1.3, -1.1, -1.0, -0.9, -0.8, -0.7, -0.6],
    [0.27, 0.26, 0.28, 0.29, 0.30, 0.31, 0.33, 0.34, 0.35, 0.36],
    [39.8, 40.4, 41.2, 42.6, 44.0, 45.6, 46.1, 45.2, 43.8, 41.7],
    [-1.4, -1.5, -1.3, -1.1, -1.0, -0.8, -0.8, -0.7, -0.6, -0.4],
    [84, 85, 86, 88, 89, 90, 91, 91, 92, 92],
    "Water stress remains elevated in western agricultural belts, but restored irrigation controls are stabilizing conditions toward late summer.",
    "Prioritize smart irrigation scheduling, shallow aquifer monitoring, and urban shade deployment in peri-urban districts.",
    ["Aquifer pressure easing", "Urban canopy backlog", "High midday heat load"]
  ),
  buildSeries(
    "Dubai",
    "Dubai Emirate",
    25.2048,
    55.2708,
    [-1.1, -1.2, -1.0, -0.9, -0.8, -0.9, -0.7, -0.6, -0.5, -0.4],
    [0.24, 0.25, 0.26, 0.27, 0.28, 0.27, 0.29, 0.30, 0.31, 0.32],
    [40.2, 41.3, 42.5, 44.6, 46.2, 47.1, 46.4, 45.6, 43.9, 42.3],
    [-1.0, -1.1, -0.9, -0.9, -0.7, -0.8, -0.6, -0.5, -0.4, -0.3],
    [86, 87, 88, 89, 90, 90, 91, 92, 92, 93],
    "Dense urban surfaces continue to amplify heat accumulation across inland districts, with cooling benefits strongest near the coast.",
    "Scale reflective surfaces, district cooling optimization, and Ghaf corridor planting in inland hotspots.",
    ["Inland thermal hotspot", "Coastal cooling buffer", "NDVI recovery is gradual"]
  ),
  buildSeries(
    "Sharjah",
    "Sharjah Emirate",
    25.3463,
    55.4209,
    [-1.8, -1.9, -1.7, -1.6, -1.5, -1.3, -1.1, -1.0, -0.9, -0.8],
    [0.21, 0.22, 0.23, 0.23, 0.24, 0.25, 0.27, 0.28, 0.29, 0.30],
    [39.6, 40.8, 42.1, 43.4, 45.1, 46.0, 45.7, 44.3, 42.8, 41.2],
    [-1.7, -1.8, -1.6, -1.4, -1.3, -1.1, -1.0, -0.9, -0.8, -0.7],
    [82, 83, 85, 86, 87, 88, 89, 89, 90, 90],
    "Sharjah shows the steepest drought signal in the demo portfolio, though recent NDVI gains suggest restoration measures are starting to register.",
    "Accelerate drought zoning, reclaimed-water irrigation for public landscapes, and early-warning alerts for municipal responders.",
    ["Highest drought pressure", "Forecast improving", "Priority for policy escalation"]
  ),
  buildSeries(
    "Al Ain",
    "Abu Dhabi Oasis Belt",
    24.1302,
    55.8023,
    [-0.9, -1.0, -0.8, -0.7, -0.6, -0.5, -0.4, -0.3, -0.2, -0.1],
    [0.34, 0.35, 0.36, 0.37, 0.38, 0.39, 0.40, 0.39, 0.38, 0.38],
    [37.8, 38.5, 39.2, 40.6, 42.0, 43.5, 43.2, 42.4, 40.6, 39.1],
    [-0.8, -0.9, -0.7, -0.6, -0.5, -0.5, -0.4, -0.3, -0.2, -0.1],
    [88, 89, 89, 90, 91, 91, 92, 92, 93, 93],
    "Oasis vegetation is comparatively resilient, but rising summer surface temperatures still threaten irrigation efficiency and evapotranspiration balance.",
    "Protect oasis belts with precision irrigation, mulching pilots, and staggered cooling infrastructure around farm edges.",
    ["Vegetation resilient", "Heat risk manageable", "Strongest forecast confidence"]
  ),
  buildSeries(
    "Fujairah",
    "Fujairah Coast",
    25.1288,
    56.3265,
    [-0.6, -0.7, -0.5, -0.4, -0.3, -0.2, -0.2, -0.1, 0.0, 0.1],
    [0.38, 0.39, 0.40, 0.41, 0.42, 0.42, 0.43, 0.44, 0.44, 0.45],
    [34.5, 35.1, 36.0, 37.3, 38.6, 39.7, 39.3, 38.4, 36.9, 35.8],
    [-0.5, -0.6, -0.4, -0.3, -0.2, -0.1, -0.1, 0.0, 0.1, 0.2],
    [90, 90, 91, 91, 92, 92, 93, 93, 94, 94],
    "Coastal humidity moderates vegetation stress in Fujairah, making it the lowest-risk city in the demo scenario.",
    "Use Fujairah as a resilience benchmark for coastal greening, runoff capture, and tourism heat adaptation protocols.",
    ["Lowest national risk", "High NDVI strength", "Coastal benchmark candidate"]
  )
];

export const buildDemoBrief = (city: CityClimateSeries, language: Language): AudioBrief => ({
  language,
  generatedAt: new Date().toISOString(),
  text: city.audioBriefs[language],
  waveform: DEMO_AUDIO_WAVEFORM,
  voiceHint: language === "ar" ? "ar-AE" : "en-AE"
});

export const createDemoMessages = (): ChatMessage[] => [
  {
    id: "seed-1",
    role: "assistant",
    language: "en",
    timestamp: new Date().toISOString(),
    title: "Sharjah Risk Brief",
    content:
      "Sharjah is carrying the highest drought pressure in the current demo scenario. SPI remains negative, but NDVI has started to recover, so the priority is to protect vegetation gains while lowering thermal stress in exposed districts.",
    chips: ["SPI: -0.8", "NDVI: 0.30", "Forecast accuracy: 90%"],
    actions: [
      { type: "download-pdf", label: "Download PDF", language: "en" },
      { type: "audio-brief", label: "Audio Brief (AR)", language: "ar" }
    ]
  },
  {
    id: "seed-2",
    role: "assistant",
    language: "en",
    timestamp: new Date().toISOString(),
    title: "Scenario Simulation",
    content:
      "Planting 5,000 Ghaf trees in the primary heat-risk corridor is projected to trim localized surface temperatures by roughly 0.7°C to 1.1°C over 24 months, with the highest payoff in inland Dubai and Sharjah transition zones.",
    chips: ["Cooling ROI horizon: 24 months", "High-impact corridor identified"],
    actions: [{ type: "download-pdf", label: "Download PDF", language: "en" }]
  }
];

export const createDemoSnapshot = (
  mode: DataMode = "demo",
  sourceType: DataSourceType = "demo",
  datasetLabel = "EcoVision UAE 2026 Demo Dataset"
): DashboardSnapshot => {
  const cities = createDemoCities();
  const profile: DatasetProfile = {
    datasetName: datasetLabel,
    sourceType,
    recordCount: cities.reduce((sum, city) => sum + city.timeSeries.length, 0),
    cityCount: cities.length,
    fields: ["city", "latitude", "longitude", "timestamp", "spi", "ndvi", "lst", "forecast", "forecast_accuracy", "risk_level", "policy_note", "summary_text"],
    mappedFields: {
      city: "city",
      latitude: "latitude",
      longitude: "longitude",
      timestamp: "timestamp",
      spi: "spi",
      ndvi: "ndvi",
      lst: "lst",
      forecast: "forecast",
      forecast_accuracy: "forecast_accuracy",
      risk_level: "risk_level",
      policy_note: "policy_note",
      summary_text: "summary_text"
    },
    missingFields: [],
    completenessScore: 1
  };

  return {
    mode,
    sourceType,
    datasetLabel,
    sourceLabel: mode === "demo" ? "Auto-loaded climate resilience demo data" : "Imported climate resilience dataset",
    generatedAt: new Date().toISOString(),
    lastUpdated: DEFAULT_TIMELINE[DEFAULT_TIMELINE.length - 1],
    selectedCityId: "dubai",
    timeline: DEFAULT_TIMELINE,
    cities,
    availableMetrics: AVAILABLE_METRICS,
    sampleQuestions: SAMPLE_QUESTIONS,
    seedMessages: createDemoMessages(),
    audioWaveform: DEMO_AUDIO_WAVEFORM,
    profile,
    warnings: []
  };
};

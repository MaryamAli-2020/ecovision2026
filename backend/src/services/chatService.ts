import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildDemoBrief } from "@ecovision/shared";
import type {
  AudioBrief,
  AudioBriefRequest,
  ChatMessage,
  ChatRequest,
  ChatResponse,
  CityClimateSeries,
  ClimateMetric,
  DashboardSnapshot,
  Language
} from "@ecovision/shared";

const containsArabic = (value: string): boolean => /[\u0600-\u06FF]/.test(value);

const getCity = (snapshot: DashboardSnapshot, selectedCityId: string): CityClimateSeries => {
  return snapshot.cities.find((city) => city.id === selectedCityId) ?? snapshot.cities[0];
};

const getPoint = (city: CityClimateSeries, timelineIndex: number) => {
  return city.timeSeries[Math.min(Math.max(timelineIndex, 0), city.timeSeries.length - 1)] ?? city.timeSeries[city.timeSeries.length - 1];
};

const metricLabel: Record<ClimateMetric, string> = {
  drought: "drought",
  heat: "heat",
  ndvi: "vegetation resilience",
  soil_moisture: "soil moisture resilience",
  satellite: "satellite intelligence"
};

const buildActions = () => [
  { type: "download-pdf" as const, label: "Download PDF", language: "en" as const },
  { type: "audio-brief" as const, label: "Audio Brief (AR)", language: "ar" as const }
];

const buildFallbackTitle = (question: string, language: Language): string => {
  const lower = question.toLowerCase();

  if (lower.includes("policy")) {
    return language === "ar" ? "موجز السياسات" : "Policy Brief";
  }

  if (lower.includes("ghaf") || lower.includes("tree") || lower.includes("simulate")) {
    return language === "ar" ? "محاكاة التأثير" : "Impact Simulation";
  }

  return language === "ar" ? "تحليل المدينة" : "City Insight";
};

const buildFallbackText = (
  snapshot: DashboardSnapshot,
  selectedCityId: string,
  timelineIndex: number,
  question: string,
  language: Language,
  metric: ClimateMetric
): string => {
  const city = getCity(snapshot, selectedCityId);
  const point = getPoint(city, timelineIndex);
  const lower = question.toLowerCase();

  if (language === "ar" || containsArabic(question)) {
    if (lower.includes("ghaf") || lower.includes("tree") || lower.includes("simulate")) {
      return `محاكاة أولية: زراعة 5000 شجرة غاف في نطاق الخطر داخل ${city.city} قد تخفض حرارة السطح محلياً بنحو 0.7 إلى 1.1 درجة مئوية خلال 18 إلى 24 شهراً، مع أفضل أثر في المناطق ذات المؤشر الحراري الأعلى.`;
    }

    if (lower.includes("policy") || lower.includes("brief")) {
      return `موجز سياسات ${city.city}: مستوى الخطر الحالي هو ${city.riskLevel}. قيمة SPI الحالية ${point.spi?.toFixed(1) ?? "غير متوفرة"} وNDVI ${point.ndvi?.toFixed(2) ?? "غير متوفر"} وحرارة السطح ${point.lst?.toFixed(1) ?? "غير متوفرة"} درجة مئوية ورطوبة التربة ${point.soilMoisture?.toFixed(2) ?? "غير متوفرة"}. التوصية الأساسية هي ${city.policyNote}`;
    }

    return `تحليل ${city.city}: الخطر الحالي ${city.riskLevel} مع ${metricLabel[metric]} كأهم محور متابعة. قيمة SPI الحالية ${point.spi?.toFixed(1) ?? "غير متوفرة"} وNDVI ${point.ndvi?.toFixed(2) ?? "غير متوفر"} وحرارة السطح ${point.lst?.toFixed(1) ?? "غير متوفرة"} درجة مئوية ورطوبة التربة ${point.soilMoisture?.toFixed(2) ?? "غير متوفرة"}. ${city.summaryText}`;
  }

  if (lower.includes("ghaf") || lower.includes("tree") || lower.includes("simulate")) {
    return `Simulation outlook: planting 5,000 Ghaf trees across the current ${city.city} risk corridor could trim local land-surface temperature by roughly 0.7°C to 1.1°C within 18 to 24 months, with the largest payoff in the highest-heat parcels.`;
  }

  if (lower.includes("policy") || lower.includes("brief")) {
    return `${city.city} policy brief: current risk is ${city.riskLevel}. SPI is ${point.spi?.toFixed(1) ?? "N/A"}, NDVI is ${point.ndvi?.toFixed(2) ?? "N/A"}, land-surface temperature is ${point.lst?.toFixed(1) ?? "N/A"}°C, and soil moisture is ${point.soilMoisture?.toFixed(2) ?? "N/A"}. Recommended action: ${city.policyNote}`;
  }

  return `${city.city} is currently operating at a ${city.riskLevel} climate-risk posture. The active ${metricLabel[metric]} signal shows SPI at ${point.spi?.toFixed(1) ?? "N/A"}, NDVI at ${point.ndvi?.toFixed(2) ?? "N/A"}, land-surface temperature at ${point.lst?.toFixed(1) ?? "N/A"}°C, soil moisture at ${point.soilMoisture?.toFixed(2) ?? "N/A"}, and forecast accuracy near ${point.forecastAccuracy?.toFixed(0) ?? "N/A"}%. ${city.summaryText}`;
};

const buildPrompt = (
  snapshot: DashboardSnapshot,
  selectedCityId: string,
  timelineIndex: number,
  question: string,
  language: Language,
  metric: ClimateMetric
): string => {
  const city = getCity(snapshot, selectedCityId);
  const point = getPoint(city, timelineIndex);

  return [
    "You are EcoVision UAE 2026, a climate resilience analyst for a premium enterprise dashboard.",
    `Respond in ${language === "ar" || containsArabic(question) ? "Arabic" : "English"}.`,
    "Be concise, analytical, and grounded in the supplied dashboard data. Avoid generic filler.",
    `Selected city: ${city.city}`,
    `Selected region: ${city.region}`,
    `Selected metric layer: ${metric}`,
    `Current timestamp: ${point.timestamp}`,
    `Current SPI: ${point.spi ?? "N/A"}`,
    `Current NDVI: ${point.ndvi ?? "N/A"}`,
    `Current LST: ${point.lst ?? "N/A"}`,
    `Current soil moisture: ${point.soilMoisture ?? "N/A"}`,
    `Current forecast: ${point.forecast ?? "N/A"}`,
    `Forecast accuracy: ${point.forecastAccuracy ?? "N/A"}`,
    `Risk level: ${city.riskLevel}`,
    `Policy note: ${city.policyNote}`,
    `City summary: ${city.summaryText}`,
    `Dominant model features: ${city.featureInfluence.map((entry) => `${entry.feature} ${Math.round(entry.weight * 100)}%`).join(", ")}`,
    `Forecast model: ${snapshot.analytics.model.name}`,
    `User question: ${question}`,
    "If the question asks for a policy brief, deliver a short policy memo. If it asks for a simulation, provide an estimated directional outcome with explicit uncertainty."
  ].join("\n");
};

const runGemini = async (prompt: string): Promise<string | null> => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return null;
  }

  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({
    model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash"
  });
  const result = await model.generateContent(prompt);

  return result.response.text().trim();
};

export const generateBriefing = async (payload: AudioBriefRequest): Promise<{ briefing: AudioBrief; usedFallback: boolean }> => {
  const city = getCity(payload.snapshot, payload.selectedCityId);
  const fallback = buildDemoBrief(city, payload.language);

  try {
    const prompt = [
      "Generate a concise climate audio briefing script for a UAE climate resilience dashboard.",
      `Respond in ${payload.language === "ar" ? "Arabic" : "English"}.`,
      `City: ${city.city}`,
      `Summary: ${city.summaryText}`,
      `Policy note: ${city.policyNote}`
    ].join("\n");

    const generated = await runGemini(prompt);

    if (!generated) {
      return { briefing: fallback, usedFallback: true };
    }

    return {
      briefing: {
        ...fallback,
        text: generated
      },
      usedFallback: false
    };
  } catch {
    return { briefing: fallback, usedFallback: true };
  }
};

export const generateChatResponse = async (payload: ChatRequest): Promise<ChatResponse> => {
  const language: Language = payload.language === "ar" || containsArabic(payload.question) ? "ar" : "en";
  const title = buildFallbackTitle(payload.question, language);
  const fallbackText = buildFallbackText(
    payload.snapshot,
    payload.selectedCityId,
    payload.timelineIndex,
    payload.question,
    language,
    payload.metric
  );
  let content = fallbackText;
  let usedFallback = true;

  try {
    const generated = await runGemini(
      buildPrompt(
        payload.snapshot,
        payload.selectedCityId,
        payload.timelineIndex,
        payload.question,
        language,
        payload.metric
      )
    );

    if (generated) {
      content = generated;
      usedFallback = false;
    }
  } catch {
    usedFallback = true;
  }

  const briefingResult = await generateBriefing({
    language,
    metric: payload.metric,
    selectedCityId: payload.selectedCityId,
    timelineIndex: payload.timelineIndex,
    snapshot: payload.snapshot
  });

  const message: ChatMessage = {
    id: `assistant-${Date.now()}`,
    role: "assistant",
    language,
    timestamp: new Date().toISOString(),
    title,
    content,
    chips: [
      `Mode: ${payload.snapshot.mode}`,
      `City: ${getCity(payload.snapshot, payload.selectedCityId).city}`,
      usedFallback ? "Demo-grounded fallback" : "Gemini-grounded analysis"
    ],
    actions: buildActions()
  };

  return {
    success: true,
    message,
    briefing: briefingResult.briefing,
    warnings: [],
    usedFallback: usedFallback || briefingResult.usedFallback
  };
};

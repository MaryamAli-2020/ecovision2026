import type {
  ChatMessage,
  CityClimateSeries,
  ClimateMetric,
  DashboardSnapshot,
  DateRangeKey,
  HistoricalClimatePoint,
  RiskLevel,
  SeverityFilter
} from "@ecovision/shared";

import { formatMonth } from "./utils";

export type AlertChannel = "email" | "sms" | "whatsapp" | "webhook";

export interface DecisionAlert {
  id: string;
  cityId: string;
  city: string;
  region: string;
  riskLevel: RiskLevel;
  title: string;
  summary: string;
  escalationWindow: string;
  targetRoles: string[];
  channels: AlertChannel[];
  confidence: number | null;
  emailSubject: string;
  emailBody: string;
}

const riskPriority: Record<RiskLevel, number> = {
  low: 0,
  moderate: 1,
  high: 2,
  critical: 3
};

const metricLabel: Record<ClimateMetric, string> = {
  drought: "SPI drought signal",
  heat: "land surface temperature",
  ndvi: "vegetation condition",
  soil_moisture: "soil moisture",
  satellite: "satellite context"
};

export const getSelectedCity = (snapshot: DashboardSnapshot, cityId: string) =>
  snapshot.cities.find((city) => city.id === cityId) ?? snapshot.cities[0];

export const getTimelinePoint = (city: CityClimateSeries, timelineIndex: number) =>
  city.timeSeries[Math.min(Math.max(timelineIndex, 0), city.timeSeries.length - 1)] ??
  city.timeSeries[city.timeSeries.length - 1];

const average = (values: Array<number | null | undefined>) => {
  const filtered = values.filter((value): value is number => value !== null && value !== undefined);

  if (!filtered.length) {
    return null;
  }

  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
};

export const isRiskVisible = (riskLevel: RiskLevel, filter: SeverityFilter) =>
  filter === "all" ? true : riskPriority[riskLevel] >= riskPriority[filter];

export const getNationalAverages = (snapshot: DashboardSnapshot, timelineIndex: number) => {
  const points = snapshot.cities.map((city) => getTimelinePoint(city, timelineIndex));

  return {
    ndvi: average(points.map((point) => point.ndvi)),
    lst: average(points.map((point) => point.lst)),
    soilMoisture: average(points.map((point) => point.soilMoisture)),
    forecastAccuracy: average(points.map((point) => point.forecastAccuracy)),
    spi: average(points.map((point) => point.spi))
  };
};

export const buildKpiCards = (snapshot: DashboardSnapshot, city: CityClimateSeries, timelineIndex: number) => {
  const point = getTimelinePoint(city, timelineIndex);
  const national = getNationalAverages(snapshot, timelineIndex);

  return [
    {
      title: "SPI Index",
      value: point.spi,
      unit: "",
      accent: "rose",
      note:
        point.riskLevel === "critical"
          ? "Critical drought escalation"
          : point.spi !== null && point.spi !== undefined && point.spi < -1
            ? "Severe drought pressure"
            : "Stress easing gradually"
    },
    {
      title: "NDVI Condition",
      value: point.ndvi,
      unit: "",
      accent: "teal",
      note:
        national.ndvi !== null && point.ndvi !== null && point.ndvi !== undefined && point.ndvi < national.ndvi
          ? "Below national vegetation average"
          : "Vegetation resilience improving"
    },
    {
      title: "Land Surface Temp",
      value: point.lst,
      unit: "C",
      accent: "amber",
      note:
        point.lst !== null && point.lst !== undefined && point.lst > 43
          ? "Thermal hotspot remains active"
          : "Urban cooling signal improving"
    },
    {
      title: "Soil Moisture",
      value: point.soilMoisture,
      unit: "",
      accent: "emerald",
      note:
        point.soilMoisture !== null && point.soilMoisture !== undefined && point.soilMoisture < 0.2
          ? "Hydrologic reserve is thinning"
          : "Hydrologic memory remains supportive"
    }
  ];
};

export const buildForecastSeries = (city: CityClimateSeries, timelineIndex: number) =>
  city.timeSeries.map((point, index) => ({
    label: formatMonth(point.timestamp),
    timestamp: point.timestamp,
    actualObserved: index <= timelineIndex ? point.spi : null,
    forecastObserved: index <= timelineIndex ? point.forecast : null,
    futureForecast: index >= timelineIndex ? point.forecast : null,
    lowerBound: index >= timelineIndex ? point.lowerBound : null,
    upperBound: index >= timelineIndex ? point.upperBound : null
  }));

export const buildForecastDriverSeries = (city: CityClimateSeries) =>
  city.timeSeries.map((point) => ({
    label: formatMonth(point.timestamp),
    ndvi: point.ndvi,
    lst: point.lst,
    soilMoisture: point.soilMoisture
  }));

export const buildForecastSummary = (city: CityClimateSeries, timelineIndex: number) => {
  const point = getTimelinePoint(city, timelineIndex);

  if (point.riskLevel === "critical") {
    return {
      headline: `${city.emirate} enters critical alert posture`,
      detail: `${point.forecastAccuracy?.toFixed(0) ?? "N/A"}% confidence with forecast SPI ${point.forecast?.toFixed(1) ?? "N/A"}, low soil moisture ${point.soilMoisture?.toFixed(2) ?? "N/A"}, and elevated thermal stress.`,
      signal: "Escalate immediately"
    };
  }

  return {
    headline: `${city.emirate} forecast remains under active watch`,
    detail: `${point.forecastAccuracy?.toFixed(0) ?? "N/A"}% confidence with ${point.riskLevel} posture and projected SPI ${point.forecast?.toFixed(1) ?? "N/A"}. Soil moisture is ${point.soilMoisture?.toFixed(2) ?? "N/A"}.`,
    signal:
      point.forecast !== null && point.forecast !== undefined && point.spi !== null && point.spi !== undefined && point.forecast > point.spi
        ? "Projected resilience improvement"
        : "Monitor model drift"
  };
};

export const countCriticalSignals = (snapshot: DashboardSnapshot, timelineIndex: number) =>
  snapshot.cities.filter((city) => getTimelinePoint(city, timelineIndex).riskLevel === "critical").length;

export const buildDecisionAlerts = (
  snapshot: DashboardSnapshot,
  timelineIndex: number,
  severityFilter: SeverityFilter = "all"
): DecisionAlert[] => {
  const alerts: Array<DecisionAlert | null> = snapshot.cities.map((city) => {
    const point = getTimelinePoint(city, timelineIndex);

    if (point.riskLevel === "low" || !isRiskVisible(point.riskLevel, severityFilter)) {
      return null;
    }

    const escalationWindow =
      point.riskLevel === "critical"
        ? "Dispatch within 15 min"
        : point.riskLevel === "high"
          ? "Review within 60 min"
          : "Include in next executive digest";
    const targetRoles =
      point.riskLevel === "critical"
        ? ["Municipal command center", "Climate resilience director", "Infrastructure duty officer"]
        : point.riskLevel === "high"
          ? ["Urban planning lead", "Water operations lead", "Environmental intelligence team"]
          : ["Sustainability office", "Data and policy unit"];
    const channels =
      point.riskLevel === "critical"
        ? (["email", "sms", "whatsapp", "webhook"] as AlertChannel[])
        : point.riskLevel === "high"
          ? (["email", "whatsapp", "webhook"] as AlertChannel[])
          : (["email"] as AlertChannel[]);
    const title =
      point.riskLevel === "critical"
        ? `${city.emirate} critical drought alert`
        : point.riskLevel === "high"
          ? `${city.emirate} escalation watch`
          : `${city.emirate} monitoring brief`;
    const summary =
      point.riskLevel === "critical"
        ? `${city.emirate} has crossed a critical threshold with SPI ${point.spi?.toFixed(1) ?? "N/A"}, LST ${point.lst?.toFixed(1) ?? "N/A"} C, NDVI ${point.ndvi?.toFixed(2) ?? "N/A"}, and soil moisture ${point.soilMoisture?.toFixed(2) ?? "N/A"}. Trigger executive outreach and field response immediately.`
        : point.riskLevel === "high"
          ? `${city.emirate} is in a high-risk posture. Send an executive brief, notify operations leads, and review ${metricLabel.soil_moisture} and drought thresholds today.`
          : `${city.emirate} should remain in the decision digest so policy teams can track forecast confidence, rainfall deficit, and trend direction.`;
    const emailSubject = `[EcoVision ${point.riskLevel.toUpperCase()}] ${city.emirate} drought resilience alert`;
    const emailBody = [
      `Emirate: ${city.emirate}`,
      `Region: ${city.region}`,
      `Risk level: ${point.riskLevel}`,
      `SPI: ${point.spi?.toFixed(1) ?? "N/A"}`,
      `NDVI: ${point.ndvi?.toFixed(2) ?? "N/A"}`,
      `Land Surface Temperature: ${point.lst?.toFixed(1) ?? "N/A"} C`,
      `Soil Moisture: ${point.soilMoisture?.toFixed(2) ?? "N/A"}`,
      `Forecast Confidence: ${point.forecastAccuracy?.toFixed(0) ?? "N/A"}%`,
      `Rainfall Deficit: ${point.rainfallDeficit?.toFixed(0) ?? "N/A"} mm`,
      "",
      `Operational summary: ${city.summaryText}`,
      `Policy recommendation: ${city.policyNote}`,
      `Escalation window: ${escalationWindow}`
    ].join("\n");

    return {
      id: `${city.id}-${point.timestamp}-alert`,
      cityId: city.id,
      city: city.city,
      region: city.region,
      riskLevel: point.riskLevel,
      title,
      summary,
      escalationWindow,
      targetRoles,
      channels,
      confidence: point.forecastAccuracy ?? null,
      emailSubject,
      emailBody
    };
  });

  return alerts
    .filter((alert): alert is DecisionAlert => alert !== null)
    .sort((left, right) => {
      const priorityDelta = riskPriority[right.riskLevel] - riskPriority[left.riskLevel];
      return priorityDelta !== 0 ? priorityDelta : left.city.localeCompare(right.city);
    });
};

export const getMapMetricValue = (city: CityClimateSeries, timelineIndex: number, metric: ClimateMetric) => {
  const point = getTimelinePoint(city, timelineIndex);

  switch (metric) {
    case "drought":
      return Math.abs(Math.min(point.spi ?? 0, 0));
    case "heat":
      return point.lst ?? 0;
    case "ndvi":
      return point.ndvi ?? 0;
    case "soil_moisture":
      return 1 - (point.soilMoisture ?? 0);
    case "satellite":
      return city.derived.riskScore / 100;
    default:
      return 0;
  }
};

export const getDateRangeOption = (snapshot: DashboardSnapshot, rangeId: DateRangeKey) =>
  snapshot.analytics.dateRanges.find((range) => range.id === rangeId) ?? snapshot.analytics.dateRanges[0];

export const filterHistoricalSeries = (city: CityClimateSeries, snapshot: DashboardSnapshot, rangeId: DateRangeKey) => {
  const range = getDateRangeOption(snapshot, rangeId);
  const start = new Date(range.start).getTime();
  const end = new Date(range.end).getTime();

  return city.historicalSeries.filter((entry) => {
    const timestamp = new Date(entry.timestamp).getTime();
    return timestamp >= start && timestamp <= end;
  });
};

export const buildHistoricalTrendSeries = (
  city: CityClimateSeries,
  snapshot: DashboardSnapshot,
  rangeId: DateRangeKey
) =>
  filterHistoricalSeries(city, snapshot, rangeId).map((entry) => ({
    label: new Date(entry.timestamp).getFullYear(),
    timestamp: entry.timestamp,
    spi: entry.spi,
    predictedSpi: entry.predictedSpi,
    residual: entry.residual,
    ndvi: entry.ndvi,
    lst: entry.lst,
    soilMoisture: entry.soilMoisture
  }));

export const buildSeasonalPattern = (
  city: CityClimateSeries,
  snapshot: DashboardSnapshot,
  rangeId: DateRangeKey
) => {
  const filtered = filterHistoricalSeries(city, snapshot, rangeId);
  const monthly = Array.from({ length: 12 }, (_, monthIndex) => {
    const bucket = filtered.filter((entry) => new Date(entry.timestamp).getMonth() === monthIndex);
    return {
      month: formatMonth(monthIso(2026, monthIndex)),
      spi: average(bucket.map((entry) => entry.spi)) ?? 0,
      ndvi: average(bucket.map((entry) => entry.ndvi)) ?? 0,
      lst: average(bucket.map((entry) => entry.lst)) ?? 0,
      soilMoisture: average(bucket.map((entry) => entry.soilMoisture)) ?? 0
    };
  });

  return monthly;
};

const monthIso = (year: number, monthIndex: number) =>
  `${year}-${String(monthIndex + 1).padStart(2, "0")}-01`;

export const buildCurrentConditionRows = (
  snapshot: DashboardSnapshot,
  severityFilter: SeverityFilter = "all"
) => snapshot.currentConditions.filter((entry) => isRiskVisible(entry.riskLevel, severityFilter));

export const buildModelComparisonData = (snapshot: DashboardSnapshot) =>
  snapshot.analytics.modelBenchmarks.map((entry) => ({
    model: entry.modelName,
    rmse: entry.rmse,
    mae: entry.mae,
    r2: entry.r2,
    note: entry.note
  }));

export const buildRegionalPerformanceData = (snapshot: DashboardSnapshot, severityFilter: SeverityFilter = "all") =>
  snapshot.analytics.regionalPerformance.filter((entry) => {
    const city = snapshot.cities.find((candidate) => candidate.id === entry.emirateId);
    return city ? isRiskVisible(city.riskLevel, severityFilter) : true;
  });

export const createUserMessage = (question: string, language: "en" | "ar"): ChatMessage => ({
  id: `user-${Date.now()}`,
  role: "user",
  language,
  timestamp: new Date().toISOString(),
  content: question
});

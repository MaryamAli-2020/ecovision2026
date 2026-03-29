import type {
  ChatMessage,
  CityClimateSeries,
  ClimateMetric,
  DashboardSnapshot,
  RiskLevel
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
  emailSubject: string;
  emailBody: string;
}

const riskPriority: Record<RiskLevel, number> = {
  low: 0,
  moderate: 1,
  high: 2,
  critical: 3
};

export const getSelectedCity = (snapshot: DashboardSnapshot, cityId: string) =>
  snapshot.cities.find((city) => city.id === cityId) ?? snapshot.cities[0];

export const getTimelinePoint = (city: CityClimateSeries, timelineIndex: number) =>
  city.timeSeries[Math.min(Math.max(timelineIndex, 0), city.timeSeries.length - 1)] ?? city.timeSeries[city.timeSeries.length - 1];

const average = (values: Array<number | null | undefined>) => {
  const filtered = values.filter((value): value is number => value !== null && value !== undefined);

  if (!filtered.length) {
    return null;
  }

  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
};

export const getNationalAverages = (snapshot: DashboardSnapshot, timelineIndex: number) => {
  const points = snapshot.cities.map((city) => getTimelinePoint(city, timelineIndex));

  return {
    ndvi: average(points.map((point) => point.ndvi)),
    lst: average(points.map((point) => point.lst)),
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
          : point.spi && point.spi < -1
            ? "Severe drought pressure"
            : "Stress easing gradually"
    },
    {
      title: `Avg LST ${city.city}`,
      value: point.lst,
      unit: "C",
      accent: "amber",
      note:
        point.riskLevel === "critical"
          ? "Thermal emergency threshold crossed"
          : point.lst && point.lst > 43
            ? "Thermal hotspot remains active"
            : "Urban cooling signal improving"
    },
    {
      title: "NDVI UAE Avg",
      value: national.ndvi,
      unit: "",
      accent: "teal",
      note: "National greenness benchmark"
    },
    {
      title: "Forecast Accuracy",
      value: national.forecastAccuracy,
      unit: "%",
      accent: "emerald",
      note: "MSTT confidence across portfolio"
    }
  ];
};

export const buildForecastSeries = (city: CityClimateSeries, timelineIndex: number) =>
  city.timeSeries.map((point, index) => ({
    label: formatMonth(point.timestamp),
    timestamp: point.timestamp,
    actualObserved: index <= timelineIndex ? point.spi : null,
    forecastObserved: index <= timelineIndex ? point.forecast : null,
    futureForecast: index >= timelineIndex ? point.forecast : null
  }));

export const buildForecastSummary = (city: CityClimateSeries, timelineIndex: number) => {
  const point = getTimelinePoint(city, timelineIndex);

  if (point.riskLevel === "critical") {
    return {
      headline: `${city.city} enters critical alert posture`,
      detail: `${point.forecastAccuracy?.toFixed(0) ?? "N/A"}% confidence with emergency heat and drought stress around ${point.forecast?.toFixed(1) ?? "N/A"} projected SPI`,
      signal: "Escalate immediately"
    };
  }

  return {
    headline: `${city.city} forecast stabilizing`,
    detail: `${point.forecastAccuracy?.toFixed(0) ?? "N/A"}% confidence with ${point.riskLevel} risk posture and ${point.forecast?.toFixed(1) ?? "N/A"} projected SPI`,
    signal:
      point.forecast !== null && point.forecast !== undefined && point.forecast > (point.spi ?? point.forecast)
        ? "Improving resilience"
        : "Monitor closely"
  };
};

export const countCriticalSignals = (snapshot: DashboardSnapshot, timelineIndex: number) =>
  snapshot.cities.filter((city) => getTimelinePoint(city, timelineIndex).riskLevel === "critical").length;

export const buildDecisionAlerts = (snapshot: DashboardSnapshot, timelineIndex: number): DecisionAlert[] => {
  const alerts: Array<DecisionAlert | null> = snapshot.cities.map((city) => {
      const point = getTimelinePoint(city, timelineIndex);

      if (point.riskLevel === "low") {
        return null;
      }

      const escalationWindow =
        point.riskLevel === "critical"
          ? "Dispatch within 15 min"
          : point.riskLevel === "high"
            ? "Review within 60 min"
            : "Include in next decision digest";
      const targetRoles =
        point.riskLevel === "critical"
          ? ["Municipal command center", "Climate resilience director", "Infrastructure duty officer"]
          : point.riskLevel === "high"
            ? ["Urban planning lead", "Parks and irrigation operations", "Environmental intelligence team"]
            : ["Sustainability office", "Data and policy unit"];
      const channels =
        point.riskLevel === "critical"
          ? (["email", "sms", "whatsapp", "webhook"] as AlertChannel[])
          : point.riskLevel === "high"
            ? (["email", "whatsapp", "webhook"] as AlertChannel[])
            : (["email"] as AlertChannel[]);
      const title =
        point.riskLevel === "critical"
          ? `${city.city} critical climate alert`
          : point.riskLevel === "high"
            ? `${city.city} escalation watch`
            : `${city.city} monitoring brief`;
      const summary =
        point.riskLevel === "critical"
          ? `${city.city} has crossed a critical threshold with SPI ${point.spi?.toFixed(1) ?? "N/A"}, LST ${point.lst?.toFixed(1) ?? "N/A"} C, and NDVI ${point.ndvi?.toFixed(2) ?? "N/A"}. Trigger direct outreach to decision makers and field-response teams now.`
          : point.riskLevel === "high"
            ? `${city.city} is in a high-risk posture. Send an executive brief, notify operations leads, and queue a same-day mitigation review focused on ${city.policyNote.toLowerCase()}.`
            : `${city.city} should remain in the decision-maker digest so policy teams can track trend direction and confirm whether escalation is needed next cycle.`;
      const emailSubject = `[EcoVision ${point.riskLevel.toUpperCase()}] ${city.city} climate resilience alert`;
      const emailBody = [
        `City: ${city.city}`,
        `Region: ${city.region}`,
        `Risk level: ${point.riskLevel}`,
        `SPI: ${point.spi?.toFixed(1) ?? "N/A"}`,
        `NDVI: ${point.ndvi?.toFixed(2) ?? "N/A"}`,
        `Land Surface Temperature: ${point.lst?.toFixed(1) ?? "N/A"} C`,
        `Forecast Accuracy: ${point.forecastAccuracy?.toFixed(0) ?? "N/A"}%`,
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
    case "satellite":
      return city.derived.riskScore / 100;
    default:
      return 0;
  }
};

export const createUserMessage = (question: string, language: "en" | "ar"): ChatMessage => ({
  id: `user-${Date.now()}`,
  role: "user",
  language,
  timestamp: new Date().toISOString(),
  content: question
});

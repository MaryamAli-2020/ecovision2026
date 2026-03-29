import type {
  ChatMessage,
  CityClimateSeries,
  ClimateMetric,
  DashboardSnapshot
} from "@ecovision/shared";

import { formatMonth } from "./utils";

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
      note: point.spi && point.spi < -1 ? "Severe drought pressure" : "Stress easing gradually"
    },
    {
      title: `Avg LST ${city.city}`,
      value: point.lst,
      unit: "°C",
      accent: "amber",
      note: point.lst && point.lst > 43 ? "Thermal hotspot remains active" : "Urban cooling signal improving"
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

export const buildForecastSeries = (city: CityClimateSeries) =>
  city.timeSeries.map((point) => ({
    label: formatMonth(point.timestamp),
    timestamp: point.timestamp,
    actual: point.spi,
    forecast: point.forecast
  }));

export const buildForecastSummary = (city: CityClimateSeries, timelineIndex: number) => {
  const point = getTimelinePoint(city, timelineIndex);

  return {
    headline: `${city.city} forecast stabilizing`,
    detail: `${point.forecastAccuracy?.toFixed(0) ?? "N/A"}% confidence with ${point.riskLevel} risk posture and ${point.forecast?.toFixed(1) ?? "N/A"} projected SPI`,
    signal: point.forecast !== null && point.forecast !== undefined && point.forecast > (point.spi ?? point.forecast) ? "Improving resilience" : "Monitor closely"
  };
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

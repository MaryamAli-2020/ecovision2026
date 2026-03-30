import {
  DEFAULT_TIMELINE,
  EXPECTED_FIELDS,
  FIELD_ALIASES,
  KNOWN_UAE_CITIES,
  SAMPLE_QUESTIONS
} from "./constants.js";
import { createDemoSnapshot, createSnapshotFromCities } from "./demoData.js";
import type {
  CityClimateSeries,
  ClimatePoint,
  DashboardSnapshot,
  DataMode,
  DataSourceType,
  DatasetProfile,
  ExpectedField,
  FieldMapping,
  HistoricalClimatePoint,
  NormalizationResult,
  NormalizationWarning,
  NormalizedClimateRecord,
  RiskLevel
} from "./types.js";

const normalizeHeader = (value: string): string => value.trim().toLowerCase().replace(/[\s-]+/g, "_");

const toTitleCase = (value: string): string =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toTimestamp = (value: unknown, fallbackIndex: number): string => {
  if (!value) {
    return DEFAULT_TIMELINE[Math.min(fallbackIndex, DEFAULT_TIMELINE.length - 1)];
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  const parsed = new Date(String(value));

  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  return DEFAULT_TIMELINE[Math.min(fallbackIndex, DEFAULT_TIMELINE.length - 1)];
};

const deriveRiskScore = (
  spi: number | null,
  lst: number | null,
  ndvi: number | null,
  soilMoisture: number | null
) =>
  Math.abs(Math.min(spi ?? 0, 0)) * 28 +
  Math.max(0, (lst ?? 0) - 39) * 5 +
  Math.max(0, 0.34 - (ndvi ?? 0)) * 120 +
  Math.max(0, 0.24 - (soilMoisture ?? 0)) * 180;

const normalizeRisk = (
  value: unknown,
  spi: number | null,
  lst: number | null,
  ndvi: number | null,
  soilMoisture: number | null
): RiskLevel => {
  const normalized = String(value ?? "").toLowerCase().trim();

  if (normalized === "low" || normalized === "moderate" || normalized === "high" || normalized === "critical") {
    return normalized;
  }

  const riskScore = deriveRiskScore(spi, lst, ndvi, soilMoisture);

  if (riskScore >= 74) {
    return "critical";
  }

  if (riskScore >= 56) {
    return "high";
  }

  if (riskScore >= 36) {
    return "moderate";
  }

  return "low";
};

const deriveFallbackNarrative = (city: string, riskLevel: RiskLevel): string => {
  const base = `${city} climate indicators were harmonized successfully.`;

  if (riskLevel === "critical") {
    return `${base} Critical drought conditions suggest immediate mitigation and executive escalation.`;
  }

  if (riskLevel === "high") {
    return `${base} High stress conditions warrant near-term cooling, irrigation, and alerting actions.`;
  }

  if (riskLevel === "moderate") {
    return `${base} Conditions remain manageable with active resilience monitoring.`;
  }

  return `${base} Conditions are comparatively stable and suitable for resilience benchmarking.`;
};

const deriveFallbackPolicy = (city: string, riskLevel: RiskLevel): string => {
  if (riskLevel === "critical") {
    return `Trigger drought response escalation in ${city} with irrigation tuning, field-team alerts, and thermal shielding in exposed corridors.`;
  }

  if (riskLevel === "high") {
    return `Accelerate municipal adaptation in ${city} through cooling surfaces, targeted greening, and alert threshold reviews.`;
  }

  if (riskLevel === "moderate") {
    return `Maintain active monitoring and targeted landscape resilience measures in ${city}.`;
  }

  return `Use ${city} as a benchmark site for resilient landscape, runoff, and cooling strategies.`;
};

const getValue = (row: Record<string, unknown>, fieldName?: string): unknown => {
  if (!fieldName) {
    return undefined;
  }

  return row[fieldName];
};

const buildAudioBriefs = (city: string, summaryText: string) => ({
  en: `${city} climate briefing: ${summaryText} The operational focus is to stabilize SPI risk, preserve vegetation health, and sustain soil moisture resilience.`,
  ar: `إحاطة ${city}: ${summaryText} يركز التحديث على استقرار الجفاف، حماية الغطاء النباتي، ودعم رطوبة التربة.`
});

const computeCompleteness = (records: NormalizedClimateRecord[], mappedFields: FieldMapping): number => {
  if (records.length === 0) {
    return 0;
  }

  const filledCells = records.reduce((sum, record) => {
    const values = [
      record.city,
      record.latitude,
      record.longitude,
      record.timestamp,
      record.spi,
      record.ndvi,
      record.lst,
      record.soilMoisture,
      record.forecast,
      record.forecastAccuracy,
      record.riskLevel,
      record.policyNote,
      record.summaryText
    ];
    return sum + values.filter((value) => value !== null && value !== undefined && value !== "").length;
  }, 0);

  const mappedCount = Math.max(Object.keys(mappedFields).length, 9);
  return Math.max(0.2, Math.min(1, filledCells / (records.length * mappedCount)));
};

const buildHistoricalSeries = (records: NormalizedClimateRecord[]): HistoricalClimatePoint[] =>
  records.map((record, index) => {
    const predictedSpi = (record.forecast ?? record.spi ?? -0.5) + (index % 4 === 0 ? 0.05 : -0.03);
    const rainfallDeficit = Math.abs(Math.min(record.spi ?? 0, 0)) * 38 + Math.max(0, 0.26 - (record.soilMoisture ?? 0.22)) * 110;
    const anomaly = (record.spi ?? 0) * 0.55 + Math.max(0, 0.26 - (record.soilMoisture ?? 0.22)) * 1.2;

    return {
      timestamp: record.timestamp,
      spi: record.spi ?? null,
      ndvi: record.ndvi ?? null,
      lst: record.lst ?? null,
      soilMoisture: record.soilMoisture ?? null,
      predictedSpi,
      residual: predictedSpi - (record.spi ?? predictedSpi),
      confidence: record.forecastAccuracy ?? 82,
      rainfallDeficit,
      anomaly
    };
  });

const buildCitySeries = (records: NormalizedClimateRecord[]): CityClimateSeries[] => {
  const grouped = new Map<string, NormalizedClimateRecord[]>();

  records.forEach((record) => {
    const key = record.city.toLowerCase();
    const list = grouped.get(key) ?? [];
    list.push(record);
    grouped.set(key, list);
  });

  return Array.from(grouped.values()).map((cityRecords) => {
    cityRecords.sort((left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime());
    const latest = cityRecords[cityRecords.length - 1];
    const previous = cityRecords[Math.max(0, cityRecords.length - 2)] ?? latest;
    const lookup = KNOWN_UAE_CITIES[latest.city.toLowerCase()];

    const timeSeries: ClimatePoint[] = cityRecords.map((record, index) => {
      const lowerBound = (record.forecast ?? record.spi ?? 0) - 0.2;
      const upperBound = (record.forecast ?? record.spi ?? 0) + 0.2;
      const rainfallDeficit = Math.abs(Math.min(record.spi ?? 0, 0)) * 38 + Math.max(0, 0.26 - (record.soilMoisture ?? 0.22)) * 110;
      const anomaly = (record.spi ?? 0) * 0.55 + Math.max(0, 0.26 - (record.soilMoisture ?? 0.22)) * 1.2 + index * 0.01;

      return {
        timestamp: record.timestamp,
        spi: record.spi,
        ndvi: record.ndvi,
        lst: record.lst,
        soilMoisture: record.soilMoisture,
        forecast: record.forecast ?? record.spi ?? null,
        forecastAccuracy: record.forecastAccuracy ?? 82,
        lowerBound,
        upperBound,
        rainfallDeficit,
        anomaly,
        riskLevel: record.riskLevel,
        summaryText: record.summaryText
      };
    });

    const historicalSeries = buildHistoricalSeries(cityRecords);
    const riskScore = deriveRiskScore(latest.spi ?? null, latest.lst ?? null, latest.ndvi ?? null, latest.soilMoisture ?? null);
    const latestSpi = latest.spi ?? null;
    const previousSpi = previous.spi ?? null;
    const trendDirection =
      latestSpi !== null && previousSpi !== null
        ? latestSpi > previousSpi
          ? "up"
          : latestSpi < previousSpi
            ? "down"
            : "stable"
        : "stable";

    return {
      id: latest.city.toLowerCase().replace(/\s+/g, "-"),
      city: latest.city,
      emirate: lookup?.emirate ?? latest.city,
      region: lookup?.region ?? "Imported climate region",
      latitude: latest.latitude,
      longitude: latest.longitude,
      riskLevel: latest.riskLevel,
      summaryText: latest.summaryText,
      policyNote: latest.policyNote,
      audioBriefs: buildAudioBriefs(latest.city, latest.summaryText),
      highlights: [
        `Risk ${latest.riskLevel}`,
        `SPI ${latest.spi !== null && latest.spi !== undefined ? latest.spi.toFixed(1) : "N/A"}`,
        `Soil ${latest.soilMoisture !== null && latest.soilMoisture !== undefined ? latest.soilMoisture.toFixed(2) : "N/A"}`
      ],
      recommendations: [
        {
          title: "Imported resilience action",
          summary: latest.policyNote,
          domain: "risk-mitigation"
        }
      ],
      featureInfluence: [
        {
          feature: "Soil Moisture",
          weight: 0.32,
          narrative: "Imported datasets benefit when soil moisture is mapped explicitly for persistence estimation."
        },
        {
          feature: "NDVI",
          weight: 0.24,
          narrative: "Vegetation condition remains important for explaining drought severity differences."
        },
        {
          feature: "LST",
          weight: 0.22,
          narrative: "Surface heat strengthens the stress signal in high-exposure parcels."
        },
        {
          feature: "Seasonality",
          weight: 0.22,
          narrative: "Seasonal timing helps the model contextualize repeated drought cycles."
        }
      ],
      timeSeries,
      historicalSeries,
      derived: {
        currentSpi: latest.spi ?? null,
        currentNdvi: latest.ndvi ?? null,
        currentLst: latest.lst ?? null,
        currentSoilMoisture: latest.soilMoisture ?? null,
        currentForecast: latest.forecast ?? null,
        currentForecastAccuracy: latest.forecastAccuracy ?? null,
        previousSpi: previous.spi ?? null,
        rainfallDeficit: timeSeries[timeSeries.length - 1]?.rainfallDeficit ?? null,
        anomaly: timeSeries[timeSeries.length - 1]?.anomaly ?? null,
        riskScore,
        trendDirection
      }
    };
  });
};

export const inferFieldMapping = (fields: string[]): FieldMapping => {
  const normalizedFields = fields.map((field) => ({ original: field, normalized: normalizeHeader(field) }));
  const mapping: FieldMapping = {};

  EXPECTED_FIELDS.forEach((expectedField: ExpectedField) => {
    const aliases = FIELD_ALIASES[expectedField];
    const match = normalizedFields.find((field) => aliases.includes(field.normalized));

    if (match) {
      mapping[expectedField] = match.original;
    }
  });

  return mapping;
};

export const normalizeDataset = (
  rows: Record<string, unknown>[],
  options: {
    fieldMapping?: FieldMapping;
    datasetName?: string;
    sourceType?: DataSourceType;
    mode?: DataMode;
  } = {}
): NormalizationResult => {
  if (!rows.length) {
    const fallback = createDemoSnapshot();
    const warning: NormalizationWarning = {
      code: "empty_dataset",
      message: "The supplied dataset was empty. Demo data has been loaded instead.",
      severity: "warning"
    };

    return {
      snapshot: { ...fallback, warnings: [warning] },
      previewRows: [],
      availableFields: [],
      inferredMapping: {},
      warnings: [warning],
      needsMapping: false,
      usedDemoFallback: true
    };
  }

  const availableFields = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set<string>())
  );

  const inferredMapping = inferFieldMapping(availableFields);
  const mapping: FieldMapping = { ...inferredMapping, ...options.fieldMapping };
  const warnings: NormalizationWarning[] = [];
  const needsMapping = !mapping.city || (!mapping.summary_text && !mapping.policy_note);

  if (needsMapping) {
    warnings.push({
      code: "mapping_recommended",
      message: "Some expected fields were not confidently inferred. Manual mapping can improve the richer forecast and alert widgets.",
      severity: "info"
    });
  }

  const normalizedRecords: NormalizedClimateRecord[] = rows.map((row, index) => {
    const rawCity = getValue(row, mapping.city);
    const city = rawCity ? toTitleCase(String(rawCity)) : `Station ${index + 1}`;
    const knownLocation = KNOWN_UAE_CITIES[city.toLowerCase()];
    const spi = toNumber(getValue(row, mapping.spi));
    const ndvi = toNumber(getValue(row, mapping.ndvi));
    const lst = toNumber(getValue(row, mapping.lst));
    const soilMoisture = toNumber(getValue(row, mapping.soil_moisture));
    const forecast = toNumber(getValue(row, mapping.forecast));
    const forecastAccuracy = toNumber(getValue(row, mapping.forecast_accuracy));
    const latitude = toNumber(getValue(row, mapping.latitude)) ?? knownLocation?.latitude ?? 24.35;
    const longitude = toNumber(getValue(row, mapping.longitude)) ?? knownLocation?.longitude ?? 54.9;
    const riskLevel = normalizeRisk(getValue(row, mapping.risk_level), spi, lst, ndvi, soilMoisture);
    const summaryText =
      String(getValue(row, mapping.summary_text) ?? "").trim() || deriveFallbackNarrative(city, riskLevel);
    const policyNote =
      String(getValue(row, mapping.policy_note) ?? "").trim() || deriveFallbackPolicy(city, riskLevel);

    return {
      city,
      latitude,
      longitude,
      timestamp: toTimestamp(getValue(row, mapping.timestamp), index % DEFAULT_TIMELINE.length),
      spi,
      ndvi,
      lst,
      soilMoisture,
      forecast,
      forecastAccuracy,
      riskLevel,
      policyNote,
      summaryText
    };
  });

  const cities = buildCitySeries(normalizedRecords);

  if (!cities.length) {
    const fallback = createDemoSnapshot();
    const warning: NormalizationWarning = {
      code: "normalization_failed",
      message: "The dataset could not be shaped into dashboard entities. Demo data has been loaded instead.",
      severity: "warning"
    };

    return {
      snapshot: { ...fallback, warnings: [warning] },
      previewRows: rows.slice(0, 5),
      availableFields,
      inferredMapping,
      warnings: [warning],
      needsMapping: false,
      usedDemoFallback: true
    };
  }

  const timeline = Array.from(new Set(normalizedRecords.map((record) => record.timestamp))).sort(
    (left, right) => new Date(left).getTime() - new Date(right).getTime()
  );
  const missingFields = EXPECTED_FIELDS.filter((field) => !mapping[field]);
  const profile: DatasetProfile = {
    datasetName: options.datasetName ?? "Imported climate dataset",
    sourceType: options.sourceType ?? "upload",
    recordCount: normalizedRecords.length,
    cityCount: cities.length,
    fields: availableFields,
    mappedFields: mapping,
    missingFields,
    completenessScore: computeCompleteness(normalizedRecords, mapping),
    temporalScale: "Monthly",
    spatialResolution: "Mixed imported resolution",
    harmonizedResolution: "1 km target"
  };

  const snapshot: DashboardSnapshot = createSnapshotFromCities(cities, {
    mode: options.mode ?? "live",
    sourceType: options.sourceType ?? "upload",
    datasetLabel: profile.datasetName,
    sourceLabel:
      profile.sourceType === "mongo"
        ? "Live MongoDB climate ingestion"
        : "Uploaded structured climate dataset",
    profile,
    selectedCityId: cities[0]?.id,
    warnings
  });

  return {
    snapshot: {
      ...snapshot,
      lastUpdated: timeline[timeline.length - 1] ?? snapshot.lastUpdated,
      sampleQuestions: SAMPLE_QUESTIONS
    },
    previewRows: rows.slice(0, 5),
    availableFields,
    inferredMapping,
    warnings,
    needsMapping,
    usedDemoFallback: false
  };
};

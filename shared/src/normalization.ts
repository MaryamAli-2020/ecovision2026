import {
  DEFAULT_TIMELINE,
  EXPECTED_FIELDS,
  FIELD_ALIASES,
  KNOWN_UAE_CITIES,
  SAMPLE_QUESTIONS
} from "./constants";
import { createDemoMessages, createDemoSnapshot } from "./demoData";
import type {
  ChatMessage,
  CityClimateSeries,
  ClimatePoint,
  DashboardSnapshot,
  DataMode,
  DataSourceType,
  DatasetProfile,
  ExpectedField,
  FieldMapping,
  NormalizationResult,
  NormalizationWarning,
  NormalizedClimateRecord,
  RiskLevel
} from "./types";

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

const normalizeRisk = (value: unknown, spi: number | null, lst: number | null, ndvi: number | null): RiskLevel => {
  const normalized = String(value ?? "").toLowerCase().trim();

  if (normalized === "low" || normalized === "moderate" || normalized === "high" || normalized === "critical") {
    return normalized;
  }

  const riskScore = Math.abs(Math.min(spi ?? 0, 0)) * 28 + Math.max(0, (lst ?? 0) - 39) * 6 + Math.max(0, 0.34 - (ndvi ?? 0)) * 120;

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

const deriveFallbackNarrative = (city: string, riskLevel: RiskLevel): string => {
  const base = `${city} environmental indicators were normalized successfully.`;

  if (riskLevel === "critical") {
    return `${base} Critical conditions warrant immediate heat and drought mitigation.`;
  }

  if (riskLevel === "high") {
    return `${base} Elevated stress suggests near-term cooling and irrigation interventions.`;
  }

  if (riskLevel === "moderate") {
    return `${base} Conditions are manageable but should remain under active monitoring.`;
  }

  return `${base} Conditions are comparatively stable with room for resilience benchmarking.`;
};

const deriveFallbackPolicy = (city: string, riskLevel: RiskLevel): string => {
  if (riskLevel === "critical") {
    return `Deploy emergency response measures in ${city}, including rapid irrigation tuning and thermal shielding in exposed corridors.`;
  }

  if (riskLevel === "high") {
    return `Accelerate municipal adaptation in ${city} through reflective surfaces, tree planting, and early-warning alerts.`;
  }

  if (riskLevel === "moderate") {
    return `Maintain active monitoring and targeted greening projects in ${city} to prevent escalation.`;
  }

  return `Use ${city} as a benchmark site for resilient landscape and cooling strategies.`;
};

const getValue = (row: Record<string, unknown>, fieldName?: string): unknown => {
  if (!fieldName) {
    return undefined;
  }

  return row[fieldName];
};

const buildAudioBriefs = (city: string, summaryText: string) => ({
  en: `${city} climate briefing: ${summaryText} The current operational priority is to stabilize vegetation, suppress surface heat, and improve short-range forecast trust.`,
  ar: `إحاطة ${city}: ${summaryText} الأولوية التشغيلية الحالية هي تثبيت الغطاء النباتي وخفض حرارة السطح ورفع موثوقية التوقعات قصيرة المدى.`
});

const computeCompleteness = (records: NormalizedClimateRecord[], mappedFields: FieldMapping): number => {
  if (records.length === 0) {
    return 0;
  }

  const filledCells = records.reduce((sum, record) => {
    const values = [record.city, record.latitude, record.longitude, record.timestamp, record.spi, record.ndvi, record.lst, record.forecast, record.forecastAccuracy, record.riskLevel, record.policyNote, record.summaryText];
    return sum + values.filter((value) => value !== null && value !== undefined && value !== "").length;
  }, 0);

  const mappedCount = Math.max(Object.keys(mappedFields).length, 8);
  return Math.max(0.2, Math.min(1, filledCells / (records.length * mappedCount)));
};

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
    const timeSeries: ClimatePoint[] = cityRecords.map((record) => ({
      timestamp: record.timestamp,
      spi: record.spi,
      ndvi: record.ndvi,
      lst: record.lst,
      forecast: record.forecast,
      forecastAccuracy: record.forecastAccuracy,
      riskLevel: record.riskLevel,
      summaryText: record.summaryText
    }));

    const riskScore =
      Math.abs(Math.min(latest.spi ?? 0, 0)) * 28 +
      Math.max(0, (latest.lst ?? 0) - 39) * 6 +
      Math.max(0, 0.34 - (latest.ndvi ?? 0)) * 120;
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
      region: lookup?.region ?? "Imported dataset",
      latitude: latest.latitude,
      longitude: latest.longitude,
      riskLevel: latest.riskLevel,
      summaryText: latest.summaryText,
      policyNote: latest.policyNote,
      audioBriefs: buildAudioBriefs(latest.city, latest.summaryText),
      highlights: [
        `Risk ${latest.riskLevel}`,
        `SPI ${latest.spi !== null && latest.spi !== undefined ? latest.spi.toFixed(1) : "N/A"}`,
        `LST ${latest.lst !== null && latest.lst !== undefined ? latest.lst.toFixed(1) : "N/A"}°C`
      ],
      timeSeries,
      derived: {
        currentSpi: latest.spi ?? null,
        currentNdvi: latest.ndvi ?? null,
        currentLst: latest.lst ?? null,
        currentForecast: latest.forecast ?? null,
        currentForecastAccuracy: latest.forecastAccuracy ?? null,
        previousSpi: previous.spi ?? null,
        riskScore,
        trendDirection
      }
    };
  });
};

const buildSeedMessages = (cities: CityClimateSeries[]): ChatMessage[] => {
  if (!cities.length) {
    return createDemoMessages();
  }

  const riskiest = [...cities].sort((left, right) => right.derived.riskScore - left.derived.riskScore)[0];
  const calmest = [...cities].sort((left, right) => left.derived.riskScore - right.derived.riskScore)[0];

  return [
    {
      id: "import-seed-1",
      role: "assistant",
      language: "en",
      timestamp: new Date().toISOString(),
      title: `${riskiest.city} Risk Insight`,
      content: `${riskiest.city} currently carries the highest modeled climate stress in the imported dataset. Recommended action: ${riskiest.policyNote}`,
      chips: [
        `SPI ${riskiest.derived.currentSpi?.toFixed(1) ?? "N/A"}`,
        `NDVI ${riskiest.derived.currentNdvi?.toFixed(2) ?? "N/A"}`
      ],
      actions: [
        { type: "download-pdf", label: "Download PDF", language: "en" },
        { type: "audio-brief", label: "Audio Brief (AR)", language: "ar" }
      ]
    },
    {
      id: "import-seed-2",
      role: "assistant",
      language: "en",
      timestamp: new Date().toISOString(),
      title: `${calmest.city} Stability Signal`,
      content: `${calmest.city} is the most stable city in the imported dataset and can be used as a benchmark for resilience playbooks and cooling-performance targets.`,
      chips: [`Risk ${calmest.riskLevel}`]
    }
  ];
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
      message: "Some expected fields were not confidently inferred. You can map fields manually for richer widgets.",
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
    const forecast = toNumber(getValue(row, mapping.forecast));
    const forecastAccuracy = toNumber(getValue(row, mapping.forecast_accuracy));
    const latitude = toNumber(getValue(row, mapping.latitude)) ?? knownLocation?.latitude ?? 24.35;
    const longitude = toNumber(getValue(row, mapping.longitude)) ?? knownLocation?.longitude ?? 54.9;
    const riskLevel = normalizeRisk(getValue(row, mapping.risk_level), spi, lst, ndvi);
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
    completenessScore: computeCompleteness(normalizedRecords, mapping)
  };

  const snapshot: DashboardSnapshot = {
    mode: options.mode ?? "live",
    sourceType: options.sourceType ?? "upload",
    datasetLabel: profile.datasetName,
    sourceLabel:
      profile.sourceType === "mongo"
        ? "Live MongoDB ingestion"
        : "Uploaded structured climate dataset",
    generatedAt: new Date().toISOString(),
    lastUpdated: timeline[timeline.length - 1] ?? new Date().toISOString(),
    selectedCityId: cities[0].id,
    timeline: timeline.length ? timeline : DEFAULT_TIMELINE,
    cities,
    availableMetrics: ["drought", "heat", "ndvi", "satellite"],
    sampleQuestions: SAMPLE_QUESTIONS,
    seedMessages: buildSeedMessages(cities),
    audioWaveform: createDemoSnapshot().audioWaveform,
    profile,
    warnings
  };

  return {
    snapshot,
    previewRows: rows.slice(0, 5),
    availableFields,
    inferredMapping,
    warnings,
    needsMapping,
    usedDemoFallback: false
  };
};

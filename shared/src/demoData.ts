import {
  AVAILABLE_METRICS,
  DATE_RANGE_OPTIONS,
  DEFAULT_TIMELINE,
  DEMO_AUDIO_WAVEFORM,
  REMOTE_DATA_SOURCES,
  SAMPLE_QUESTIONS
} from "./constants.js";
import type {
  AudioBrief,
  ChatMessage,
  CityClimateSeries,
  ClimatePoint,
  CurrentConditionRow,
  DashboardAnalytics,
  DashboardSnapshot,
  DataMode,
  DataSourceType,
  DatasetProfile,
  FeatureInfluence,
  HistoricalClimatePoint,
  Language,
  NormalizationWarning,
  RiskLevel
} from "./types.js";

interface EmirateSeed {
  id: string;
  city: string;
  emirate: string;
  region: string;
  latitude: number;
  longitude: number;
  phase: number;
  spiBase: number;
  ndviBase: number;
  lstBase: number;
  soilBase: number;
  droughtTrend: number;
  forecastBias: number;
  summaryText: string;
  policyNote: string;
  highlights: string[];
  recommendations: CityClimateSeries["recommendations"];
  influenceProfile: Array<{ feature: string; weight: number; narrative: string }>;
  benchmark: { rmse: number; mae: number; r2: number; confidence: number; note: string };
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const monthIso = (year: number, monthIndex: number) =>
  `${year}-${String(monthIndex + 1).padStart(2, "0")}-01`;

const buildBrief = (city: string, summary: string, language: Language): string => {
  if (language === "ar") {
    return `إحاطة ${city}: ${summary} يركز هذا التحديث على الإجهاد الحراري، صحة الغطاء النباتي، ومستوى الجفاف المتوقع مع توصيات تشغيلية قصيرة المدى لصناع القرار.`;
  }

  return `${city} climate briefing: ${summary} This update emphasizes drought posture, vegetation health, thermal stress, and near-term operational actions for decision makers.`;
};

const computeRiskLevel = (
  spi: number | null | undefined,
  lst: number | null | undefined,
  ndvi: number | null | undefined,
  soilMoisture: number | null | undefined
): RiskLevel => {
  const riskScore =
    Math.abs(Math.min(spi ?? 0, 0)) * 28 +
    Math.max(0, (lst ?? 0) - 39) * 5 +
    Math.max(0, 0.34 - (ndvi ?? 0)) * 120 +
    Math.max(0, 0.24 - (soilMoisture ?? 0)) * 180;

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

const riskScoreFromPoint = (point: ClimatePoint) =>
  Math.abs(Math.min(point.spi ?? 0, 0)) * 28 +
  Math.max(0, (point.lst ?? 0) - 39) * 5 +
  Math.max(0, 0.34 - (point.ndvi ?? 0)) * 120 +
  Math.max(0, 0.24 - (point.soilMoisture ?? 0)) * 180;

const buildHistoricalSeries = (seed: EmirateSeed): HistoricalClimatePoint[] => {
  const series: HistoricalClimatePoint[] = [];

  for (let year = 2000; year <= 2026; year += 1) {
    for (let month = 0; month < 12; month += 1) {
      const index = (year - 2000) * 12 + month;
      const seasonal = Math.sin((index / 12) * Math.PI * 2 + seed.phase);
      const summerPulse = Math.max(0, Math.sin(((month - 1) / 12) * Math.PI * 2));
      const interannual = Math.cos(index / 20 + seed.phase * 0.7) * 0.18;
      const warming = (year - 2000) * 0.015;
      const droughtLoad = (year - 2000) * seed.droughtTrend + (year >= 2017 ? 0.16 : 0) + (year >= 2021 ? 0.09 : 0);

      const spi = clamp(seed.spiBase + seasonal * 0.48 + interannual - droughtLoad, -2.4, 1.4);
      const ndvi = clamp(seed.ndviBase + seasonal * 0.035 - droughtLoad * 0.018 - summerPulse * 0.012 + 0.02, 0.16, 0.62);
      const lst = clamp(seed.lstBase + summerPulse * 6.2 + warming + droughtLoad * 3.6, 31.5, 49.8);
      const soilMoisture = clamp(seed.soilBase + seasonal * 0.03 - droughtLoad * 0.02 - summerPulse * 0.016 + 0.01, 0.09, 0.44);
      const predictedSpi = clamp(spi + Math.sin(index / 7 + seed.phase) * 0.09 + seed.forecastBias, -2.3, 1.4);
      const residual = predictedSpi - spi;
      const confidence = clamp(seed.benchmark.confidence + Math.cos(index / 10 + seed.phase) * 3.2, 79, 95);
      const rainfallDeficit = clamp(Math.abs(Math.min(spi, 0)) * 42 + droughtLoad * 26 + summerPulse * 12, 3, 126);
      const anomaly = clamp((spi - seed.spiBase) * 0.9 + (0.26 - soilMoisture) * 0.7, -1.6, 1.8);

      series.push({
        timestamp: monthIso(year, month),
        spi,
        ndvi,
        lst,
        soilMoisture,
        predictedSpi,
        residual,
        confidence,
        rainfallDeficit,
        anomaly
      });
    }
  }

  return series;
};

const buildOutlookSeries = (seed: EmirateSeed, history: HistoricalClimatePoint[]): ClimatePoint[] =>
  DEFAULT_TIMELINE.map((timestamp, index) => {
    const historyPoint =
      history.find((entry) => entry.timestamp === timestamp) ??
      history[history.length - DEFAULT_TIMELINE.length + index];
    const forecast = clamp((historyPoint?.predictedSpi ?? seed.spiBase) + index * 0.015, -2.1, 1.3);
    const lowerBound = clamp(forecast - 0.22 - index * 0.003, -2.4, 1.1);
    const upperBound = clamp(forecast + 0.22 + index * 0.003, -1.8, 1.5);
    const confidence = clamp((historyPoint?.confidence ?? seed.benchmark.confidence) - index * 0.25, 78, 95);
    const spi = clamp((historyPoint?.spi ?? forecast) + (index < 3 ? 0 : -0.03), -2.3, 1.2);
    const ndvi = clamp((historyPoint?.ndvi ?? seed.ndviBase) + (index >= 6 ? 0.015 : 0), 0.15, 0.6);
    const lst = clamp((historyPoint?.lst ?? seed.lstBase) + (index >= 4 && index <= 8 ? 0.35 : -0.15), 32, 50);
    const soilMoisture = clamp((historyPoint?.soilMoisture ?? seed.soilBase) + (index >= 7 ? -0.01 : 0.006), 0.08, 0.45);
    const rainfallDeficit = clamp((historyPoint?.rainfallDeficit ?? 38) + index * 1.8, 2, 130);
    const anomaly = clamp((historyPoint?.anomaly ?? 0) + index * 0.02, -1.6, 2);
    const riskLevel = computeRiskLevel(spi, lst, ndvi, soilMoisture);

    return {
      timestamp,
      spi,
      ndvi,
      lst,
      soilMoisture,
      forecast,
      forecastAccuracy: confidence,
      lowerBound,
      upperBound,
      anomaly,
      rainfallDeficit,
      riskLevel,
      summaryText: seed.summaryText
    };
  });

const buildFeatureInfluence = (seed: EmirateSeed): FeatureInfluence[] =>
  seed.influenceProfile.map((entry) => ({
    feature: entry.feature,
    weight: entry.weight,
    narrative: entry.narrative
  }));

const buildDerivedMetrics = (timeSeries: ClimatePoint[]) => {
  const latest = timeSeries[timeSeries.length - 1];
  const previous = timeSeries[Math.max(0, timeSeries.length - 2)] ?? latest;
  const direction =
    latest.spi !== null && latest.spi !== undefined && previous.spi !== null && previous.spi !== undefined
      ? latest.spi > previous.spi
        ? "up"
        : latest.spi < previous.spi
          ? "down"
          : "stable"
      : "stable";

  return {
    currentSpi: latest.spi ?? null,
    currentNdvi: latest.ndvi ?? null,
    currentLst: latest.lst ?? null,
    currentSoilMoisture: latest.soilMoisture ?? null,
    currentForecast: latest.forecast ?? null,
    currentForecastAccuracy: latest.forecastAccuracy ?? null,
    previousSpi: previous.spi ?? null,
    rainfallDeficit: latest.rainfallDeficit ?? null,
    anomaly: latest.anomaly ?? null,
    riskScore: riskScoreFromPoint(latest),
    trendDirection: direction
  } as const;
};

const emirateSeeds: EmirateSeed[] = [
  {
    id: "abu-dhabi",
    city: "Abu Dhabi",
    emirate: "Abu Dhabi",
    region: "Capital district",
    latitude: 24.4539,
    longitude: 54.3773,
    phase: 0.22,
    spiBase: -0.72,
    ndviBase: 0.29,
    lstBase: 36.9,
    soilBase: 0.24,
    droughtTrend: 0.007,
    forecastBias: 0.06,
    summaryText: "Capital districts show persistent rainfall deficit pressure, but adaptive irrigation programs are cushioning vegetation decline across municipal landscapes.",
    policyNote: "Prioritize smart irrigation dispatch, district cooling optimization, and capital-region drought watch coordination.",
    highlights: ["High infrastructure exposure", "Water demand remains elevated", "MSTT confidence remains strong"],
    recommendations: [
      { title: "Water allocation tuning", summary: "Shift irrigation scheduling toward night-time windows in exposed districts.", domain: "water" },
      { title: "District cooling audit", summary: "Use high-LST parcels to retune cooling demand and reflective surface programs.", domain: "urban-cooling" }
    ],
    influenceProfile: [
      { feature: "NDVI", weight: 0.28, narrative: "Vegetation stress is the clearest early signal for SPI decline in peri-urban corridors." },
      { feature: "LST", weight: 0.24, narrative: "Heat accumulation amplifies drought persistence during summer operations." },
      { feature: "Soil Moisture", weight: 0.31, narrative: "GLDAS-derived soil moisture carries the strongest hydrologic memory for Abu Dhabi." },
      { feature: "Seasonality", weight: 0.17, narrative: "Seasonal structure explains the timing of recurrent late-summer drought peaks." }
    ],
    benchmark: { rmse: 0.29, mae: 0.22, r2: 0.92, confidence: 90, note: "Strong skill in irrigation-managed districts." }
  },
  {
    id: "dubai",
    city: "Dubai",
    emirate: "Dubai",
    region: "Coastal urban corridor",
    latitude: 25.2048,
    longitude: 55.2708,
    phase: 0.52,
    spiBase: -0.84,
    ndviBase: 0.25,
    lstBase: 37.8,
    soilBase: 0.21,
    droughtTrend: 0.008,
    forecastBias: 0.05,
    summaryText: "Urban heat storage remains the dominant pressure in Dubai, with inland districts showing stronger thermal amplification than coastal development zones.",
    policyNote: "Scale reflective materials, tree corridors, and heat-risk mitigation around inland development clusters.",
    highlights: ["Urban heat hotspot", "Coastal buffer present", "High seasonal volatility"],
    recommendations: [
      { title: "Ghaf corridor deployment", summary: "Extend cooling and greening interventions through inland transport corridors.", domain: "urban-cooling" },
      { title: "Heat-risk zoning", summary: "Promote micro-zoned thermal thresholds for high-density developments.", domain: "risk-mitigation" }
    ],
    influenceProfile: [
      { feature: "LST", weight: 0.33, narrative: "Surface heating is the strongest predictor in dense urban land cover." },
      { feature: "NDVI", weight: 0.21, narrative: "Vegetation recovery is slow but helps reduce local forecasted SPI deficits." },
      { feature: "Soil Moisture", weight: 0.26, narrative: "Dry near-surface soils intensify persistence in inland parcels." },
      { feature: "Seasonality", weight: 0.2, narrative: "Seasonal cycles drive recurrent summer drought severity spikes." }
    ],
    benchmark: { rmse: 0.31, mae: 0.24, r2: 0.91, confidence: 89, note: "Highest thermal sensitivity among the Emirates." }
  },
  {
    id: "sharjah",
    city: "Sharjah",
    emirate: "Sharjah",
    region: "Northern urban-agricultural belt",
    latitude: 25.3463,
    longitude: 55.4209,
    phase: 0.84,
    spiBase: -1.02,
    ndviBase: 0.23,
    lstBase: 36.8,
    soilBase: 0.19,
    droughtTrend: 0.009,
    forecastBias: 0.04,
    summaryText: "Sharjah remains the strongest drought hotspot in the control set, with weak soil moisture memory and slow vegetation recovery sustaining elevated SPI deficits.",
    policyNote: "Escalate reclaimed-water irrigation, proactive alerting, and drought zoning for vulnerable municipal landscapes.",
    highlights: ["Highest drought pressure", "Soil moisture deficit persists", "Priority for rapid alerts"],
    recommendations: [
      { title: "Reclaimed-water acceleration", summary: "Expand non-potable irrigation to parks and exposed roadside landscapes.", domain: "water" },
      { title: "Municipal drought watch", summary: "Escalate threshold-based alerts for responder teams and planning units.", domain: "risk-mitigation" }
    ],
    influenceProfile: [
      { feature: "Soil Moisture", weight: 0.35, narrative: "Hydrologic stress is the leading driver of Sharjah's future SPI deterioration." },
      { feature: "NDVI", weight: 0.25, narrative: "Vegetation response remains fragile and strongly conditions the forecast." },
      { feature: "LST", weight: 0.22, narrative: "Heat still matters, especially in transition zones between urban and open land." },
      { feature: "Seasonality", weight: 0.18, narrative: "Seasonal timing helps explain the persistence of summer drought signals." }
    ],
    benchmark: { rmse: 0.27, mae: 0.2, r2: 0.94, confidence: 91, note: "MSTT strongest where multivariate drought signals are coherent." }
  },
  {
    id: "ajman",
    city: "Ajman",
    emirate: "Ajman",
    region: "Compact coastal district",
    latitude: 25.4052,
    longitude: 55.5136,
    phase: 1.1,
    spiBase: -0.88,
    ndviBase: 0.24,
    lstBase: 36.6,
    soilBase: 0.2,
    droughtTrend: 0.0075,
    forecastBias: 0.05,
    summaryText: "Ajman's compact footprint concentrates exposure, and the forecast points to moderate-to-high drought stress when coastal cooling weakens inland.",
    policyNote: "Target compact urban cooling, low-flow irrigation, and district-level risk communication for municipal operators.",
    highlights: ["Compact exposure footprint", "Moderate confidence", "High inland sensitivity"],
    recommendations: [
      { title: "Water efficiency packages", summary: "Adopt district-level irrigation efficiency targets for public landscapes.", domain: "water" },
      { title: "Urban shade retrofits", summary: "Install thermal shelters in pedestrian-heavy inland corridors.", domain: "urban-cooling" }
    ],
    influenceProfile: [
      { feature: "LST", weight: 0.29, narrative: "Thermal amplification dominates Ajman's inland risk pattern." },
      { feature: "Soil Moisture", weight: 0.27, narrative: "Drying surface soils sustain the forecast signal after rainfall deficits." },
      { feature: "NDVI", weight: 0.24, narrative: "Small vegetation changes quickly alter resilience in compact districts." },
      { feature: "Seasonality", weight: 0.2, narrative: "Seasonal patterns explain recurring late-summer stress episodes." }
    ],
    benchmark: { rmse: 0.32, mae: 0.25, r2: 0.9, confidence: 88, note: "Performance drops slightly in mixed urban-coastal pixels." }
  },
  {
    id: "umm-al-quwain",
    city: "Umm Al Quwain",
    emirate: "Umm Al Quwain",
    region: "Lagoon and wetland fringe",
    latitude: 25.5647,
    longitude: 55.5552,
    phase: 1.36,
    spiBase: -0.64,
    ndviBase: 0.31,
    lstBase: 35.2,
    soilBase: 0.27,
    droughtTrend: 0.006,
    forecastBias: 0.06,
    summaryText: "Wetland-adjacent areas help buffer drought severity in Umm Al Quwain, though projected SPI still softens as rainfall deficit accumulates inland.",
    policyNote: "Protect wetland buffers, monitor inland soil moisture drawdown, and keep agriculture adaptation plans ready.",
    highlights: ["Wetland resilience support", "Lower national risk", "Good confidence in outlook"],
    recommendations: [
      { title: "Wetland buffer protection", summary: "Preserve natural moisture retention zones and runoff pathways.", domain: "risk-mitigation" },
      { title: "Agriculture watchlist", summary: "Use forecast confidence to pre-stage crop support measures inland.", domain: "agriculture" }
    ],
    influenceProfile: [
      { feature: "Soil Moisture", weight: 0.3, narrative: "Wetland-driven soil moisture persistence improves SPI predictability." },
      { feature: "NDVI", weight: 0.27, narrative: "Vegetation health tracks seasonal resilience in lagoon-adjacent zones." },
      { feature: "LST", weight: 0.2, narrative: "Heat matters less here than in the inland urban Emirates." },
      { feature: "Seasonality", weight: 0.23, narrative: "Seasonal oscillation explains much of the normal variability." }
    ],
    benchmark: { rmse: 0.26, mae: 0.19, r2: 0.94, confidence: 92, note: "Best forecast stability in wetter coastal fringe conditions." }
  },
  {
    id: "ras-al-khaimah",
    city: "Ras Al Khaimah",
    emirate: "Ras Al Khaimah",
    region: "Mountain-to-coast transition",
    latitude: 25.7895,
    longitude: 55.9432,
    phase: 1.62,
    spiBase: -0.58,
    ndviBase: 0.34,
    lstBase: 34.9,
    soilBase: 0.29,
    droughtTrend: 0.0055,
    forecastBias: 0.07,
    summaryText: "Mountain influence and coastal moderation improve recovery potential in Ras Al Khaimah, though subregional contrast remains high between foothills and lower-elevation settlements.",
    policyNote: "Use Ras Al Khaimah as a comparison benchmark while monitoring foothill drought pockets and runoff variability.",
    highlights: ["Strong recovery potential", "Top R2 performance", "Useful benchmark emirate"],
    recommendations: [
      { title: "Benchmark resilience playbook", summary: "Use higher-performing subregions to guide national adaptation examples.", domain: "risk-mitigation" },
      { title: "Foothill drought watch", summary: "Monitor terrain-driven stress pockets during low-rainfall periods.", domain: "agriculture" }
    ],
    influenceProfile: [
      { feature: "NDVI", weight: 0.31, narrative: "Vegetation recovery explains much of the SPI rebound in this transition zone." },
      { feature: "Soil Moisture", weight: 0.28, narrative: "Hydrologic memory remains strong in mountain-fed catchments." },
      { feature: "Seasonality", weight: 0.23, narrative: "Seasonal variability is higher than in most coastal Emirates." },
      { feature: "LST", weight: 0.18, narrative: "Thermal stress is present but less dominant than elsewhere." }
    ],
    benchmark: { rmse: 0.24, mae: 0.18, r2: 0.95, confidence: 93, note: "Best overall regional benchmark for the demo model suite." }
  },
  {
    id: "fujairah",
    city: "Fujairah",
    emirate: "Fujairah",
    region: "Eastern coastal resilience zone",
    latitude: 25.1288,
    longitude: 56.3265,
    phase: 1.91,
    spiBase: -0.5,
    ndviBase: 0.37,
    lstBase: 34.1,
    soilBase: 0.31,
    droughtTrend: 0.005,
    forecastBias: 0.08,
    summaryText: "Fujairah continues to show the lowest overall drought severity in the demo system, supported by stronger vegetation and comparatively stable soil moisture conditions.",
    policyNote: "Preserve resilience advantages while using Fujairah as a benchmark for coastal greening and runoff capture strategies.",
    highlights: ["Lowest drought risk", "Strong vegetation signal", "High forecast confidence"],
    recommendations: [
      { title: "Benchmark coastal greening", summary: "Transfer high-performing greening practices to drier Emirates where feasible.", domain: "urban-cooling" },
      { title: "Runoff capture pilots", summary: "Preserve runoff and recharge infrastructure as a resilience multiplier.", domain: "water" }
    ],
    influenceProfile: [
      { feature: "NDVI", weight: 0.32, narrative: "Vegetation strength is the clearest resilience indicator in Fujairah." },
      { feature: "Soil Moisture", weight: 0.3, narrative: "Soil moisture remains relatively stable and boosts forecast confidence." },
      { feature: "LST", weight: 0.16, narrative: "Heat stress is lower than elsewhere but still relevant during peak summer." },
      { feature: "Seasonality", weight: 0.22, narrative: "Seasonal patterns explain most of the remaining variance." }
    ],
    benchmark: { rmse: 0.25, mae: 0.19, r2: 0.95, confidence: 94, note: "Most stable confidence profile across the full archive." }
  }
];

export const createDemoCities = (): CityClimateSeries[] =>
  emirateSeeds.map((seed) => {
    const historicalSeries = buildHistoricalSeries(seed);
    const timeSeries = buildOutlookSeries(seed, historicalSeries);
    const latest = timeSeries[timeSeries.length - 1];

    return {
      id: seed.id,
      city: seed.city,
      emirate: seed.emirate,
      region: seed.region,
      latitude: seed.latitude,
      longitude: seed.longitude,
      riskLevel: latest.riskLevel,
      summaryText: seed.summaryText,
      policyNote: seed.policyNote,
      audioBriefs: {
        en: buildBrief(seed.city, seed.summaryText, "en"),
        ar: buildBrief(seed.city, seed.summaryText, "ar")
      },
      highlights: seed.highlights,
      recommendations: seed.recommendations,
      featureInfluence: buildFeatureInfluence(seed),
      timeSeries,
      historicalSeries,
      derived: buildDerivedMetrics(timeSeries)
    };
  });

export const buildCurrentConditions = (cities: CityClimateSeries[]): CurrentConditionRow[] =>
  [...cities]
    .sort((left, right) => right.derived.riskScore - left.derived.riskScore)
    .map((city) => {
      const latest = city.timeSeries[city.timeSeries.length - 1];

      return {
        emirateId: city.id,
        emirate: city.emirate,
        riskLevel: latest.riskLevel,
        spi: latest.spi ?? null,
        ndvi: latest.ndvi ?? null,
        lst: latest.lst ?? null,
        soilMoisture: latest.soilMoisture ?? null,
        forecastConfidence: latest.forecastAccuracy ?? null,
        rainfallDeficit: latest.rainfallDeficit ?? null
      };
    });

export const buildDashboardAnalytics = (cities: CityClimateSeries[]): DashboardAnalytics => {
  const anomalySignals = cities
    .map((city) => ({
      label: `${city.emirate} anomaly`,
      value: city.derived.anomaly ?? 0,
      change: city.derived.riskScore / 100,
      note: `${city.emirate} is tracking ${city.riskLevel} pressure with rainfall deficit near ${city.derived.rainfallDeficit?.toFixed(0) ?? "N/A"} mm.`
    }))
    .sort((left, right) => right.value - left.value)
    .slice(0, 4);

  const regionalPerformance = cities.map((city, index) => {
    const benchmark = emirateSeeds[index]?.benchmark ?? { rmse: 0.3, mae: 0.23, r2: 0.91, confidence: 89, note: "Stable performance." };
    return {
      emirateId: city.id,
      emirate: city.emirate,
      rmse: benchmark.rmse,
      mae: benchmark.mae,
      r2: benchmark.r2,
      confidence: benchmark.confidence,
      note: benchmark.note
    };
  });

  const spatialForecast = cities.map((city, index) => {
    const latest = city.timeSeries[city.timeSeries.length - 1];
    const benchmark = regionalPerformance[index];
    return {
      id: `${city.id}-cell`,
      emirateId: city.id,
      label: city.emirate,
      latitude: city.latitude,
      longitude: city.longitude,
      predictedSpi: latest.forecast ?? latest.spi ?? 0,
      droughtSeverity: latest.riskLevel,
      confidence: latest.forecastAccuracy ?? benchmark.confidence,
      rmse: benchmark.rmse,
      r2: benchmark.r2,
      anomaly: latest.anomaly ?? 0
    };
  });

  return {
    dateRanges: DATE_RANGE_OPTIONS,
    dataSources: REMOTE_DATA_SOURCES,
    model: {
      name: "Multivariate Spatio-Temporal Transformer (MSTT)",
      paperReference: "Drought forecasting pipeline adapted from the referenced drought transformer paper",
      targetVariable: "Future SPI",
      inputVariables: ["NDVI", "LST", "Soil Moisture"],
      embeddingDimension: 64,
      transformerLayers: 4,
      attentionHeads: 8,
      dropoutRate: 0.2,
      batchSize: 32,
      maxEpochs: 100,
      earlyStoppingPatience: 10,
      optimizer: "Adam",
      learningRate: 1e-4,
      lossFunction: "Mean Squared Error (MSE)",
      scheduler: "Learning rate scheduler with early stopping",
      regularization: ["Dropout", "Early stopping", "Batch normalization"],
      pipeline: [
        {
          title: "Data Collection",
          details: [
            "Collect CHIRPS SPI, MODIS NDVI, MODIS LST, and GLDAS soil moisture",
            "Align all variables over a common UAE grid and monthly cadence"
          ]
        },
        {
          title: "Preprocessing",
          details: [
            "Monthly temporal aggregation",
            "Spatial harmonization to 1 km",
            "Cloud masking and interpolation for missing values",
            "Min-max normalization across variables"
          ]
        },
        {
          title: "Model Architecture",
          details: [
            "Linear input embedding with positional encoding",
            "Spatial transformer with multi-head self-attention",
            "Temporal transformer for seasonal and long-range dependencies",
            "Multi-head fusion and SPI prediction head"
          ]
        },
        {
          title: "Training and Evaluation",
          details: [
            "Adam optimization with scheduler",
            "MSE loss, dropout, batch normalization, early stopping",
            "RMSE, MAE, and R² against LSTM and GRU baselines"
          ]
        }
      ],
      evaluationMetrics: ["RMSE", "MAE", "R²", "Residual maps", "Regional performance comparison"]
    },
    modelBenchmarks: [
      {
        modelName: "MSTT",
        rmse: 0.28,
        mae: 0.21,
        r2: 0.93,
        note: "Best overall skill after spatial-temporal fusion across the UAE."
      },
      {
        modelName: "LSTM",
        rmse: 0.39,
        mae: 0.3,
        r2: 0.87,
        note: "Captures temporal structure but underperforms on spatial variability."
      },
      {
        modelName: "GRU",
        rmse: 0.42,
        mae: 0.32,
        r2: 0.84,
        note: "Lean baseline with lower cost but weaker regional skill."
      }
    ],
    regionalPerformance,
    spatialForecast,
    anomalySignals,
    recommendations: [
      "Use forecast confidence and residual maps together before escalating alerts.",
      "Treat soil moisture decline as the earliest indicator of persistent SPI deterioration.",
      "Prioritize Sharjah, Ajman, and inland Dubai corridors for near-term mitigation action."
    ]
  };
};

const createSeedMessagesFromCities = (cities: CityClimateSeries[]): ChatMessage[] => {
  const highestRisk = [...cities].sort((left, right) => right.derived.riskScore - left.derived.riskScore)[0];
  const bestBenchmark = [...cities].sort((left, right) => left.derived.riskScore - right.derived.riskScore)[0];

  if (!highestRisk || !bestBenchmark) {
    return [];
  }

  const benchmarkR2 = buildDashboardAnalytics(cities).regionalPerformance.find(
    (entry) => entry.emirateId === bestBenchmark.id
  )?.r2;

  return [
    {
      id: "seed-forecast-1",
      role: "assistant",
      language: "en",
      timestamp: new Date().toISOString(),
      title: `${highestRisk.emirate} MSTT Forecast Brief`,
      content: `${highestRisk.emirate} carries the highest modeled drought pressure in the current outlook. The MSTT model is weighting soil moisture, NDVI, and surface heat together to project a stressed SPI regime, so the operating priority is fast mitigation with strong alerting discipline.`,
      chips: [
        `Forecast SPI ${highestRisk.derived.currentForecast?.toFixed(1) ?? "N/A"}`,
        `Confidence ${highestRisk.derived.currentForecastAccuracy?.toFixed(0) ?? "N/A"}%`,
        `Risk ${highestRisk.riskLevel}`
      ],
      actions: [
        { type: "download-pdf", label: "Download PDF", language: "en" },
        { type: "audio-brief", label: "Audio Brief (AR)", language: "ar" }
      ]
    },
    {
      id: "seed-forecast-2",
      role: "assistant",
      language: "en",
      timestamp: new Date().toISOString(),
      title: `${bestBenchmark.emirate} Benchmark Signal`,
      content: `${bestBenchmark.emirate} remains the most resilient benchmark in the demo system. Use it as a comparator when explaining how vegetation health, soil moisture, and thermal load reshape drought risk across the rest of the UAE.`,
      chips: [`R² ${benchmarkR2?.toFixed(2) ?? "N/A"}`]
    }
  ];
};

export const buildDemoBrief = (city: CityClimateSeries, language: Language): AudioBrief => ({
  language,
  generatedAt: new Date().toISOString(),
  text: city.audioBriefs[language],
  waveform: DEMO_AUDIO_WAVEFORM,
  voiceHint: language === "ar" ? "ar-AE" : "en-AE"
});

export const createDemoMessages = (): ChatMessage[] => createSeedMessagesFromCities(createDemoCities());

interface SnapshotOptions {
  mode: DataMode;
  sourceType: DataSourceType;
  datasetLabel: string;
  sourceLabel: string;
  profile: DatasetProfile;
  selectedCityId?: string;
  warnings?: NormalizationWarning[];
}

export const createSnapshotFromCities = (
  cities: CityClimateSeries[],
  options: SnapshotOptions
): DashboardSnapshot => ({
  mode: options.mode,
  sourceType: options.sourceType,
  datasetLabel: options.datasetLabel,
  sourceLabel: options.sourceLabel,
  generatedAt: new Date().toISOString(),
  lastUpdated: DEFAULT_TIMELINE[DEFAULT_TIMELINE.length - 1],
  selectedCityId: options.selectedCityId ?? cities[0]?.id ?? "abu-dhabi",
  timeline: DEFAULT_TIMELINE,
  cities,
  currentConditions: buildCurrentConditions(cities),
  availableMetrics: AVAILABLE_METRICS,
  sampleQuestions: SAMPLE_QUESTIONS,
  seedMessages: createSeedMessagesFromCities(cities),
  audioWaveform: DEMO_AUDIO_WAVEFORM,
  profile: options.profile,
  analytics: buildDashboardAnalytics(cities),
  warnings: options.warnings ?? []
});

export const createDemoSnapshot = (
  mode: DataMode = "demo",
  sourceType: DataSourceType = "demo",
  datasetLabel = "EcoVision UAE 2026 Remote Sensing Demo"
): DashboardSnapshot => {
  const cities = createDemoCities();
  const profile: DatasetProfile = {
    datasetName: datasetLabel,
    sourceType,
    recordCount: cities.reduce((sum, city) => sum + city.historicalSeries.length, 0),
    cityCount: cities.length,
    fields: [
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
    ],
    mappedFields: {
      city: "city",
      latitude: "latitude",
      longitude: "longitude",
      timestamp: "timestamp",
      spi: "spi",
      ndvi: "ndvi",
      lst: "lst",
      soil_moisture: "soil_moisture",
      forecast: "forecast",
      forecast_accuracy: "forecast_accuracy",
      risk_level: "risk_level",
      policy_note: "policy_note",
      summary_text: "summary_text"
    },
    missingFields: [],
    completenessScore: 1,
    temporalScale: "Monthly",
    spatialResolution: "1 km harmonized grid",
    harmonizedResolution: "1 km"
  };

  return createSnapshotFromCities(cities, {
    mode,
    sourceType,
    datasetLabel,
    sourceLabel:
      mode === "demo"
        ? "Remote sensing demo snapshot with CHIRPS, MODIS, GLDAS, and MSTT metadata"
        : "Imported climate resilience dataset",
    profile,
    selectedCityId: "sharjah"
  });
};

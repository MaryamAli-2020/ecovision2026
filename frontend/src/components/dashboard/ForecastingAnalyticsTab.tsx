import type { DashboardSnapshot, DateRangeKey, SeverityFilter } from "@ecovision/shared";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Activity, BarChart3, BrainCircuit, Waves } from "lucide-react";

import { ForecastChartPanel } from "@/components/dashboard/ForecastChartPanel";
import { ExpandablePanel } from "@/components/ui/ExpandablePanel";
import { GlassPanel } from "@/components/ui/GlassPanel";
import {
  buildForecastDriverSeries,
  buildHistoricalTrendSeries,
  buildModelComparisonData,
  buildRegionalPerformanceData,
  buildSeasonalPattern,
  getSelectedCity
} from "@/lib/dashboard";
import { cn, formatPercent } from "@/lib/utils";

interface ForecastingAnalyticsTabProps {
  snapshot: DashboardSnapshot;
  selectedCityId: string;
  timelineIndex: number;
  selectedDateRange: DateRangeKey;
  severityFilter: SeverityFilter;
}

const chartColors = ["#22d3ee", "#fb7185", "#34d399", "#f59e0b"];
const modelContributionData: Array<{ feature: string; value: number; color: string }> = [
  { feature: "Soil Moisture", value: 35, color: "#22d3ee" },
  { feature: "NDVI", value: 25, color: "#34d399" },
  { feature: "LST", value: 22, color: "#f59e0b" },
  { feature: "Seasonality", value: 18, color: "#818cf8" }
];

const SeasonalMatrix = ({
  values
}: {
  values: ReturnType<typeof buildSeasonalPattern>;
}) => (
  <div className="grid grid-cols-3 gap-2 md:grid-cols-4 xl:grid-cols-6">
    {values.map((entry) => {
      const riskTone =
        entry.spi < -1
          ? "border-rose-400/25 bg-rose-500/10"
          : entry.spi < -0.5
            ? "border-orange-400/20 bg-orange-500/8"
            : "border-emerald-400/20 bg-emerald-500/8";

      return (
        <div key={entry.month} className={cn("rounded-[18px] border p-2.5", riskTone)}>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{entry.month}</p>
          <p className="mt-1.5 text-sm text-white">SPI {entry.spi.toFixed(2)}</p>
          <p className="mt-1 text-xs text-slate-300">NDVI {entry.ndvi.toFixed(2)}</p>
          <p className="mt-1 text-xs text-slate-300">LST {entry.lst.toFixed(1)} C</p>
          <p className="mt-1 text-xs text-slate-300">Soil {entry.soilMoisture.toFixed(2)}</p>
        </div>
      );
    })}
  </div>
);

const SpatialForecastHeatmap = ({
  snapshot,
  severityFilter
}: {
  snapshot: DashboardSnapshot;
  severityFilter: SeverityFilter;
}) => {
  const visibleCells = snapshot.analytics.spatialForecast.filter((cell) => {
    if (severityFilter === "all") {
      return true;
    }

    const priorities = { low: 0, moderate: 1, high: 2, critical: 3 } as const;
    return priorities[cell.droughtSeverity] >= priorities[severityFilter];
  });

  const layout = [
    { id: "ras-al-khaimah", left: "56%", top: "7%" },
    { id: "umm-al-quwain", left: "47%", top: "24%" },
    { id: "ajman", left: "39%", top: "31%" },
    { id: "sharjah", left: "49%", top: "38%" },
    { id: "dubai", left: "31%", top: "46%" },
    { id: "abu-dhabi", left: "10%", top: "62%" },
    { id: "fujairah", left: "67%", top: "48%" }
  ];

  return (
    <div className="relative min-h-[400px] overflow-hidden rounded-[22px] border border-white/8 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_35%),linear-gradient(180deg,rgba(15,23,42,0.9),rgba(2,6,23,0.85))]">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.06)_1px,transparent_1px)] bg-[size:48px_48px]" />
      {layout.map((position) => {
        const cell = visibleCells.find((entry) => entry.emirateId === position.id);

        if (!cell) {
          return null;
        }

        const tone =
          cell.droughtSeverity === "critical"
            ? "border-rose-400/30 bg-rose-500/12"
            : cell.droughtSeverity === "high"
              ? "border-orange-400/25 bg-orange-500/10"
              : cell.droughtSeverity === "moderate"
                ? "border-amber-400/20 bg-amber-500/8"
                : "border-emerald-400/20 bg-emerald-500/8";

        return (
          <div
            key={cell.id}
            className={cn("absolute w-[156px] rounded-[18px] border p-3 shadow-glow backdrop-blur-xl", tone)}
            style={{ left: position.left, top: position.top }}
          >
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{cell.label}</p>
            <p className="mt-1.5 font-display text-lg text-white">{cell.predictedSpi.toFixed(2)} SPI</p>
            <div className="mt-2 grid gap-1 text-xs text-slate-200">
              <p>Confidence {cell.confidence.toFixed(0)}%</p>
              <p>RMSE {cell.rmse.toFixed(2)}</p>
              <p>R2 {cell.r2.toFixed(2)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const ForecastingAnalyticsTab = ({
  snapshot,
  selectedCityId,
  timelineIndex,
  selectedDateRange,
  severityFilter
}: ForecastingAnalyticsTabProps) => {
  const selectedCity = getSelectedCity(snapshot, selectedCityId);
  const trendData = buildHistoricalTrendSeries(selectedCity, snapshot, selectedDateRange);
  const seasonalData = buildSeasonalPattern(selectedCity, snapshot, selectedDateRange);
  const drivers = buildForecastDriverSeries(selectedCity);
  const modelComparison = buildModelComparisonData(snapshot);
  const regionalPerformance = buildRegionalPerformanceData(snapshot, severityFilter);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 xl:grid-cols-4">
        {snapshot.analytics.anomalySignals.map((signal) => (
          <div key={signal.label} className="rounded-[20px] border border-white/8 bg-white/5 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{signal.label}</p>
            <p className="mt-2 font-display text-2xl text-white">{signal.value.toFixed(2)}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-8">
          <ForecastChartPanel
            snapshot={snapshot}
            selectedCityId={selectedCityId}
            timelineIndex={timelineIndex}
          />
        </div>

        <GlassPanel
          className="xl:col-span-4"
          title="Model Insight"
          subtitle="Static MSTT feature contribution weights"
          rightSlot={<BrainCircuit className="h-4 w-4 text-cyan-200" />}
        >
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={modelContributionData}
                layout="vertical"
                margin={{ top: 6, right: 18, left: 12, bottom: 6 }}
              >
                <CartesianGrid stroke="rgba(148,163,184,0.12)" horizontal={false} />
                <XAxis type="number" hide domain={[0, 40]} />
                <YAxis
                  type="category"
                  dataKey="feature"
                  width={90}
                  tick={{ fill: "#cbd5e1", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value) => [`${value}%`, "Contribution"]}
                  contentStyle={{
                    background: "rgba(15,23,42,0.96)",
                    border: "1px solid rgba(148,163,184,0.18)",
                    borderRadius: 18,
                    color: "#e2e8f0"
                  }}
                />
                <Bar
                  dataKey="value"
                  radius={[10, 10, 10, 10]}
                  label={{ position: "right", fill: "#e2e8f0", formatter: (value: number) => `${value}%` }}
                >
                  {modelContributionData.map((entry) => (
                    <Cell key={entry.feature} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>
      </div>

      <ExpandablePanel
        title="Signal Details"
        summary="Drivers, archive, seasonality"
        badge={<Waves className="h-4 w-4 text-cyan-200" />}
      >
        <div className="grid gap-4 xl:grid-cols-3">
          <GlassPanel
            title="Driver Forecast Signals"
            rightSlot={<Waves className="h-4 w-4 text-cyan-200" />}
          >
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={drivers} margin={{ top: 6, right: 0, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15,23,42,0.96)",
                      border: "1px solid rgba(148,163,184,0.18)",
                      borderRadius: 18,
                      color: "#e2e8f0"
                    }}
                  />
                  <Line type="monotone" dataKey="ndvi" stroke={chartColors[2]} strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="lst" stroke={chartColors[3]} strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="soilMoisture" stroke={chartColors[0]} strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassPanel>

          <GlassPanel
            title={`Monthly SPI Archive - ${selectedCity.emirate}`}
            rightSlot={<Activity className="h-4 w-4 text-cyan-200" />}
          >
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 6, right: 0, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(value) => new Date(value).getFullYear().toString()}
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={24}
                  />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    labelFormatter={(value) =>
                      new Date(String(value)).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                    }
                    contentStyle={{
                      background: "rgba(15,23,42,0.96)",
                      border: "1px solid rgba(148,163,184,0.18)",
                      borderRadius: 18,
                      color: "#e2e8f0"
                    }}
                  />
                  <Line type="monotone" dataKey="spi" stroke={chartColors[1]} strokeWidth={2.7} dot={false} />
                  <Line type="monotone" dataKey="predictedSpi" stroke={chartColors[0]} strokeWidth={2.5} dot={false} strokeDasharray="6 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassPanel>

          <GlassPanel title="Seasonal Pattern Matrix">
            <SeasonalMatrix values={seasonalData} />
          </GlassPanel>
        </div>
      </ExpandablePanel>

      <ExpandablePanel
        title="Regional Validation"
        summary="Heatmap, model compare, performance"
        badge={<BarChart3 className="h-4 w-4 text-cyan-200" />}
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_360px]">
          <GlassPanel
            title="Forecasted Drought Severity Map"
            rightSlot={<BarChart3 className="h-4 w-4 text-cyan-200" />}
          >
            <SpatialForecastHeatmap snapshot={snapshot} severityFilter={severityFilter} />
          </GlassPanel>

          <div className="space-y-4 xl:grid xl:h-full xl:min-h-0 xl:grid-rows-[minmax(260px,0.8fr)_minmax(0,1fr)] xl:gap-4 xl:space-y-0">
            <GlassPanel title="Compare Models" className="h-full" contentClassName="h-full p-3.5">
              <div className="h-full min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={modelComparison} margin={{ top: 8, right: 0, left: -18, bottom: 0 }}>
                    <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                    <XAxis dataKey="model" tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(15,23,42,0.96)",
                        border: "1px solid rgba(148,163,184,0.18)",
                        borderRadius: 18,
                        color: "#e2e8f0"
                      }}
                    />
                    <Bar dataKey="rmse" radius={[8, 8, 0, 0]}>
                      {modelComparison.map((entry, index) => (
                        <Cell key={entry.model} fill={chartColors[index] ?? "#22d3ee"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassPanel>

            <GlassPanel title="Regional Performance" className="h-full" contentClassName="h-full p-3.5">
              <div className="space-y-2.5 xl:h-full xl:overflow-y-auto xl:pr-1">
                {regionalPerformance.map((entry) => (
                  <div key={entry.emirateId} className="rounded-[20px] border border-white/8 bg-white/5 p-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-display text-base text-white">{entry.emirate}</p>
                      <span className="text-xs text-slate-400">{formatPercent(entry.confidence)}</span>
                    </div>
                    <div className="mt-2.5 grid gap-2 text-sm text-slate-300 sm:grid-cols-3">
                      <p>RMSE {entry.rmse.toFixed(2)}</p>
                      <p>MAE {entry.mae.toFixed(2)}</p>
                      <p>R2 {entry.r2.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </div>
        </div>
      </ExpandablePanel>
    </div>
  );
};

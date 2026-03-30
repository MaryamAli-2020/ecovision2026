import type {
  ClimateMetric,
  DashboardSnapshot,
  DateRangeKey,
  SeverityFilter
} from "@ecovision/shared";
import { Filter, Globe2, MapPinned, ThermometerSun } from "lucide-react";

import { GlassPanel } from "@/components/ui/GlassPanel";

interface GlobalFiltersBarProps {
  snapshot: DashboardSnapshot;
  activeMetric: ClimateMetric;
  selectedCityId: string;
  selectedDateRange: DateRangeKey;
  severityFilter: SeverityFilter;
  onMetricChange: (metric: ClimateMetric) => void;
  onCityChange: (cityId: string) => void;
  onDateRangeChange: (range: DateRangeKey) => void;
  onSeverityChange: (filter: SeverityFilter) => void;
}

const metricOptions: Array<{ value: ClimateMetric; label: string }> = [
  { value: "drought", label: "SPI Drought" },
  { value: "heat", label: "LST Heat" },
  { value: "ndvi", label: "NDVI" },
  { value: "soil_moisture", label: "Soil Moisture" },
  { value: "satellite", label: "Satellite Context" }
];

const severityOptions: Array<{ value: SeverityFilter; label: string }> = [
  { value: "all", label: "All severity" },
  { value: "moderate", label: "Moderate+" },
  { value: "high", label: "High+" },
  { value: "critical", label: "Critical only" }
];

export const GlobalFiltersBar = ({
  snapshot,
  activeMetric,
  selectedCityId,
  selectedDateRange,
  severityFilter,
  onMetricChange,
  onCityChange,
  onDateRangeChange,
  onSeverityChange
}: GlobalFiltersBarProps) => (
  <GlassPanel
    className="overflow-hidden"
    title="Global Climate Filters"
    subtitle="Selections remain synchronized across overview, forecasting, AI, and alert workflows."
    rightSlot={
      <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-cyan-100">
        <Globe2 className="h-3.5 w-3.5" />
        {snapshot.analytics.dataSources.length} live-ready sources
      </div>
    }
    contentClassName="space-y-4"
  >
    <div className="grid gap-4 xl:grid-cols-4">
      <label className="space-y-2">
        <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
          <MapPinned className="h-3.5 w-3.5" />
          Emirate
        </span>
        <select
          value={selectedCityId}
          onChange={(event) => onCityChange(event.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
        >
          {snapshot.cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.emirate}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-2">
        <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
          <Filter className="h-3.5 w-3.5" />
          Date Range
        </span>
        <select
          value={selectedDateRange}
          onChange={(event) => onDateRangeChange(event.target.value as DateRangeKey)}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
        >
          {snapshot.analytics.dateRanges.map((range) => (
            <option key={range.id} value={range.id}>
              {range.label}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-2">
        <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
          <ThermometerSun className="h-3.5 w-3.5" />
          Severity
        </span>
        <select
          value={severityFilter}
          onChange={(event) => onSeverityChange(event.target.value as SeverityFilter)}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
        >
          {severityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-2">
        <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">
          <Filter className="h-3.5 w-3.5" />
          Indicator
        </span>
        <select
          value={activeMetric}
          onChange={(event) => onMetricChange(event.target.value as ClimateMetric)}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
        >
          {metricOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>

    <div className="grid gap-3 xl:grid-cols-3">
      <div className="rounded-[24px] border border-white/8 bg-white/5 px-4 py-3 text-sm text-slate-300">
        Harmonized grid: <span className="text-white">{snapshot.profile.harmonizedResolution}</span>
      </div>
      <div className="rounded-[24px] border border-white/8 bg-white/5 px-4 py-3 text-sm text-slate-300">
        Temporal scale: <span className="text-white">{snapshot.profile.temporalScale}</span>
      </div>
      <div className="rounded-[24px] border border-white/8 bg-white/5 px-4 py-3 text-sm text-slate-300">
        Forecast engine: <span className="text-white">{snapshot.analytics.model.name}</span>
      </div>
    </div>
  </GlassPanel>
);

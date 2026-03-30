import type {
  ClimateMetric,
  DashboardSnapshot,
  DateRangeKey,
  SeverityFilter
} from "@ecovision/shared";
import type { ReactNode } from "react";
import { Filter, Globe2, MapPinned, ThermometerSun } from "lucide-react";

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

const CompactSelect = ({
  icon,
  label,
  value,
  onChange,
  children
}: {
  icon: ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) => (
  <label className="flex min-w-[165px] flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 lg:min-w-[180px]">
    <span className="shrink-0 text-slate-500">{icon}</span>
    <div className="min-w-0 flex-1">
      <span className="block text-[10px] uppercase tracking-[0.22em] text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-0.5 w-full truncate bg-transparent text-sm font-medium text-white outline-none"
      >
        {children}
      </select>
    </div>
  </label>
);

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
  <section className="rounded-[22px] border border-white/10 bg-slate-950/60 px-3 py-3 shadow-glow backdrop-blur-xl">
    <div className="flex flex-wrap gap-2.5 xl:flex-nowrap xl:items-center">
      <CompactSelect
        icon={<MapPinned className="h-4 w-4" />}
        label="Emirate"
        value={selectedCityId}
        onChange={onCityChange}
      >
        {snapshot.cities.map((city) => (
          <option key={city.id} value={city.id}>
            {city.emirate}
          </option>
        ))}
      </CompactSelect>

      <CompactSelect
        icon={<Filter className="h-4 w-4" />}
        label="Date Range"
        value={selectedDateRange}
        onChange={(value) => onDateRangeChange(value as DateRangeKey)}
      >
        {snapshot.analytics.dateRanges.map((range) => (
          <option key={range.id} value={range.id}>
            {range.label}
          </option>
        ))}
      </CompactSelect>

      <CompactSelect
        icon={<ThermometerSun className="h-4 w-4" />}
        label="Severity"
        value={severityFilter}
        onChange={(value) => onSeverityChange(value as SeverityFilter)}
      >
        {severityOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </CompactSelect>

      <CompactSelect
        icon={<Filter className="h-4 w-4" />}
        label="Indicator"
        value={activeMetric}
        onChange={(value) => onMetricChange(value as ClimateMetric)}
      >
        {metricOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </CompactSelect>

      <div className="flex flex-wrap items-center gap-2 xl:ml-auto xl:shrink-0">
        <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5 text-[11px] text-cyan-100">
          {snapshot.analytics.model.name}
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-slate-300">
          <Globe2 className="h-3.5 w-3.5 text-cyan-200" />
          {snapshot.analytics.dataSources.length} sources
        </span>
      </div>
    </div>
  </section>
);

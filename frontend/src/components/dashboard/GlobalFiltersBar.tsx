import type {
  ClimateMetric,
  DashboardSnapshot,
  DateRangeKey,
  SeverityFilter
} from "@ecovision/shared";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, Filter, Globe2, MapPinned, ThermometerSun } from "lucide-react";

import { cn } from "@/lib/utils";

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

interface CompactOption {
  value: string;
  label: string;
}

const CompactSelect = ({
  icon,
  label,
  value,
  onChange,
  options
}: {
  icon: ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: CompactOption[];
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative z-20 flex min-w-[165px] flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 lg:min-w-[180px]">
      <span className="shrink-0 text-slate-500">{icon}</span>
      <div className="min-w-0 flex-1">
        <span className="block text-[10px] uppercase tracking-[0.22em] text-slate-500">{label}</span>
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          aria-expanded={isOpen}
          className="mt-0.5 flex w-full items-center justify-between gap-2 text-left"
        >
          <span className="truncate text-sm font-medium text-white">{selectedOption?.label ?? value}</span>
          <ChevronDown className={cn("h-4 w-4 shrink-0 text-slate-400 transition-transform", isOpen && "rotate-180")} />
        </button>
      </div>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-[18px] border border-white/10 bg-slate-950/95 p-1.5 shadow-glow backdrop-blur-xl">
          <div className="space-y-1">
            {options.map((option) => {
              const isSelected = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2 text-left text-sm transition",
                    isSelected ? "bg-cyan-400/15 text-cyan-100" : "text-slate-200 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected ? <Check className="h-4 w-4 shrink-0 text-cyan-200" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};

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
}: GlobalFiltersBarProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const isExpanded = isHovered || isPinned;
  const selectedCity = snapshot.cities.find((city) => city.id === selectedCityId) ?? snapshot.cities[0];
  const selectedRange = snapshot.analytics.dateRanges.find((range) => range.id === selectedDateRange);
  const selectedSeverity = severityOptions.find((option) => option.value === severityFilter);
  const selectedMetric = metricOptions.find((option) => option.value === activeMetric);

  return (
    <section
      className="rounded-[22px] border border-white/10 bg-slate-950/60 shadow-glow backdrop-blur-xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-3 px-3 py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300">
            <Filter className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Global Filters</p>
            <div className="mt-1 flex min-w-0 flex-wrap gap-1.5">
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-200">
                {selectedCity?.emirate ?? "UAE"}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-200">
                {selectedRange?.label ?? selectedDateRange}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-200">
                {selectedSeverity?.label ?? severityFilter}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-200">
                {selectedMetric?.label ?? activeMetric}
              </span>
            </div>
          </div>
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5 text-[11px] text-cyan-100">
            {snapshot.analytics.model.name}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-slate-300">
            <Globe2 className="h-3.5 w-3.5 text-cyan-200" />
            {snapshot.analytics.dataSources.length} sources
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsPinned((value) => !value)}
          aria-expanded={isExpanded}
          aria-label="Toggle filters"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg font-semibold text-slate-200 transition hover:border-cyan-400/30 hover:text-white"
        >
          v
        </button>
      </div>

      <div
        className={cn(
          "grid transition-all duration-300 ease-out",
          isExpanded ? "grid-rows-[1fr] border-t border-white/6" : "grid-rows-[0fr]"
        )}
      >
        <div className={cn("overflow-hidden", !isExpanded && "pointer-events-none")}>
          <div className="flex flex-wrap gap-2.5 px-3 py-3 xl:flex-nowrap xl:items-center">
            <CompactSelect
              icon={<MapPinned className="h-4 w-4" />}
              label="Emirate"
              value={selectedCityId}
              onChange={onCityChange}
              options={snapshot.cities.map((city) => ({
                value: city.id,
                label: city.emirate
              }))}
            />

            <CompactSelect
              icon={<Filter className="h-4 w-4" />}
              label="Date Range"
              value={selectedDateRange}
              onChange={(value) => onDateRangeChange(value as DateRangeKey)}
              options={snapshot.analytics.dateRanges.map((range) => ({
                value: range.id,
                label: range.label
              }))}
            />

            <CompactSelect
              icon={<ThermometerSun className="h-4 w-4" />}
              label="Severity"
              value={severityFilter}
              onChange={(value) => onSeverityChange(value as SeverityFilter)}
              options={severityOptions}
            />

            <CompactSelect
              icon={<Filter className="h-4 w-4" />}
              label="Indicator"
              value={activeMetric}
              onChange={(value) => onMetricChange(value as ClimateMetric)}
              options={metricOptions}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

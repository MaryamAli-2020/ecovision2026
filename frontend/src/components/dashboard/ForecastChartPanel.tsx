import type { DashboardSnapshot } from "@ecovision/shared";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { GlassPanel } from "@/components/ui/GlassPanel";
import { buildForecastSeries } from "@/lib/dashboard";

interface ForecastChartPanelProps {
  snapshot: DashboardSnapshot;
  selectedCityId: string;
  timelineIndex: number;
}

export const ForecastChartPanel = ({
  snapshot,
  selectedCityId,
  timelineIndex
}: ForecastChartPanelProps) => {
  const city = snapshot.cities.find((entry) => entry.id === selectedCityId) ?? snapshot.cities[0];
  const data = buildForecastSeries(city, timelineIndex);
  const dividerLabel = data[timelineIndex]?.label ?? data[data.length - 1]?.label;
  const horizonLabel = data[data.length - 1]?.label;

  return (
    <GlassPanel title={`SPI Forecast - ${city.emirate} (MSTT)`}>
      <div className="mb-3 flex flex-wrap gap-2">
        <span className="rounded-full border border-rose-400/20 bg-rose-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-100">
          Actual observed
        </span>
        <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100">
          Model fit
        </span>
        <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-100">
          Future forecast
        </span>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
          Confidence interval
        </span>
      </div>

      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 0, left: -18, bottom: 0 }}>
            <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip
              formatter={(value, name) => {
                if (value === null || value === undefined) {
                  return ["N/A", name];
                }

                const labelMap: Record<string, string> = {
                  actualObserved: "Actual observed",
                  forecastObserved: "Model fit",
                  futureForecast: "Future forecast",
                  lowerBound: "Lower bound",
                  upperBound: "Upper bound"
                };

                const numericValue = typeof value === "number" ? value : Number(value);
                return [Number.isFinite(numericValue) ? numericValue.toFixed(2) : String(value), labelMap[name] ?? name];
              }}
              contentStyle={{
                background: "rgba(15,23,42,0.96)",
                border: "1px solid rgba(148,163,184,0.18)",
                borderRadius: 18,
                color: "#e2e8f0"
              }}
            />
            {dividerLabel && horizonLabel ? (
              <ReferenceArea x1={dividerLabel} x2={horizonLabel} fill="rgba(45,212,191,0.08)" fillOpacity={1} />
            ) : null}
            <ReferenceLine
              x={dividerLabel}
              stroke="rgba(34,211,238,0.6)"
              strokeDasharray="3 6"
              label={{ value: "Today", fill: "#67e8f9", fontSize: 11, position: "top" }}
            />
            <Line
              type="monotone"
              dataKey="lowerBound"
              stroke="rgba(226,232,240,0.45)"
              strokeWidth={1.5}
              dot={false}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="upperBound"
              stroke="rgba(226,232,240,0.45)"
              strokeWidth={1.5}
              dot={false}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="actualObserved"
              stroke="#fb7185"
              strokeWidth={3}
              dot={{ fill: "#fb7185", r: 3 }}
              activeDot={{ r: 5 }}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="forecastObserved"
              stroke="#22d3ee"
              strokeWidth={3}
              strokeDasharray="6 6"
              dot={{ fill: "#22d3ee", r: 3 }}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="futureForecast"
              stroke="#34d399"
              strokeWidth={3.5}
              dot={{ fill: "#34d399", r: 3.5 }}
              activeDot={{ r: 5 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </GlassPanel>
  );
};

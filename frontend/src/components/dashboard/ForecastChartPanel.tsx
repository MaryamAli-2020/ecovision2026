import type { DashboardSnapshot } from "@ecovision/shared";
import {
  CartesianGrid,
  Line,
  LineChart,
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
  const data = buildForecastSeries(city);
  const dividerLabel = data[timelineIndex]?.label ?? data[data.length - 1]?.label;

  return (
    <GlassPanel title={`SPI Forecast - ${city.city} (MSTT Model)`} subtitle="Actual vs projected drought signal">
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 0, left: -18, bottom: 0 }}>
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
            <ReferenceLine
              x={dividerLabel}
              stroke="rgba(34,211,238,0.6)"
              strokeDasharray="3 6"
              label={{ value: "Today", fill: "#67e8f9", fontSize: 11, position: "top" }}
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#fb7185"
              strokeWidth={3}
              dot={{ fill: "#fb7185", r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#2dd4bf"
              strokeWidth={3}
              strokeDasharray="6 6"
              dot={{ fill: "#2dd4bf", r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </GlassPanel>
  );
};

import type { DashboardSnapshot } from "@ecovision/shared";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { buildKpiCards, getTimelinePoint } from "@/lib/dashboard";
import { cn, formatNumber } from "@/lib/utils";

interface KpiGridProps {
  snapshot: DashboardSnapshot;
  selectedCityId: string;
  timelineIndex: number;
}

export const KpiGrid = ({ snapshot, selectedCityId, timelineIndex }: KpiGridProps) => {
  const city = snapshot.cities.find((entry) => entry.id === selectedCityId) ?? snapshot.cities[0];
  const point = getTimelinePoint(city, timelineIndex);
  const previous = city.timeSeries[Math.max(0, timelineIndex - 1)] ?? point;
  const cards = buildKpiCards(snapshot, city, timelineIndex);
  const delta = (point.spi ?? 0) - (previous.spi ?? 0);

  return (
    <div className="mx-auto grid w-full max-w-[360px] auto-rows-fr gap-2.5 sm:grid-cols-2 xl:max-w-none">
      {cards.map((card, index) => {
        const Icon =
          index === 0 ? delta > 0 ? ArrowUpRight : delta < 0 ? ArrowDownRight : Minus : card.accent === "amber" ? ArrowUpRight : ArrowDownRight;
        const displayTitle =
          card.title === "NDVI Condition"
            ? "NDVI"
            : card.title === "Land Surface Temp"
              ? "LST"
              : card.title;

        return (
          <div
            key={card.title}
            className={cn(
              "flex min-h-[122px] flex-col justify-between rounded-[22px] border p-3 shadow-glow",
              card.accent === "rose" && "border-rose-400/20 bg-rose-500/8",
              card.accent === "amber" && "border-amber-400/20 bg-amber-500/8 shadow-ember",
              card.accent === "teal" && "border-teal-400/20 bg-teal-500/8",
              card.accent === "emerald" && "border-emerald-400/20 bg-emerald-500/8"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="min-h-[2.1rem] text-[11px] uppercase tracking-[0.2em] text-slate-400">{displayTitle}</p>
                <p className={cn("font-display text-[1.45rem] leading-none text-white", index === 0 ? "mt-[1.15rem]" : "mt-3")}>
                  {formatNumber(card.value, card.unit === "%" ? 0 : card.unit === "" ? 2 : 1)}
                  <span className="ml-1 text-sm font-medium text-slate-300">{card.unit}</span>
                </p>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 p-1.5">
                {Icon ? <Icon className="h-3.5 w-3.5 text-white" /> : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

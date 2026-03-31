import type { DashboardSnapshot, SeverityFilter } from "@ecovision/shared";
import { BellRing, MailCheck, ShieldAlert, Siren, TriangleAlert } from "lucide-react";

import { DecisionAlertsPanel } from "@/components/dashboard/DecisionAlertsPanel";
import { EmirateCarousel } from "@/components/dashboard/EmirateCarousel";
import { ExpandablePanel } from "@/components/ui/ExpandablePanel";
import { calculatePointRiskScore, getTimelinePoint, isRiskVisible } from "@/lib/dashboard";
import { formatPercent, riskBadgeClasses } from "@/lib/utils";

interface AlertsDecisionTabProps {
  snapshot: DashboardSnapshot;
  timelineIndex: number;
  severityFilter: SeverityFilter;
  selectedCityId: string;
  onCitySelect: (cityId: string) => void;
}

export const AlertsDecisionTab = ({
  snapshot,
  timelineIndex,
  severityFilter,
  selectedCityId,
  onCitySelect
}: AlertsDecisionTabProps) => {
  const activeCount = snapshot.cities.filter((city) =>
    isRiskVisible(getTimelinePoint(city, timelineIndex).riskLevel, severityFilter)
  ).length;

  return (
    <div className="grid gap-4 xl:h-full xl:min-h-0 xl:grid-cols-[minmax(0,0.98fr)_450px] 2xl:grid-cols-[minmax(0,0.96fr)_490px]">
      <DecisionAlertsPanel snapshot={snapshot} timelineIndex={timelineIndex} severityFilter={severityFilter} />

      <div className="space-y-4 xl:grid xl:h-full xl:min-h-0 xl:grid-rows-[minmax(0,1fr)_auto] xl:overflow-hidden xl:pr-1">
        <EmirateCarousel
          title="Risk Scoring by Emirate"
          items={snapshot.cities}
          activeId={selectedCityId}
          onSelect={onCitySelect}
          badge={
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-400/20 bg-rose-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-rose-100">
              <Siren className="h-3.5 w-3.5" />
              {activeCount}
            </div>
          }
          slideClassName="h-full"
          renderSlide={(city) => {
            const point = getTimelinePoint(city, timelineIndex);

            return (
              <article className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-y-auto overflow-x-hidden rounded-[22px] border border-white/8 bg-white/5 p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-[1.75rem] leading-none text-white">{city.emirate}</p>
                    <p className="mt-1 text-[13px] text-slate-400">{city.region}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ring-1 ${riskBadgeClasses[point.riskLevel]}`}>
                    {point.riskLevel}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2.5">
                  <div className="min-w-0 rounded-[18px] border border-white/8 bg-slate-950/45 p-3">
                    <div className="flex items-center gap-2 text-slate-400">
                      <TriangleAlert className="h-4 w-4" />
                      <span className="text-[11px] uppercase tracking-[0.18em]">Risk score</span>
                    </div>
                    <p className="mt-2 font-display text-[1.75rem] leading-none text-white">
                      {Math.round(calculatePointRiskScore(point))}
                    </p>
                    <p className="mt-1 text-[13px] text-slate-300">Confidence {formatPercent(point.forecastAccuracy)}</p>
                  </div>

                  <div className="min-w-0 rounded-[18px] border border-white/8 bg-slate-950/45 p-3">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Siren className="h-4 w-4" />
                      <span className="text-[11px] uppercase tracking-[0.18em]">Rainfall deficit</span>
                    </div>
                    <p className="mt-2 font-display text-[1.75rem] leading-none text-white">{point.rainfallDeficit?.toFixed(0) ?? "N/A"} mm</p>
                    <p className="mt-1 text-[13px] text-slate-300">Projected SPI {point.forecast?.toFixed(1) ?? "N/A"}</p>
                  </div>
                </div>

                <div className="mt-2.5 grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2">
                  <div className="min-w-0 rounded-[18px] border border-white/8 bg-slate-950/45 px-3 py-2.5 text-sm text-slate-200">
                    <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">SPI</span>
                    <p className="mt-1 text-[15px] text-white">{point.spi?.toFixed(1) ?? "N/A"}</p>
                  </div>
                  <div className="min-w-0 rounded-[18px] border border-white/8 bg-slate-950/45 px-3 py-2.5 text-sm text-slate-200">
                    <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Soil</span>
                    <p className="mt-1 text-[15px] text-white">{point.soilMoisture?.toFixed(2) ?? "N/A"}</p>
                  </div>
                  <div className="min-w-0 rounded-[18px] border border-white/8 bg-slate-950/45 px-3 py-2.5 text-sm text-slate-200">
                    <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">LST</span>
                    <p className="mt-1 text-[15px] text-white">{point.lst?.toFixed(1) ?? "N/A"} C</p>
                  </div>
                </div>

                <div className="mt-2.5 min-w-0 rounded-[18px] border border-white/8 bg-slate-950/45 px-3 py-2.5">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Action</p>
                  <p className="mt-1 line-clamp-2 break-words text-[13px] leading-5 text-slate-300">{city.policyNote}</p>
                </div>
              </article>
            );
          }}
        />

        <ExpandablePanel title="Decision Support Playbook" summary="3 escalation paths" contentClassName="space-y-3">
          {[
            {
              title: "Immediate red signal",
              icon: ShieldAlert,
              tone: "border-rose-400/25 bg-rose-500/10",
              summary: "Use email, SMS, WhatsApp, and webhook relay together when critical drought severity appears."
            },
            {
              title: "High-risk review",
              icon: BellRing,
              tone: "border-orange-400/20 bg-orange-500/8",
              summary: "Send an executive brief and schedule same-day mitigation review with water and planning leads."
            },
            {
              title: "Digest and reporting",
              icon: MailCheck,
              tone: "border-cyan-400/20 bg-cyan-500/10",
              summary: "Use daily email digests for moderate conditions and attach PDF summaries from the AI assistant."
            }
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.title} className={`rounded-[20px] border p-3.5 ${item.tone}`}>
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white/10 p-2">
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <p className="font-display text-base text-white">{item.title}</p>
                </div>
                <p className="mt-2.5 text-sm leading-6 text-slate-200">{item.summary}</p>
              </div>
            );
          })}
        </ExpandablePanel>
      </div>
    </div>
  );
};

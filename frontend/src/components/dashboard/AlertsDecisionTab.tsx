import type { DashboardSnapshot, SeverityFilter } from "@ecovision/shared";
import { BellRing, MailCheck, ShieldAlert, Siren } from "lucide-react";

import { DecisionAlertsPanel } from "@/components/dashboard/DecisionAlertsPanel";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { buildCurrentConditionRows } from "@/lib/dashboard";
import { cn, formatPercent, riskBadgeClasses } from "@/lib/utils";

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
  const rows = buildCurrentConditionRows(snapshot, severityFilter);
  const criticalCount = rows.filter((row) => row.riskLevel === "critical").length;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_360px]">
      <DecisionAlertsPanel snapshot={snapshot} timelineIndex={timelineIndex} severityFilter={severityFilter} />

      <div className="space-y-4 xl:max-h-[calc(100vh-320px)] xl:overflow-y-auto xl:pr-1">
        <GlassPanel
          title="Risk Scoring by Emirate"
          rightSlot={
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-400/20 bg-rose-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-rose-100">
              <Siren className="h-3.5 w-3.5" />
              {criticalCount} red signal{criticalCount === 1 ? "" : "s"}
            </div>
          }
          contentClassName="space-y-3"
        >
          {rows.map((row) => (
            <button
              key={row.emirateId}
              onClick={() => onCitySelect(row.emirateId)}
              className={cn(
                "w-full rounded-[20px] border p-3.5 text-left transition",
                row.emirateId === selectedCityId
                  ? "border-cyan-400/30 bg-cyan-400/10"
                  : "border-white/8 bg-white/5 hover:border-white/15"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-display text-lg text-white">{row.emirate}</p>
                  <p className="mt-1 text-sm text-slate-400">Rainfall deficit {row.rainfallDeficit?.toFixed(0) ?? "N/A"} mm</p>
                </div>
                <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ring-1", riskBadgeClasses[row.riskLevel])}>
                  {row.riskLevel}
                </span>
              </div>
              <div className="mt-2.5 grid gap-2 text-sm text-slate-300 sm:grid-cols-3">
                <p>SPI {row.spi?.toFixed(1) ?? "N/A"}</p>
                <p>Soil {row.soilMoisture?.toFixed(2) ?? "N/A"}</p>
                <p>Confidence {formatPercent(row.forecastConfidence)}</p>
              </div>
            </button>
          ))}
        </GlassPanel>

        <GlassPanel title="Decision Support Playbook" contentClassName="space-y-3">
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
              <div key={item.title} className={cn("rounded-[20px] border p-3.5", item.tone)}>
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
        </GlassPanel>
      </div>
    </div>
  );
};

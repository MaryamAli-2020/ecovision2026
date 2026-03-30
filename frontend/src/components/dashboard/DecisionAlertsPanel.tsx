import type { DashboardSnapshot, SeverityFilter } from "@ecovision/shared";
import { BellRing, Copy, Mail, MessageSquareWarning, RadioTower, Siren } from "lucide-react";
import { useMemo, useState } from "react";

import { GlassPanel } from "@/components/ui/GlassPanel";
import { buildDecisionAlerts } from "@/lib/dashboard";
import { cn, riskBadgeClasses } from "@/lib/utils";

interface DecisionAlertsPanelProps {
  snapshot: DashboardSnapshot;
  timelineIndex: number;
  severityFilter?: SeverityFilter;
}

type AlertSort = "severity" | "location" | "confidence";

const channelMeta = {
  email: {
    label: "Email brief",
    icon: Mail
  },
  sms: {
    label: "SMS escalation",
    icon: MessageSquareWarning
  },
  whatsapp: {
    label: "WhatsApp ops",
    icon: BellRing
  },
  webhook: {
    label: "Webhook relay",
    icon: RadioTower
  }
} as const;

const sortOptions: Array<{ id: AlertSort; label: string }> = [
  { id: "severity", label: "Severity" },
  { id: "location", label: "Location" },
  { id: "confidence", label: "Confidence" }
];

const severityRank = { low: 0, moderate: 1, high: 2, critical: 3 } as const;

export const DecisionAlertsPanel = ({
  snapshot,
  timelineIndex,
  severityFilter = "all"
}: DecisionAlertsPanelProps) => {
  const [sortBy, setSortBy] = useState<AlertSort>("severity");
  const alerts = buildDecisionAlerts(snapshot, timelineIndex, severityFilter);
  const criticalCount = alerts.filter((alert) => alert.riskLevel === "critical").length;

  const sortedAlerts = useMemo(() => {
    const nextAlerts = [...alerts];

    nextAlerts.sort((left, right) => {
      if (sortBy === "location") {
        return left.city.localeCompare(right.city);
      }

      if (sortBy === "confidence") {
        return (right.confidence ?? 0) - (left.confidence ?? 0);
      }

      const severityDelta = severityRank[right.riskLevel] - severityRank[left.riskLevel];
      return severityDelta !== 0 ? severityDelta : left.city.localeCompare(right.city);
    });

    return nextAlerts;
  }, [alerts, sortBy]);

  const handleCopy = async (value: string) => {
    if (!navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(value);
  };

  return (
    <GlassPanel
      title="Decision Alerts"
      rightSlot={
        <div
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ring-1",
            criticalCount > 0
              ? "bg-rose-500/15 text-rose-200 ring-rose-400/30"
              : "bg-cyan-500/10 text-cyan-100 ring-cyan-400/20"
          )}
        >
          {criticalCount > 0 ? <Siren className="h-3.5 w-3.5" /> : <BellRing className="h-3.5 w-3.5" />}
          {criticalCount > 0 ? `${criticalCount} critical` : "Digest ready"}
        </div>
      }
      contentClassName="space-y-3"
    >
      <div className="flex flex-wrap gap-2">
        {sortOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => setSortBy(option.id)}
            className={cn(
              "rounded-2xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition",
              sortBy === option.id ? "bg-white text-slate-950" : "border border-white/10 bg-white/5 text-slate-300"
            )}
          >
            Sort by {option.label}
          </button>
        ))}
      </div>

      {sortedAlerts.length ? (
        sortedAlerts.map((alert) => (
          <article
            key={alert.id}
            className={cn(
              "rounded-[20px] border p-3.5",
              alert.riskLevel === "critical"
                ? "border-rose-400/30 bg-rose-500/10 shadow-ember"
                : alert.riskLevel === "high"
                  ? "border-orange-400/20 bg-orange-500/8"
                  : "border-cyan-400/15 bg-white/5"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{alert.region}</p>
                <h4 className="mt-1 font-display text-lg text-white">{alert.title}</h4>
              </div>
              <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ring-1", riskBadgeClasses[alert.riskLevel])}>
                {alert.riskLevel}
              </span>
            </div>

            <p className="mt-2.5 text-sm leading-6 text-slate-200">{alert.summary}</p>

            <div className="mt-2.5 flex flex-wrap gap-2">
              {alert.channels.map((channel) => {
                const Icon = channelMeta[channel].icon;

                return (
                  <span
                    key={channel}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200"
                  >
                    <Icon className="h-3.5 w-3.5 text-cyan-200" />
                    {channelMeta[channel].label}
                  </span>
                );
              })}
            </div>

            <div className="mt-2.5 rounded-2xl border border-white/8 bg-slate-950/45 px-3 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Decision Recipients</p>
              <p className="mt-2 text-sm text-slate-200">{alert.targetRoles.join(" / ")}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <p className="text-xs uppercase tracking-[0.18em] text-rose-200">{alert.escalationWindow}</p>
                <p className="text-xs uppercase tracking-[0.18em] text-cyan-100">
                  Confidence {alert.confidence?.toFixed(0) ?? "N/A"}%
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href={`mailto:?subject=${encodeURIComponent(alert.emailSubject)}&body=${encodeURIComponent(alert.emailBody)}`}
                className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
              >
                <Mail className="h-4 w-4" />
                Draft Email
              </a>
              <button
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-white/20 hover:bg-white/10"
                onClick={() => {
                  void handleCopy(`${alert.emailSubject}\n\n${alert.emailBody}`);
                }}
              >
                <Copy className="h-4 w-4" />
                Copy Alert
              </button>
            </div>
          </article>
        ))
      ) : (
        <div className="rounded-[24px] border border-emerald-400/20 bg-emerald-500/8 px-4 py-4 text-sm text-emerald-100">
          No urgent alerts in the current filter context. Keep decision makers on the daily digest and monitor forecast confidence for new threshold crossings.
        </div>
      )}
    </GlassPanel>
  );
};

import type { DashboardSnapshot } from "@ecovision/shared";
import { BellRing, Copy, Mail, MessageSquareWarning, RadioTower, Siren } from "lucide-react";

import { GlassPanel } from "@/components/ui/GlassPanel";
import { buildDecisionAlerts } from "@/lib/dashboard";
import { cn, riskBadgeClasses } from "@/lib/utils";

interface DecisionAlertsPanelProps {
  snapshot: DashboardSnapshot;
  timelineIndex: number;
}

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

export const DecisionAlertsPanel = ({ snapshot, timelineIndex }: DecisionAlertsPanelProps) => {
  const alerts = buildDecisionAlerts(snapshot, timelineIndex);
  const criticalCount = alerts.filter((alert) => alert.riskLevel === "critical").length;

  const handleCopy = async (value: string) => {
    if (!navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(value);
  };

  return (
    <GlassPanel
      title="Decision Alerts"
      subtitle="Suggested escalation paths for decision makers, field leads, and response coordinators."
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
      {alerts.length ? (
        alerts.map((alert) => (
          <article
            key={alert.id}
            className={cn(
              "rounded-[24px] border p-4",
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

            <p className="mt-3 text-sm leading-6 text-slate-200">{alert.summary}</p>

            <div className="mt-3 flex flex-wrap gap-2">
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

            <div className="mt-3 rounded-2xl border border-white/8 bg-slate-950/45 px-3 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Decision Recipients</p>
              <p className="mt-2 text-sm text-slate-200">{alert.targetRoles.join(" / ")}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.18em] text-rose-200">{alert.escalationWindow}</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
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
          No urgent alerts in the current timeline slice. Keep decision makers on the daily email digest and monitor for new threshold crossings.
        </div>
      )}
    </GlassPanel>
  );
};

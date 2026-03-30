import type { DashboardTab } from "@ecovision/shared";
import { BellRing, Bot, ChartSpline, LayoutGrid } from "lucide-react";

import { cn } from "@/lib/utils";

interface DashboardTabsProps {
  activeTab: DashboardTab;
  onChange: (tab: DashboardTab) => void;
}

const tabs: Array<{ id: DashboardTab; label: string; icon: typeof LayoutGrid; description: string }> = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutGrid,
    description: "Operations map, KPIs, current conditions, and remote data availability."
  },
  {
    id: "forecasting",
    label: "Forecasting & Analytics",
    icon: ChartSpline,
    description: "MSTT forecasting control center, model comparison, and archive analytics."
  },
  {
    id: "ai-tools",
    label: "AI Tools",
    icon: Bot,
    description: "Assistant, audio briefing, summaries, and explainable forecast context."
  },
  {
    id: "alerts",
    label: "Alerts & Decision Support",
    icon: BellRing,
    description: "Operational alerts, warning prioritization, and decision-maker messaging."
  }
];

export const DashboardTabs = ({ activeTab, onChange }: DashboardTabsProps) => (
  <div className="grid gap-3 xl:grid-cols-4">
    {tabs.map((tab) => {
      const Icon = tab.icon;

      return (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "rounded-[22px] border p-3.5 text-left transition",
            activeTab === tab.id
              ? "border-cyan-400/30 bg-cyan-400/10 shadow-glow"
              : "border-white/8 bg-white/5 hover:border-white/15"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "rounded-2xl p-2",
                activeTab === tab.id ? "bg-white text-slate-950" : "bg-white/5 text-cyan-100"
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="font-display text-sm text-white">{tab.label}</p>
              <p className="mt-1 text-[11px] leading-5 text-slate-400">{tab.description}</p>
            </div>
          </div>
        </button>
      );
    })}
  </div>
);

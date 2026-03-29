import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { RiskLevel } from "@ecovision/shared";

export const cn = (...inputs: Array<string | undefined | false | null>) => twMerge(clsx(inputs));

export const formatMonth = (timestamp: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short"
  }).format(new Date(timestamp));

export const formatNumber = (value: number | null | undefined, digits = 1) =>
  value === null || value === undefined ? "N/A" : value.toFixed(digits);

export const formatPercent = (value: number | null | undefined) =>
  value === null || value === undefined ? "N/A" : `${value.toFixed(0)}%`;

export const riskBadgeClasses: Record<RiskLevel, string> = {
  low: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  moderate: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  high: "bg-orange-500/15 text-orange-300 ring-orange-400/30",
  critical: "bg-rose-500/15 text-rose-300 ring-rose-400/30"
};

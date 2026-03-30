import { ChevronDown } from "lucide-react";
import { useState, type PropsWithChildren, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface ExpandablePanelProps extends PropsWithChildren {
  title: string;
  summary?: string;
  badge?: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  contentClassName?: string;
}

export const ExpandablePanel = ({
  title,
  summary,
  badge,
  defaultOpen = false,
  className,
  contentClassName,
  children
}: ExpandablePanelProps) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      className={cn(
        "rounded-[24px] border border-white/10 bg-slate-950/60 shadow-glow backdrop-blur-xl",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-base text-slate-50">{title}</h3>
            {summary ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300">
                {summary}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {badge}
          <span className="hidden text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 sm:inline">
            {open ? "Hide" : "Show"}
          </span>
          <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform", open && "rotate-180")} />
        </div>
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className={cn("border-t border-white/6 p-4", contentClassName)}>{children}</div>
        </div>
      </div>
    </section>
  );
};

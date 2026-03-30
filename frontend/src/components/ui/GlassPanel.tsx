import type { PropsWithChildren, ReactNode } from "react";

import { cn } from "@/lib/utils";

interface GlassPanelProps extends PropsWithChildren {
  title?: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  className?: string;
  contentClassName?: string;
}

export const GlassPanel = ({
  title,
  subtitle,
  rightSlot,
  className,
  contentClassName,
  children
}: GlassPanelProps) => (
  <section
    className={cn(
      "rounded-[24px] border border-white/10 bg-slate-950/60 shadow-glow backdrop-blur-xl",
      className
    )}
  >
    {(title || subtitle || rightSlot) && (
      <div className="flex items-start justify-between gap-4 border-b border-white/6 px-4 py-3">
        <div>
          {title ? <h3 className="font-display text-base text-slate-50">{title}</h3> : null}
          {subtitle ? <p className="mt-1 text-xs text-slate-400">{subtitle}</p> : null}
        </div>
        {rightSlot}
      </div>
    )}
    <div className={cn("p-4", contentClassName)}>{children}</div>
  </section>
);

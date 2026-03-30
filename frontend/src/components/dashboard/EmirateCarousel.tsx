import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import { GlassPanel } from "@/components/ui/GlassPanel";
import { cn } from "@/lib/utils";

interface EmirateCarouselItem {
  id: string;
  emirate: string;
}

interface EmirateCarouselProps<T extends EmirateCarouselItem> {
  title: string;
  subtitle?: string;
  items: T[];
  activeId: string;
  onSelect: (id: string) => void;
  badge?: ReactNode;
  className?: string;
  slideClassName?: string;
  renderSlide: (item: T) => ReactNode;
}

export const EmirateCarousel = <T extends EmirateCarouselItem>({
  title,
  subtitle,
  items,
  activeId,
  onSelect,
  badge,
  className,
  slideClassName,
  renderSlide
}: EmirateCarouselProps<T>) => {
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.id === activeId)
  );

  const goTo = (nextIndex: number) => {
    if (!items.length) {
      return;
    }

    const safeIndex = (nextIndex + items.length) % items.length;
    onSelect(items[safeIndex]?.id ?? items[0]!.id);
  };

  return (
    <GlassPanel
      title={title}
      subtitle={subtitle}
      className={cn("xl:h-full xl:min-h-0", className)}
      rightSlot={
        <div className="flex items-center gap-2">
          {badge}
          <button
            type="button"
            onClick={() => goTo(activeIndex - 1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:border-cyan-400/30 hover:text-white"
            aria-label="Previous emirate"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => goTo(activeIndex + 1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:border-cyan-400/30 hover:text-white"
            aria-label="Next emirate"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      }
      contentClassName="flex h-full min-h-0 flex-col"
    >
      <div className="overflow-hidden rounded-[22px]">
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {items.map((item) => (
            <div key={item.id} className={cn("w-full shrink-0", slideClassName)}>
              {renderSlide(item)}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => goTo(index)}
            className={cn(
              "h-2.5 rounded-full transition",
              item.id === items[activeIndex]?.id ? "w-7 bg-cyan-300" : "w-2.5 bg-white/20 hover:bg-white/35"
            )}
            aria-label={`Go to ${item.emirate}`}
          />
        ))}
      </div>
    </GlassPanel>
  );
};

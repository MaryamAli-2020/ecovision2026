import type { AudioBrief, Language } from "@ecovision/shared";
import { Play, Square, Volume2 } from "lucide-react";

import { GlassPanel } from "@/components/ui/GlassPanel";
import { cn } from "@/lib/utils";

interface AudioBriefingPanelProps {
  briefing: AudioBrief;
  activeLanguage: Language;
  isSpeaking: boolean;
  onLanguageChange: (language: Language) => void;
  onPlay: () => void;
  onStop: () => void;
}

export const AudioBriefingPanel = ({
  briefing,
  activeLanguage,
  isSpeaking,
  onLanguageChange,
  onPlay,
  onStop
}: AudioBriefingPanelProps) => (
  <GlassPanel title="Audio Briefing Engine" rightSlot={<Volume2 className="h-4 w-4 text-cyan-200" />}>
    <div className="space-y-4">
      <div className="rounded-[22px] border border-white/8 bg-slate-900/60 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-1 items-end gap-1">
            {briefing.waveform.map((value, index) => (
              <span
                key={`${briefing.language}-${index}`}
                className={cn(
                  "w-1.5 rounded-full bg-gradient-to-b from-cyan-300 to-white/15 transition-all",
                  isSpeaking ? "opacity-100" : "opacity-60"
                )}
                style={{ height: `${value * 3}px` }}
              />
            ))}
          </div>
          <button
            className="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-xs font-semibold text-cyan-100"
            onClick={isSpeaking ? onStop : onPlay}
          >
            {isSpeaking ? (
              <span className="inline-flex items-center gap-2">
                <Square className="h-3.5 w-3.5" />
                Stop
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Play className="h-3.5 w-3.5" />
                Play
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        {(["ar", "en"] as Language[]).map((language) => (
          <button
            key={language}
            className={cn(
              "rounded-2xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition",
              activeLanguage === language ? "bg-white text-slate-950" : "border border-white/10 bg-white/5 text-slate-300"
            )}
            onClick={() => onLanguageChange(language)}
          >
            {language}
          </button>
        ))}
      </div>

      <p className="text-sm leading-6 text-slate-300">{briefing.text}</p>
    </div>
  </GlassPanel>
);

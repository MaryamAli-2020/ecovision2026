import type {
  AudioBrief,
  ChatMessage,
  DashboardSnapshot,
  Language
} from "@ecovision/shared";
import { FileText, Lightbulb, Volume2 } from "lucide-react";

import { AudioBriefingPanel } from "@/components/audio/AudioBriefingPanel";
import { ClimateAssistantPanel } from "@/components/chat/ClimateAssistantPanel";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { getSelectedCity } from "@/lib/dashboard";

interface AIToolsTabProps {
  snapshot: DashboardSnapshot;
  selectedCityId: string;
  messages: ChatMessage[];
  language: Language;
  briefing: AudioBrief;
  isSpeaking: boolean;
  isSending: boolean;
  onLanguageChange: (language: Language) => void;
  onPlay: () => void;
  onStop: () => void;
  onSend: (question: string) => void;
  onExampleClick: (question: string) => void;
  onDownloadPdf: (message: ChatMessage) => void;
  onGenerateAudio: () => void;
}

export const AIToolsTab = ({
  snapshot,
  selectedCityId,
  messages,
  language,
  briefing,
  isSpeaking,
  isSending,
  onLanguageChange,
  onPlay,
  onStop,
  onSend,
  onExampleClick,
  onDownloadPdf,
  onGenerateAudio
}: AIToolsTabProps) => {
  const selectedCity = getSelectedCity(snapshot, selectedCityId);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(360px,0.92fr)_minmax(0,1.08fr)]">
      <div className="space-y-6">
        <AudioBriefingPanel
          briefing={briefing}
          activeLanguage={language}
          isSpeaking={isSpeaking}
          onLanguageChange={onLanguageChange}
          onPlay={onPlay}
          onStop={onStop}
        />

        <GlassPanel
          title="AI-Generated Climate Summary"
          subtitle="Simple-language explanation layer for non-technical decision makers."
          rightSlot={<FileText className="h-4 w-4 text-cyan-200" />}
          contentClassName="space-y-4"
        >
          <div className="rounded-[24px] border border-white/8 bg-white/5 p-4">
            <p className="text-sm leading-6 text-slate-300">
              {selectedCity.emirate} is currently in a <span className="text-white">{selectedCity.riskLevel}</span> drought posture. The MSTT model is mainly reading
              soil moisture, vegetation health, and surface heat together to estimate how future SPI will move, and the current outlook suggests that{" "}
              {selectedCity.policyNote.toLowerCase()}
            </p>
          </div>
          <div className="grid gap-3">
            {selectedCity.recommendations.map((recommendation) => (
              <div key={recommendation.title} className="rounded-[22px] border border-white/8 bg-slate-950/45 p-4">
                <p className="font-semibold text-white">{recommendation.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{recommendation.summary}</p>
              </div>
            ))}
          </div>
        </GlassPanel>

        <GlassPanel
          title="Model Explainer"
          subtitle="How the AI assistant should explain forecasts, indicators, and model outputs."
          rightSlot={<Lightbulb className="h-4 w-4 text-cyan-200" />}
          contentClassName="space-y-3"
        >
          <div className="rounded-[22px] border border-white/8 bg-white/5 p-4 text-sm leading-6 text-slate-300">
            The assistant is grounded in the active Emirate, selected timeline, remote sensing variables, and MSTT model context. It should explain forecast confidence,
            rainfall deficit, vegetation health, and temperature stress in plain language first, then add policy implications.
          </div>
          <div className="rounded-[22px] border border-cyan-400/20 bg-cyan-500/10 p-4 text-sm leading-6 text-cyan-50">
            Audio brief generation uses the same grounded context, then converts the text into a demo-safe spoken briefing with browser speech playback.
          </div>
          <div className="rounded-[22px] border border-white/8 bg-white/5 p-4 text-sm leading-6 text-slate-300">
            Supported tasks: drought risk explanation, future SPI forecast interpretation, Arabic policy briefs, water management guidance, and mitigation scenario summaries.
          </div>
        </GlassPanel>
      </div>

      <div className="min-h-0">
        <ClimateAssistantPanel
          snapshot={snapshot}
          messages={messages}
          language={language}
          isSending={isSending}
          onLanguageChange={onLanguageChange}
          onSend={onSend}
          onExampleClick={onExampleClick}
          onDownloadPdf={onDownloadPdf}
          onGenerateAudio={onGenerateAudio}
        />
      </div>
    </div>
  );
};

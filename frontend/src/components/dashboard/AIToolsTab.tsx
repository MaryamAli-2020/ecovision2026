import type {
  AudioBrief,
  ChatMessage,
  DashboardSnapshot,
  Language
} from "@ecovision/shared";

import { AudioBriefingPanel } from "@/components/audio/AudioBriefingPanel";
import { ClimateAssistantPanel } from "@/components/chat/ClimateAssistantPanel";

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
}: AIToolsTabProps) => (
  <div className="grid gap-4 xl:h-full xl:min-h-0 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-start">
    <AudioBriefingPanel
      briefing={briefing}
      activeLanguage={language}
      isSpeaking={isSpeaking}
      onLanguageChange={onLanguageChange}
      onPlay={onPlay}
      onStop={onStop}
    />

    <div className="min-h-0 xl:h-full xl:overflow-y-auto xl:pr-1">
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

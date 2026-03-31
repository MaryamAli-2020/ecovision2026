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
  latestAssistantMessage?: ChatMessage;
  language: Language;
  briefing: AudioBrief;
  isSpeaking: boolean;
  isSending: boolean;
  isDownloadingPdf: boolean;
  pdfError: string | null;
  onLanguageChange: (language: Language) => void;
  onPlay: () => void;
  onStop: () => void;
  onSend: (question: string) => void;
  onExampleClick: (question: string) => void;
  onDownloadLatestPdf: () => void;
  onDownloadPdf: (message: ChatMessage) => void;
  onGenerateAudio: () => void;
}

export const AIToolsTab = ({
  snapshot,
  messages,
  latestAssistantMessage,
  language,
  briefing,
  isSpeaking,
  isSending,
  isDownloadingPdf,
  pdfError,
  onLanguageChange,
  onPlay,
  onStop,
  onSend,
  onExampleClick,
  onDownloadLatestPdf,
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
        latestAssistantMessage={latestAssistantMessage}
        language={language}
        isSending={isSending}
        isDownloadingPdf={isDownloadingPdf}
        pdfError={pdfError}
        onLanguageChange={onLanguageChange}
        onSend={onSend}
        onExampleClick={onExampleClick}
        onDownloadLatestPdf={onDownloadLatestPdf}
        onDownloadPdf={onDownloadPdf}
        onGenerateAudio={onGenerateAudio}
      />
    </div>
  </div>
);

import { useMutation } from "@tanstack/react-query";
import type { ChatMessage, DashboardSnapshot, Language } from "@ecovision/shared";
import { useEffect } from "react";

import { AudioBriefingPanel } from "@/components/audio/AudioBriefingPanel";
import { ClimateAssistantPanel } from "@/components/chat/ClimateAssistantPanel";
import { ConnectDataModal } from "@/components/data/ConnectDataModal";
import { DecisionAlertsPanel } from "@/components/dashboard/DecisionAlertsPanel";
import { ForecastChartPanel } from "@/components/dashboard/ForecastChartPanel";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { Header } from "@/components/layout/Header";
import { MapPanel } from "@/components/map/MapPanel";
import { downloadPdfReport, generateAudioBrief, sendChatMessage } from "@/lib/api";
import { countCriticalSignals, createUserMessage, getSelectedCity } from "@/lib/dashboard";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useDashboard } from "@/providers/DashboardProvider";

interface DashboardPageProps {
  isHealthLoading: boolean;
}

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const DashboardPage = ({ isHealthLoading }: DashboardPageProps) => {
  const dashboard = useDashboard();
  const {
    activeMetric,
    language,
    selectedCityId,
    timelineIndex,
    messages,
    currentBrief: storedBrief,
    lastQuestion,
    isConnectModalOpen,
    setCurrentBrief,
    setLanguage,
    setLastQuestion,
    appendMessages,
    setConnectModalOpen,
    restoreDemoMode,
    activateLiveMode,
    loadLiveSnapshot,
    setMetric,
    setSelectedCity,
    setTimelineIndex
  } = dashboard;
  const { isSpeaking, speak, stop } = useSpeechSynthesis();
  const snapshot = dashboard.snapshot as DashboardSnapshot;
  const selectedCity = getSelectedCity(snapshot, selectedCityId);
  const criticalSignals = countCriticalSignals(snapshot, timelineIndex);

  const chatMutation = useMutation({
    mutationFn: sendChatMessage
  });

  const audioMutation = useMutation({
    mutationFn: generateAudioBrief
  });

  useEffect(() => {
    setCurrentBrief({
      language,
      generatedAt: new Date().toISOString(),
      text: selectedCity.audioBriefs[language],
      waveform: snapshot.audioWaveform,
      voiceHint: language === "ar" ? "ar-AE" : "en-AE"
    });
  }, [language, selectedCity.id, selectedCity.audioBriefs.ar, selectedCity.audioBriefs.en, setCurrentBrief, snapshot.audioWaveform]);

  const requestBriefing = async (language: Language) => {
    const response = await audioMutation.mutateAsync({
      language,
      metric: activeMetric,
      selectedCityId,
      timelineIndex,
      snapshot
    });
    setCurrentBrief(response.briefing);
    setLanguage(language);
    return response.briefing;
  };

  const handleSend = async (question: string) => {
    setLastQuestion(question);
    appendMessages([createUserMessage(question, language)]);

    const response = await chatMutation.mutateAsync({
      question,
      language,
      metric: activeMetric,
      selectedCityId,
      timelineIndex,
      snapshot
    });

    appendMessages([response.message]);
    setCurrentBrief(response.briefing);
  };

  const handleDownloadPdf = async (message: ChatMessage) => {
    const blob = await downloadPdfReport({
      language,
      selectedCityId,
      question: lastQuestion,
      assistantMessage: message.content,
      snapshot
    });

    downloadBlob(blob, `ecovision-${selectedCityId}.pdf`);
  };

  const handleUseDemo = () => {
    restoreDemoMode();
    setConnectModalOpen(false);
  };

  const handleUseSnapshot = (nextSnapshot: DashboardSnapshot) => {
    loadLiveSnapshot(nextSnapshot);
    setConnectModalOpen(false);
  };

  const currentBrief =
    storedBrief ?? {
      language,
      generatedAt: new Date().toISOString(),
      text: selectedCity.audioBriefs[language],
      waveform: snapshot.audioWaveform,
      voiceHint: language === "ar" ? "ar-AE" : "en-AE"
    };

  return (
    <div className="min-h-screen bg-[#07111f] text-white lg:grid lg:h-screen lg:grid-rows-[auto_minmax(0,1fr)]">
      <Header
        mode={snapshot.mode}
        healthReady={!isHealthLoading && Boolean(dashboard.health)}
        criticalSignals={criticalSignals}
        onOpenConnect={() => setConnectModalOpen(true)}
        onSwitchDemo={handleUseDemo}
        onSwitchLive={() => {
          if (!activateLiveMode()) {
            setConnectModalOpen(true);
          }
        }}
      />

      <main className="mx-auto grid max-w-[1600px] gap-6 px-5 py-6 lg:min-h-0 lg:w-full lg:grid-cols-[minmax(0,1.58fr)_440px] lg:overflow-hidden lg:px-6">
        <MapPanel
          snapshot={snapshot}
          activeMetric={activeMetric}
          selectedCityId={selectedCityId}
          timelineIndex={timelineIndex}
          onMetricChange={setMetric}
          onCitySelect={setSelectedCity}
          onTimelineChange={setTimelineIndex}
        />

        <aside className="flex min-h-[640px] flex-col overflow-hidden rounded-[30px] border border-white/10 bg-slate-950/45 shadow-glow backdrop-blur-xl lg:h-full lg:min-h-0">
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {snapshot.warnings.length ? (
              <div className="rounded-[24px] border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                {snapshot.warnings[0].message}
              </div>
            ) : null}

            <DecisionAlertsPanel snapshot={snapshot} timelineIndex={timelineIndex} />

            <KpiGrid
              snapshot={snapshot}
              selectedCityId={selectedCityId}
              timelineIndex={timelineIndex}
            />

            <ForecastChartPanel
              snapshot={snapshot}
              selectedCityId={selectedCityId}
              timelineIndex={timelineIndex}
            />

            <AudioBriefingPanel
              briefing={currentBrief}
              activeLanguage={language}
              isSpeaking={isSpeaking}
              onLanguageChange={(language) => {
                void requestBriefing(language);
              }}
              onPlay={() => {
                if (!currentBrief.text) {
                  return;
                }
                speak(currentBrief.text, currentBrief.language);
              }}
              onStop={stop}
            />

            <ClimateAssistantPanel
              snapshot={snapshot}
              messages={messages}
              language={language}
              isSending={chatMutation.isPending}
              onLanguageChange={setLanguage}
              onSend={(question) => {
                void handleSend(question);
              }}
              onExampleClick={(question) => {
                void handleSend(question);
              }}
              onDownloadPdf={(message) => {
                void handleDownloadPdf(message);
              }}
              onGenerateAudio={() => {
                void requestBriefing("ar");
              }}
            />
          </div>
        </aside>
      </main>

      <ConnectDataModal
        open={isConnectModalOpen}
        onClose={() => setConnectModalOpen(false)}
        onUseDemo={handleUseDemo}
        onUseSnapshot={handleUseSnapshot}
      />
    </div>
  );
};

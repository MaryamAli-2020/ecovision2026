import { useMutation } from "@tanstack/react-query";
import type { ChatMessage, DashboardSnapshot, Language } from "@ecovision/shared";
import { useEffect } from "react";

import { ConnectDataModal } from "@/components/data/ConnectDataModal";
import { AlertsDecisionTab } from "@/components/dashboard/AlertsDecisionTab";
import { AIToolsTab } from "@/components/dashboard/AIToolsTab";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { ForecastingAnalyticsTab } from "@/components/dashboard/ForecastingAnalyticsTab";
import { GlobalFiltersBar } from "@/components/dashboard/GlobalFiltersBar";
import { OverviewTab } from "@/components/dashboard/OverviewTab";
import { Header } from "@/components/layout/Header";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { downloadPdfReport, generateAudioBrief, sendChatMessage } from "@/lib/api";
import { countCriticalSignals, createUserMessage, getSelectedCity } from "@/lib/dashboard";
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
    activeTab,
    selectedDateRange,
    severityFilter,
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
    setActiveTab,
    setSelectedDateRange,
    setSeverityFilter,
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

  const requestBriefing = async (briefLanguage: Language) => {
    const response = await audioMutation.mutateAsync({
      language: briefLanguage,
      metric: activeMetric,
      selectedCityId,
      timelineIndex,
      snapshot
    });
    setCurrentBrief(response.briefing);
    setLanguage(briefLanguage);
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
    <div className="min-h-screen bg-[#07111f] text-white">
      <Header
        mode={snapshot.mode}
        healthReady={!isHealthLoading && Boolean(dashboard.health)}
        criticalSignals={criticalSignals}
        sourceCount={snapshot.analytics.dataSources.length}
        modelLabel="MSTT Forecasting"
        onOpenConnect={() => setConnectModalOpen(true)}
        onSwitchDemo={handleUseDemo}
        onSwitchLive={() => {
          if (!activateLiveMode()) {
            setConnectModalOpen(true);
          }
        }}
      />

      <main className="mx-auto max-w-[1600px] space-y-6 px-5 py-6 lg:px-6">
        <GlobalFiltersBar
          snapshot={snapshot}
          activeMetric={activeMetric}
          selectedCityId={selectedCityId}
          selectedDateRange={selectedDateRange}
          severityFilter={severityFilter}
          onMetricChange={setMetric}
          onCityChange={setSelectedCity}
          onDateRangeChange={setSelectedDateRange}
          onSeverityChange={setSeverityFilter}
        />

        <DashboardTabs activeTab={activeTab} onChange={setActiveTab} />

        {snapshot.warnings.length ? (
          <div className="rounded-[24px] border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {snapshot.warnings[0].message}
          </div>
        ) : null}

        {activeTab === "overview" ? (
          <OverviewTab
            snapshot={snapshot}
            activeMetric={activeMetric}
            selectedCityId={selectedCityId}
            timelineIndex={timelineIndex}
            severityFilter={severityFilter}
            onMetricChange={setMetric}
            onCitySelect={setSelectedCity}
            onTimelineChange={setTimelineIndex}
          />
        ) : null}

        {activeTab === "forecasting" ? (
          <ForecastingAnalyticsTab
            snapshot={snapshot}
            selectedCityId={selectedCityId}
            timelineIndex={timelineIndex}
            selectedDateRange={selectedDateRange}
            severityFilter={severityFilter}
          />
        ) : null}

        {activeTab === "ai-tools" ? (
          <AIToolsTab
            snapshot={snapshot}
            selectedCityId={selectedCityId}
            messages={messages}
            language={language}
            briefing={currentBrief}
            isSpeaking={isSpeaking}
            isSending={chatMutation.isPending}
            onLanguageChange={setLanguage}
            onPlay={() => {
              if (!currentBrief.text) {
                return;
              }
              speak(currentBrief.text, currentBrief.language);
            }}
            onStop={stop}
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
        ) : null}

        {activeTab === "alerts" ? (
          <AlertsDecisionTab
            snapshot={snapshot}
            timelineIndex={timelineIndex}
            severityFilter={severityFilter}
            selectedCityId={selectedCityId}
            onCitySelect={setSelectedCity}
          />
        ) : null}
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

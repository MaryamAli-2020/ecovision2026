import { useMutation } from "@tanstack/react-query";
import type { ChatMessage, DashboardSnapshot, Language } from "@ecovision/shared";
import { useEffect, useRef, useState } from "react";

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
import { cn } from "@/lib/utils";
import { useDashboard } from "@/providers/DashboardProvider";

interface DashboardPageProps {
  isHealthLoading: boolean;
}

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
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
    theme,
    selectedCityId,
    timelineIndex,
    messages,
    currentBrief: storedBrief,
    lastQuestion,
    isConnectModalOpen,
    setCurrentBrief,
    setLanguage,
    setLastQuestion,
    toggleTheme,
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
  const contentRef = useRef<HTMLDivElement | null>(null);
  const previousScrollRef = useRef(0);
  const [headerHidden, setHeaderHidden] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const snapshot = dashboard.snapshot as DashboardSnapshot;
  const selectedCity = getSelectedCity(snapshot, selectedCityId);
  const criticalSignals = countCriticalSignals(snapshot, timelineIndex);
  const latestAssistantMessage = [...messages].reverse().find((message) => message.role === "assistant");

  const chatMutation = useMutation({
    mutationFn: sendChatMessage
  });

  const audioMutation = useMutation({
    mutationFn: generateAudioBrief
  });

  const reportMutation = useMutation({
    mutationFn: downloadPdfReport
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

  useEffect(() => {
    const element = contentRef.current;

    if (!element) {
      return;
    }

    previousScrollRef.current = element.scrollTop;
    setHeaderHidden(false);

    const handleScroll = () => {
      const currentScroll = element.scrollTop;

      if (currentScroll < 24) {
        setHeaderHidden(false);
      } else if (currentScroll > previousScrollRef.current + 8) {
        setHeaderHidden(true);
      } else if (currentScroll < previousScrollRef.current - 8) {
        setHeaderHidden(false);
      }

      previousScrollRef.current = currentScroll;
    };

    element.addEventListener("scroll", handleScroll, { passive: true });
    return () => element.removeEventListener("scroll", handleScroll);
  }, [activeTab]);

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
    setPdfError(null);
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
    setPdfError(null);

    try {
      const { blob, filename } = await reportMutation.mutateAsync({
        language,
        selectedCityId,
        question: lastQuestion,
        assistantMessage: message.content,
        snapshot
      });

      downloadBlob(blob, filename ?? `ecovision-${selectedCityId}.pdf`);
    } catch (error) {
      setPdfError(error instanceof Error ? error.message : "Unable to generate the PDF report.");
    }
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
    <div className="ev-app-shell min-h-screen text-white lg:flex lg:h-screen lg:flex-col lg:overflow-hidden">
      <div
        className={cn(
          "sticky top-0 z-30 overflow-hidden transition-[max-height,opacity,transform] duration-300",
          headerHidden ? "max-h-0 -translate-y-3 opacity-0" : "max-h-40 translate-y-0 opacity-100"
        )}
      >
        <Header
          mode={snapshot.mode}
          theme={theme}
          healthReady={!isHealthLoading && Boolean(dashboard.health)}
          criticalSignals={criticalSignals}
          onOpenConnect={() => setConnectModalOpen(true)}
          onToggleTheme={toggleTheme}
          onSwitchDemo={handleUseDemo}
          onSwitchLive={() => {
            if (!activateLiveMode()) {
              setConnectModalOpen(true);
            }
          }}
        />
      </div>

      <main className="mx-auto max-w-[1600px] space-y-2.5 px-4 py-3 lg:flex lg:min-h-0 lg:w-full lg:flex-1 lg:flex-col lg:overflow-hidden lg:px-6">
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

        <div
          ref={contentRef}
          className={cn(
            "lg:min-h-0 lg:flex-1 lg:pr-1",
            activeTab === "overview" ? "lg:overflow-hidden" : "lg:overflow-y-auto"
          )}
        >
          {activeTab === "overview" ? (
            <OverviewTab
              snapshot={snapshot}
              theme={theme}
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
              theme={theme}
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
              latestAssistantMessage={latestAssistantMessage}
              language={language}
              briefing={currentBrief}
              isSpeaking={isSpeaking}
              isSending={chatMutation.isPending}
              isDownloadingPdf={reportMutation.isPending}
              pdfError={pdfError}
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
              onDownloadLatestPdf={() => {
                if (!latestAssistantMessage) {
                  return;
                }
                void handleDownloadPdf(latestAssistantMessage);
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
        </div>
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

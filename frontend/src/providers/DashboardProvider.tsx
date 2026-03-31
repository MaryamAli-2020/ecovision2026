import type {
  AudioBrief,
  ChatMessage,
  ClimateMetric,
  DashboardSnapshot,
  DashboardTab,
  DateRangeKey,
  HealthResponse,
  Language,
  SeverityFilter
} from "@ecovision/shared";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";

import { getSelectedCity } from "@/lib/dashboard";

export type ThemeMode = "dark" | "light";

interface DashboardContextValue {
  snapshot: DashboardSnapshot | null;
  demoSnapshot: DashboardSnapshot | null;
  liveSnapshot: DashboardSnapshot | null;
  activeMetric: ClimateMetric;
  activeTab: DashboardTab;
  selectedDateRange: DateRangeKey;
  severityFilter: SeverityFilter;
  selectedCityId: string;
  timelineIndex: number;
  language: Language;
  theme: ThemeMode;
  isConnectModalOpen: boolean;
  messages: ChatMessage[];
  currentBrief: AudioBrief | null;
  lastQuestion: string;
  health: HealthResponse | null;
  initializeSnapshot: (snapshot: DashboardSnapshot) => void;
  setHealth: (health: HealthResponse) => void;
  setMetric: (metric: ClimateMetric) => void;
  setActiveTab: (tab: DashboardTab) => void;
  setSelectedDateRange: (range: DateRangeKey) => void;
  setSeverityFilter: (severity: SeverityFilter) => void;
  setSelectedCity: (cityId: string) => void;
  setTimelineIndex: (index: number) => void;
  setLanguage: (language: Language) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setConnectModalOpen: (open: boolean) => void;
  loadLiveSnapshot: (snapshot: DashboardSnapshot) => void;
  restoreDemoMode: () => void;
  activateLiveMode: () => boolean;
  appendMessages: (messages: ChatMessage[]) => void;
  setCurrentBrief: (brief: AudioBrief | null) => void;
  setLastQuestion: (question: string) => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

const defaultTimelineIndex = (snapshot: DashboardSnapshot) =>
  Math.min(2, Math.max(snapshot.timeline.length - 1, 0));

const getInitialTheme = (): ThemeMode => {
  if (typeof window === "undefined") {
    return "dark";
  }

  const storedTheme = window.localStorage.getItem("ecovision-theme");
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
};

export const DashboardProvider = ({ children }: PropsWithChildren) => {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [demoSnapshot, setDemoSnapshot] = useState<DashboardSnapshot | null>(null);
  const [liveSnapshot, setLiveSnapshot] = useState<DashboardSnapshot | null>(null);
  const [activeMetric, setActiveMetric] = useState<ClimateMetric>("drought");
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [selectedDateRange, setSelectedDateRange] = useState<DateRangeKey>("full-archive");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [selectedCityId, setSelectedCityId] = useState("");
  const [timelineIndex, setTimelineIndexState] = useState(2);
  const [language, setLanguage] = useState<Language>("en");
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [isConnectModalOpen, setConnectModalOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentBrief, setCurrentBrief] = useState<AudioBrief | null>(null);
  const [lastQuestion, setLastQuestion] = useState("");
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem("ecovision-theme", theme);
  }, [theme]);

  const hydrateSnapshot = (nextSnapshot: DashboardSnapshot, persistAsLive = false) => {
    setSnapshot(nextSnapshot);
    if (persistAsLive) {
      setLiveSnapshot(nextSnapshot);
    }
    setSelectedCityId(nextSnapshot.selectedCityId);
    setTimelineIndexState(defaultTimelineIndex(nextSnapshot));
    setMessages(nextSnapshot.seedMessages);
    const selectedCity = getSelectedCity(nextSnapshot, nextSnapshot.selectedCityId);
    setCurrentBrief({
      language: "en",
      generatedAt: new Date().toISOString(),
      text: selectedCity.audioBriefs.en,
      waveform: nextSnapshot.audioWaveform,
      voiceHint: "en-AE"
    });
  };

  const value = useMemo<DashboardContextValue>(
    () => ({
      snapshot,
      demoSnapshot,
      liveSnapshot,
      activeMetric,
      activeTab,
      selectedDateRange,
      severityFilter,
      selectedCityId,
      timelineIndex,
      language,
      theme,
      isConnectModalOpen,
      messages,
      currentBrief,
      lastQuestion,
      health,
      initializeSnapshot: (nextSnapshot) => {
        if (nextSnapshot.mode === "demo") {
          setDemoSnapshot(nextSnapshot);
        }
        hydrateSnapshot(nextSnapshot, nextSnapshot.mode === "live");
      },
      setHealth,
      setMetric: setActiveMetric,
      setActiveTab,
      setSelectedDateRange,
      setSeverityFilter,
      setSelectedCity: setSelectedCityId,
      setTimelineIndex: setTimelineIndexState,
      setLanguage,
      setTheme,
      toggleTheme: () => setTheme((current) => (current === "dark" ? "light" : "dark")),
      setConnectModalOpen,
      loadLiveSnapshot: (nextSnapshot) => hydrateSnapshot({ ...nextSnapshot, mode: "live" }, true),
      restoreDemoMode: () => {
        if (demoSnapshot) {
          hydrateSnapshot(demoSnapshot, false);
        }
      },
      activateLiveMode: () => {
        if (!liveSnapshot) {
          return false;
        }
        hydrateSnapshot({ ...liveSnapshot, mode: "live" }, true);
        return true;
      },
      appendMessages: (nextMessages) => setMessages((current) => [...current, ...nextMessages]),
      setCurrentBrief,
      setLastQuestion
    }),
    [
      activeMetric,
      activeTab,
      currentBrief,
      demoSnapshot,
      health,
      isConnectModalOpen,
      language,
      lastQuestion,
      liveSnapshot,
      messages,
      selectedCityId,
      selectedDateRange,
      severityFilter,
      snapshot,
      theme,
      timelineIndex
    ]
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);

  if (!context) {
    throw new Error("useDashboard must be used inside DashboardProvider");
  }

  return context;
};

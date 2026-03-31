import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { DashboardPage } from "./components/dashboard/DashboardPage";
import { AppProviders } from "./providers/AppProviders";
import { fetchDemoSnapshot, fetchHealth } from "./lib/api";
import { useDashboard } from "./providers/DashboardProvider";

const DashboardBootstrap = () => {
  const dashboard = useDashboard();
  const healthQuery = useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
    staleTime: 60_000
  });
  const demoQuery = useQuery({
    queryKey: ["dashboard-demo"],
    queryFn: fetchDemoSnapshot,
    staleTime: Infinity
  });

  useEffect(() => {
    if (healthQuery.data) {
      dashboard.setHealth(healthQuery.data);
    }
  }, [dashboard, healthQuery.data]);

  useEffect(() => {
    if (demoQuery.data?.snapshot && !dashboard.snapshot) {
      dashboard.initializeSnapshot(demoQuery.data.snapshot);
    }
  }, [dashboard, demoQuery.data]);

  if (!dashboard.snapshot) {
    return (
      <div className="ev-app-shell flex min-h-screen items-center justify-center text-slate-100">
        <div className="ev-panel rounded-3xl border border-white/10 bg-white/5 px-8 py-7 shadow-glow backdrop-blur-xl">
          <p className="font-display text-2xl">Booting EcoVision UAE 2026</p>
          <p className="mt-2 text-sm text-slate-300">
            Loading demo intelligence, climate map layers, and AI briefing context...
          </p>
        </div>
      </div>
    );
  }

  return <DashboardPage isHealthLoading={healthQuery.isLoading} />;
};

const App = () => (
  <AppProviders>
    <DashboardBootstrap />
  </AppProviders>
);

export default App;

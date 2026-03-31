import type { ClimateMetric, DashboardSnapshot, SeverityFilter } from "@ecovision/shared";
import maplibregl from "maplibre-gl";
import { Droplets, Layers3, MapPinned, Satellite, ThermometerSun, Trees } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";

import {
  buildForecastSummary,
  getMapMetricValue,
  getSelectedCity,
  getTimelinePoint,
  isRiskVisible
} from "@/lib/dashboard";
import { cn, formatMonth } from "@/lib/utils";

const BASE_RASTER_SOURCE_ID = "base-raster";
const BASE_RASTER_LAYER_ID = "base-raster";
const SATELLITE_RASTER_SOURCE_ID = "satellite-raster";
const SATELLITE_RASTER_LAYER_ID = "satellite-raster";
const CITIES_SOURCE_ID = "cities";

interface MapPanelProps {
  snapshot: DashboardSnapshot;
  theme: "dark" | "light";
  activeMetric: ClimateMetric;
  selectedCityId: string;
  timelineIndex: number;
  severityFilter: SeverityFilter;
  onMetricChange: (metric: ClimateMetric) => void;
  onCitySelect: (cityId: string) => void;
  onTimelineChange: (index: number) => void;
}

const createBaseStyle = (theme: "dark" | "light", showSatellite: boolean): maplibregl.StyleSpecification => ({
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    [BASE_RASTER_SOURCE_ID]: {
      type: "raster",
      tiles: [theme === "dark" ? "https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png" : "https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"],
      tileSize: 256
    },
    [SATELLITE_RASTER_SOURCE_ID]: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      ],
      tileSize: 256
    },
  },
  layers: [
    {
      id: BASE_RASTER_LAYER_ID,
      type: "raster",
      source: BASE_RASTER_SOURCE_ID,
      paint: {
        "raster-opacity": showSatellite ? 0 : 1
      }
    },
    {
      id: SATELLITE_RASTER_LAYER_ID,
      type: "raster",
      source: SATELLITE_RASTER_SOURCE_ID,
      paint: {
        "raster-opacity": showSatellite ? 1 : 0
      }
    }
  ]
});

const metricConfig: Record<
  ClimateMetric,
  { label: string; icon: typeof ThermometerSun; min: number; max: number; colors: string[] }
> = {
  drought: {
    label: "Drought",
    icon: Layers3,
    min: 0,
    max: 2,
    colors: ["#fbbf24", "#f97316", "#ef4444"]
  },
  heat: {
    label: "Heat",
    icon: ThermometerSun,
    min: 34,
    max: 48,
    colors: ["#f59e0b", "#fb7185", "#ef4444"]
  },
  ndvi: {
    label: "NDVI",
    icon: Trees,
    min: 0.18,
    max: 0.45,
    colors: ["#0f766e", "#14b8a6", "#bbf7d0"]
  },
  soil_moisture: {
    label: "Soil Moisture",
    icon: Droplets,
    min: 0,
    max: 1,
    colors: ["#38bdf8", "#0ea5e9", "#0369a1"]
  },
  satellite: {
    label: "Satellite",
    icon: Satellite,
    min: 0,
    max: 1,
    colors: ["#38bdf8", "#7dd3fc", "#e0f2fe"]
  }
};

const buildCityFeatureCollection = (
  snapshot: DashboardSnapshot,
  timelineIndex: number,
  activeMetric: ClimateMetric,
  severityFilter: SeverityFilter
): maplibregl.GeoJSONSourceSpecification["data"] => ({
  type: "FeatureCollection",
  features: snapshot.cities.map((city) => {
    const point = getTimelinePoint(city, timelineIndex);
    const intensity = getMapMetricValue(city, timelineIndex, activeMetric);
    const visible = isRiskVisible(point.riskLevel, severityFilter) ? 1 : 0;

    return {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [city.longitude, city.latitude]
      },
      properties: {
        id: city.id,
        city: city.city,
        emirate: city.emirate,
        region: city.region,
        spi: point.spi ?? "N/A",
        ndvi: point.ndvi ?? "N/A",
        lst: point.lst ?? "N/A",
        soilMoisture: point.soilMoisture ?? "N/A",
        forecast: point.forecast ?? "N/A",
        riskLevel: point.riskLevel,
        intensity,
        visible
      }
    };
  })
});

const colorExpressionForMetric = (metric: ClimateMetric) => {
  const config = metricConfig[metric];
  return [
    "interpolate",
    ["linear"],
    ["get", "intensity"],
    config.min,
    config.colors[0],
    (config.min + config.max) / 2,
    config.colors[1],
    config.max,
    config.colors[2]
  ] as maplibregl.ExpressionSpecification;
};

const buildPopupHtml = (theme: "dark" | "light", properties: Record<string, unknown>) => {
  const formatPopupValue = (value: unknown, digits: number) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed.toFixed(digits) : "N/A";
  };

  return `
    <div style="min-width: 200px">
      <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:${theme === "light" ? "#0f5f73" : "#67e8f9"}">Emirate Node</div>
      <div style="margin-top:6px;font-size:18px;font-weight:700">${properties.emirate}</div>
      <div style="margin-top:6px;font-size:13px;color:${theme === "light" ? "#475569" : "#cbd5e1"}">SPI ${formatPopupValue(properties.spi, 1)} | NDVI ${formatPopupValue(properties.ndvi, 2)} | LST ${formatPopupValue(properties.lst, 1)} C</div>
      <div style="margin-top:4px;font-size:13px;color:${theme === "light" ? "#475569" : "#cbd5e1"}">Soil ${formatPopupValue(properties.soilMoisture, 2)} | Forecast ${formatPopupValue(properties.forecast, 1)}</div>
    </div>
  `;
};

const attachMapInteractions = (
  map: maplibregl.Map,
  popup: maplibregl.Popup,
  onCitySelect: (cityId: string) => void,
  theme: "dark" | "light"
) => {
  const showPopup = (event: maplibregl.MapLayerMouseEvent) => {
    const feature = event.features?.[0];
    const coordinates: [number, number] =
      feature?.geometry?.type === "Point"
        ? [feature.geometry.coordinates[0] ?? 0, feature.geometry.coordinates[1] ?? 0]
        : [0, 0];

    if (!feature?.properties) {
      return;
    }

    map.getCanvas().style.cursor = "pointer";
    popup.setLngLat(coordinates).setHTML(buildPopupHtml(theme, feature.properties as Record<string, unknown>)).addTo(map);
  };

  const hidePopup = () => {
    map.getCanvas().style.cursor = "";
    popup.remove();
  };

  const selectCity = (event: maplibregl.MapLayerMouseEvent) => {
    const feature = event.features?.[0];

    if (feature?.properties?.id) {
      onCitySelect(String(feature.properties.id));
    }
  };

  map.on("mouseenter", "city-markers", showPopup);
  map.on("mouseleave", "city-markers", hidePopup);
  map.on("click", "city-markers", selectCity);
  map.on("mouseenter", "city-selected", showPopup);
  map.on("mouseleave", "city-selected", hidePopup);
  map.on("click", "city-selected", selectCity);
};

const ensureOperationalLayers = (
  map: maplibregl.Map,
  features: maplibregl.GeoJSONSourceSpecification["data"],
  activeMetric: ClimateMetric,
  selectedCityId: string,
  onCitySelect: (cityId: string) => void,
  popup: maplibregl.Popup,
  theme: "dark" | "light"
) => {
  if (!map.getSource(CITIES_SOURCE_ID)) {
    map.addSource(CITIES_SOURCE_ID, {
      type: "geojson",
      data: features
    });
  }

  if (!map.getLayer("risk-zones")) {
    map.addLayer({
      id: "risk-zones",
      type: "circle",
      source: CITIES_SOURCE_ID,
      paint: {
        "circle-color": colorExpressionForMetric(activeMetric),
        "circle-opacity": ["case", ["==", ["get", "visible"], 1], 0.28, 0.08],
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["get", "intensity"],
          0,
          14,
          0.8,
          32,
          48,
          58
        ],
        "circle-blur": 0.85
      }
    });
  }

  if (!map.getLayer("city-markers")) {
    map.addLayer({
      id: "city-markers",
      type: "circle",
      source: CITIES_SOURCE_ID,
      paint: {
        "circle-color": colorExpressionForMetric(activeMetric),
        "circle-radius": 6.5,
        "circle-opacity": ["case", ["==", ["get", "visible"], 1], 1, 0.28],
        "circle-stroke-width": 1.5,
        "circle-stroke-color": "#e2e8f0"
      }
    });
  }

  if (!map.getLayer("critical-halo")) {
    map.addLayer({
      id: "critical-halo",
      type: "circle",
      source: CITIES_SOURCE_ID,
      filter: ["==", ["get", "riskLevel"], "critical"],
      paint: {
        "circle-color": "#ef4444",
        "circle-opacity": 0.12,
        "circle-radius": 28,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#fecdd3"
      }
    });
  }

  if (!map.getLayer("critical-core")) {
    map.addLayer({
      id: "critical-core",
      type: "circle",
      source: CITIES_SOURCE_ID,
      filter: ["==", ["get", "riskLevel"], "critical"],
      paint: {
        "circle-color": "#fb7185",
        "circle-radius": 9,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#fff1f2"
      }
    });
  }

  if (!map.getLayer("city-selected")) {
    map.addLayer({
      id: "city-selected",
      type: "circle",
      source: CITIES_SOURCE_ID,
      paint: {
        "circle-color": "#ffffff",
        "circle-radius": 10,
        "circle-opacity": 0.18,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#7dd3fc"
      },
      filter: ["==", ["get", "id"], selectedCityId]
    });

    attachMapInteractions(map, popup, onCitySelect, theme);
  }

  const source = map.getSource(CITIES_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
  source?.setData(features);
  map.setPaintProperty("risk-zones", "circle-color", colorExpressionForMetric(activeMetric));
  map.setPaintProperty("city-markers", "circle-color", colorExpressionForMetric(activeMetric));
  map.setFilter("city-selected", ["==", ["get", "id"], selectedCityId]);
};

export const MapPanel = ({
  snapshot,
  theme,
  activeMetric,
  selectedCityId,
  timelineIndex,
  severityFilter,
  onMetricChange,
  onCitySelect,
  onTimelineChange
}: MapPanelProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(new maplibregl.Popup({
    closeButton: false,
    closeOnClick: false,
    offset: 18
  }));
  const selectedCity = getSelectedCity(snapshot, selectedCityId);
  const selectedPoint = getTimelinePoint(selectedCity, timelineIndex);
  const summary = buildForecastSummary(selectedCity, timelineIndex);
  const criticalSignals = snapshot.cities.filter((city) => getTimelinePoint(city, timelineIndex).riskLevel === "critical").length;
  const selectedIsCritical = selectedPoint.riskLevel === "critical";
  const timelineInset = snapshot.timeline.length ? 100 / (snapshot.timeline.length * 2) : 4.16;
  const timelineDotPosition = snapshot.timeline.length ? ((timelineIndex + 0.5) / snapshot.timeline.length) * 100 : 50;

  const features = useMemo(
    () => buildCityFeatureCollection(snapshot, timelineIndex, activeMetric, severityFilter),
    [activeMetric, severityFilter, snapshot, timelineIndex]
  );

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    popupRef.current?.remove();
    mapRef.current?.remove();

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: createBaseStyle(theme, activeMetric === "satellite"),
      center: [55.2, 25.1],
      zoom: 6.3,
      minZoom: 5.3,
      maxZoom: 12.5
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right");

    map.on("load", () => {
      ensureOperationalLayers(map, features, activeMetric, selectedCityId, onCitySelect, popupRef.current!, theme);
    });

    mapRef.current = map;

    return () => {
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [theme, onCitySelect]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !map.isStyleLoaded()) {
      return;
    }

    ensureOperationalLayers(map, features, activeMetric, selectedCityId, onCitySelect, popupRef.current!, theme);
    const isSatellite = activeMetric === "satellite";
    map.setPaintProperty(BASE_RASTER_LAYER_ID, "raster-opacity", isSatellite ? 0 : 1);
    map.setPaintProperty(SATELLITE_RASTER_LAYER_ID, "raster-opacity", isSatellite ? 1 : 0);
  }, [activeMetric, features, onCitySelect, selectedCityId, theme]);

  useEffect(() => {
    mapRef.current?.resize();
  }, [snapshot, timelineIndex, severityFilter]);

  return (
    <section className="ev-panel relative self-start overflow-hidden rounded-[30px] border border-white/10 bg-slate-950/55 shadow-glow backdrop-blur-xl xl:h-full xl:min-h-0">
      <div className={cn("absolute inset-0 bg-dashboard-radial", theme === "light" ? "opacity-30" : "opacity-70")} />
      <div className="relative flex flex-col xl:h-full">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/8 px-4 py-3.5">
          <div>
            <div className="flex items-center gap-2">
              <MapPinned className="h-4 w-4 text-cyan-200" />
              <p className="font-display text-lg text-white">UAE Climate Operations Map</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(metricConfig).map(([metric, config]) => {
              const Icon = config.icon;
              return (
                <button
                  key={metric}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition",
                    activeMetric === metric
                      ? "bg-white text-slate-950"
                      : "ev-control border border-white/10 bg-white/5 text-slate-200 hover:border-cyan-400/30 hover:text-white"
                  )}
                  onClick={() => onMetricChange(metric as ClimateMetric)}
                >
                  <Icon className="h-4 w-4" />
                  {config.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative min-h-[340px] md:min-h-[400px] xl:min-h-0 xl:flex-1">
          <div ref={containerRef} className="h-[340px] w-full md:h-[400px] xl:h-full" />

          {criticalSignals > 0 ? (
            <div
              className={cn(
                "pointer-events-none absolute right-3 top-3 rounded-full border border-rose-400/30 bg-rose-500/15 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-100 shadow-ember",
                theme === "light" && "border-rose-300/70 bg-rose-100/95 text-rose-700"
              )}
            >
              Red signal live - {criticalSignals} hotspot{criticalSignals > 1 ? "s" : ""}
            </div>
          ) : null}

          <div
            className={cn(
              "pointer-events-none absolute left-3 top-3 max-w-[260px] rounded-[18px] border border-white/10 bg-slate-950/88 px-3 py-2.5 backdrop-blur-xl",
              theme === "light" && "border-slate-300/70 bg-white/94 shadow-[0_12px_28px_rgba(148,163,184,0.16)]"
            )}
          >
            <p className={cn("text-[11px] uppercase tracking-[0.22em] text-cyan-200", selectedIsCritical && "text-rose-200")}>Intelligence Tip</p>
            <p className="mt-1.5 line-clamp-3 text-[13px] leading-5 text-slate-200">
              Focus on {selectedCity.emirate}: {selectedCity.summaryText}
            </p>
          </div>

          <div
            className={cn(
              "pointer-events-none absolute bottom-3 left-3 max-w-[300px] rounded-[18px] border border-white/10 bg-slate-950/88 px-3 py-2.5 backdrop-blur-xl",
              theme === "light" && !selectedIsCritical && "border-slate-300/70 bg-white/94 shadow-[0_12px_28px_rgba(148,163,184,0.16)]",
              selectedIsCritical && "border-rose-400/30 bg-rose-950/55 shadow-ember",
              selectedIsCritical && theme === "light" && "border-rose-300/70 bg-rose-100/96 shadow-[0_12px_28px_rgba(244,63,94,0.14)]"
            )}
          >
            <p className={cn("text-[11px] uppercase tracking-[0.22em] text-cyan-200", selectedIsCritical && "text-rose-200")}>Forecast Summary</p>
            <p className="mt-1.5 font-display text-[15px] text-white">{summary.headline}</p>
            <p className="mt-1 line-clamp-3 text-[13px] leading-5 text-slate-300">{summary.detail}</p>
            <p className={cn("mt-1.5 text-[10px] uppercase tracking-[0.18em] text-teal-200", selectedIsCritical && "text-rose-200")}>{summary.signal}</p>
          </div>
        </div>

        <div className="border-t border-white/8 px-4 py-2.5">
          <div className="relative px-1 pt-1">
            <div
              className={cn(
                "pointer-events-none absolute left-1 right-1 top-[13px] h-px rounded-full",
                theme === "light" ? "bg-slate-300/70" : "bg-white/12"
              )}
              style={{ left: `${timelineInset}%`, right: `${timelineInset}%` }}
            />
            <div
              className={cn(
                "pointer-events-none absolute top-[7px] h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-cyan-300",
                theme === "light"
                  ? "shadow-[0_0_14px_rgba(76,199,223,0.26)]"
                  : "shadow-[0_0_16px_rgba(34,211,238,0.34)]"
              )}
              style={{ left: `calc(${timelineDotPosition}% - 7px)` }}
            />
            <div className="grid grid-cols-12 gap-0">
              {snapshot.timeline.map((entry, index) => (
                <button
                  key={entry}
                  type="button"
                  onClick={() => onTimelineChange(index)}
                  className="flex flex-col items-center justify-start bg-transparent px-0 pt-5 text-center"
                  aria-label={`Select ${formatMonth(entry)}`}
                >
                  <span className={cn("text-[11px] uppercase tracking-[0.18em] text-slate-500 transition", index === timelineIndex && "text-cyan-200")}>
                    {formatMonth(entry)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

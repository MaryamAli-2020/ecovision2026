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

const createBaseStyle = (): maplibregl.StyleSpecification => ({
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    darkRaster: {
      type: "raster",
      tiles: ["https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"],
      tileSize: 256
    },
    lightRaster: {
      type: "raster",
      tiles: ["https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"],
      tileSize: 256
    },
    satelliteRaster: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      ],
      tileSize: 256
    },
    cities: {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: []
      }
    }
  },
  layers: [
    {
      id: "dark-raster",
      type: "raster",
      source: "darkRaster",
      paint: {
        "raster-opacity": 1
      }
    },
    {
      id: "light-raster",
      type: "raster",
      source: "lightRaster",
      paint: {
        "raster-opacity": 0
      }
    },
    {
      id: "satellite-raster",
      type: "raster",
      source: "satelliteRaster",
      paint: {
        "raster-opacity": 0
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
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const selectedCity = getSelectedCity(snapshot, selectedCityId);
  const selectedPoint = getTimelinePoint(selectedCity, timelineIndex);
  const summary = buildForecastSummary(selectedCity, timelineIndex);
  const criticalSignals = snapshot.cities.filter((city) => getTimelinePoint(city, timelineIndex).riskLevel === "critical").length;
  const selectedIsCritical = selectedPoint.riskLevel === "critical";

  const features = useMemo(
    () => buildCityFeatureCollection(snapshot, timelineIndex, activeMetric, severityFilter),
    [activeMetric, severityFilter, snapshot, timelineIndex]
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: createBaseStyle(),
      center: [55.2, 25.1],
      zoom: 6.3,
      minZoom: 5.3,
      maxZoom: 12.5
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right");
    popupRef.current = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 18
    });

    map.on("load", () => {
      map.addLayer({
        id: "risk-zones",
        type: "circle",
        source: "cities",
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

      map.addLayer({
        id: "city-markers",
        type: "circle",
        source: "cities",
        paint: {
          "circle-color": colorExpressionForMetric(activeMetric),
          "circle-radius": 6.5,
          "circle-opacity": ["case", ["==", ["get", "visible"], 1], 1, 0.28],
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#e2e8f0"
        }
      });

      map.addLayer({
        id: "critical-halo",
        type: "circle",
        source: "cities",
        filter: ["==", ["get", "riskLevel"], "critical"],
        paint: {
          "circle-color": "#ef4444",
          "circle-opacity": 0.12,
          "circle-radius": 28,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fecdd3"
        }
      });

      map.addLayer({
        id: "critical-core",
        type: "circle",
        source: "cities",
        filter: ["==", ["get", "riskLevel"], "critical"],
        paint: {
          "circle-color": "#fb7185",
          "circle-radius": 9,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff1f2"
        }
      });

      map.addLayer({
        id: "city-selected",
        type: "circle",
        source: "cities",
        paint: {
          "circle-color": "#ffffff",
          "circle-radius": 10,
          "circle-opacity": 0.18,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#7dd3fc"
        },
        filter: ["==", ["get", "id"], selectedCityId]
      });

      const source = map.getSource("cities") as maplibregl.GeoJSONSource | undefined;
      source?.setData(features);

      const showPopup = (event: maplibregl.MapLayerMouseEvent) => {
        const feature = event.features?.[0];
        const coordinates: [number, number] =
          feature?.geometry?.type === "Point"
            ? [feature.geometry.coordinates[0] ?? 0, feature.geometry.coordinates[1] ?? 0]
            : [0, 0];

        if (!feature?.properties) {
          return;
        }

        const formatPopupValue = (value: unknown, digits: number) => {
          const parsed = Number(value);
          return Number.isFinite(parsed) ? parsed.toFixed(digits) : "N/A";
        };

        map.getCanvas().style.cursor = "pointer";
        popupRef.current
          ?.setLngLat(coordinates)
          .setHTML(`
            <div style="min-width: 200px">
              <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#67e8f9">Emirate Node</div>
              <div style="margin-top:6px;font-size:18px;font-weight:700">${feature.properties.emirate}</div>
              <div style="margin-top:6px;font-size:13px;color:#cbd5e1">SPI ${formatPopupValue(feature.properties.spi, 1)} | NDVI ${formatPopupValue(feature.properties.ndvi, 2)} | LST ${formatPopupValue(feature.properties.lst, 1)} C</div>
              <div style="margin-top:4px;font-size:13px;color:#cbd5e1">Soil ${formatPopupValue(feature.properties.soilMoisture, 2)} | Forecast ${formatPopupValue(feature.properties.forecast, 1)}</div>
            </div>
          `)
          .addTo(map);
      };

      const hidePopup = () => {
        map.getCanvas().style.cursor = "";
        popupRef.current?.remove();
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
    });

    mapRef.current = map;

    return () => {
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [activeMetric, onCitySelect, selectedCityId, severityFilter]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !map.isStyleLoaded()) {
      return;
    }

    const source = map.getSource("cities") as maplibregl.GeoJSONSource | undefined;
    source?.setData(features);

    map.setPaintProperty("risk-zones", "circle-color", colorExpressionForMetric(activeMetric));
    map.setPaintProperty("city-markers", "circle-color", colorExpressionForMetric(activeMetric));
    const isSatellite = activeMetric === "satellite";
    map.setPaintProperty("dark-raster", "raster-opacity", isSatellite || theme === "light" ? 0 : 1);
    map.setPaintProperty("light-raster", "raster-opacity", isSatellite || theme === "dark" ? 0 : 1);
    map.setPaintProperty("satellite-raster", "raster-opacity", activeMetric === "satellite" ? 1 : 0);
    map.setFilter("city-selected", ["==", ["get", "id"], selectedCityId]);
  }, [activeMetric, features, selectedCityId, theme]);

  useEffect(() => {
    mapRef.current?.resize();
  }, [snapshot, timelineIndex, severityFilter]);

  return (
    <section className="ev-panel relative self-start overflow-hidden rounded-[30px] border border-white/10 bg-slate-950/55 shadow-glow backdrop-blur-xl xl:h-full xl:min-h-0">
      <div className="absolute inset-0 bg-dashboard-radial opacity-70" />
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
            <div className="pointer-events-none absolute right-3 top-3 rounded-full border border-rose-400/30 bg-rose-500/15 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-100 shadow-ember">
              Red signal live - {criticalSignals} hotspot{criticalSignals > 1 ? "s" : ""}
            </div>
          ) : null}

          <div className="pointer-events-none absolute left-3 top-3 max-w-[260px] rounded-[18px] border border-white/10 bg-slate-950/88 px-3 py-2.5 backdrop-blur-xl">
            <p className={cn("text-[11px] uppercase tracking-[0.22em] text-cyan-200", selectedIsCritical && "text-rose-200")}>Intelligence Tip</p>
            <p className="mt-1.5 line-clamp-3 text-[13px] leading-5 text-slate-200">
              Focus on {selectedCity.emirate}: {selectedCity.summaryText}
            </p>
          </div>

          <div
            className={cn(
              "pointer-events-none absolute bottom-3 left-3 max-w-[300px] rounded-[18px] border border-white/10 bg-slate-950/88 px-3 py-2.5 backdrop-blur-xl",
              selectedIsCritical && "border-rose-400/30 bg-rose-950/55 shadow-ember"
            )}
          >
            <p className={cn("text-[11px] uppercase tracking-[0.22em] text-cyan-200", selectedIsCritical && "text-rose-200")}>Forecast Summary</p>
            <p className="mt-1.5 font-display text-[15px] text-white">{summary.headline}</p>
            <p className="mt-1 line-clamp-3 text-[13px] leading-5 text-slate-300">{summary.detail}</p>
            <p className={cn("mt-1.5 text-[10px] uppercase tracking-[0.18em] text-teal-200", selectedIsCritical && "text-rose-200")}>{summary.signal}</p>
          </div>
        </div>

        <div className="border-t border-white/8 px-4 py-2.5">
          <div className="grid gap-3">
            <div className="px-1 py-1">
              <input
                type="range"
                min={0}
                max={snapshot.timeline.length - 1}
                value={timelineIndex}
                onChange={(event) => onTimelineChange(Number(event.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-cyan-300"
              />
              <div className="mt-3 flex justify-between text-[11px] uppercase tracking-[0.18em] text-slate-500">
                {snapshot.timeline.map((entry, index) => (
                  <span key={entry} className={cn(index === timelineIndex && "text-cyan-200")}>
                    {formatMonth(entry)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
